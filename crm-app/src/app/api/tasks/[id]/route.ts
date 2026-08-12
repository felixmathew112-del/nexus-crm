import { db } from "@/db";
import { tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { notifyAssignment } from "@/lib/notify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));

  const update: Record<string, unknown> = {};
  if (body.done !== undefined) update.done = body.done;
  if (body.ownerId !== undefined) update.ownerId = body.ownerId;

  const [updated] = await db.update(tasks).set(update).where(eq(tasks.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  if (body.ownerId !== undefined && body.ownerId !== existing?.ownerId) {
    await notifyAssignment({
      actingUserId: user.id,
      newOwnerId: body.ownerId,
      type: "task_assigned",
      message: `${user.name} assigned you a task: ${updated.title}`,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
