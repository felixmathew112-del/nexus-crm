import { db } from "@/db";
import { activities, deals, tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.title !== undefined) update.title = body.title;
  if (body.contactId !== undefined) update.contactId = body.contactId;
  if (body.value !== undefined) update.value = body.value;
  if (body.expectedCloseDate !== undefined) update.expectedCloseDate = body.expectedCloseDate;
  if (body.ownerId !== undefined) update.ownerId = body.ownerId;
  if (body.stageId !== undefined) {
    update.stageId = body.stageId;
    // A stage move counts as engagement with the deal - clear the at-risk flag.
    // (Editing other fields alone does not; that's driven by the activity log.)
    update.staleSince = null;
  }

  const [updated] = await db.update(deals).set(update).where(eq(deals.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(activities).where(eq(activities.dealId, id));
  await db.delete(tasks).where(eq(tasks.dealId, id));
  const [deleted] = await db.delete(deals).where(eq(deals.id, id)).returning();

  if (!deleted) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
