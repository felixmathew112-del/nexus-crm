import { db } from "@/db";
import { activities, contacts, deals, tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { notifyAssignment } from "@/lib/notify";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const [existing] = await db.select().from(contacts).where(eq(contacts.id, id));
  const newOwnerId = body.ownerId ?? null;

  const [updated] = await db
    .update(contacts)
    .set({
      name: body.name,
      company: body.company ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      source: body.source ?? null,
      ownerId: newOwnerId,
    })
    .where(eq(contacts.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  if (newOwnerId !== existing?.ownerId) {
    await notifyAssignment({
      actingUserId: user.id,
      newOwnerId,
      type: "contact_assigned",
      contactId: updated.id,
      message: `${user.name} assigned you a contact: ${updated.name}`,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existingDeal] = await db.select().from(deals).where(eq(deals.contactId, id)).limit(1);
  if (existingDeal) {
    return NextResponse.json(
      { error: "This contact has deals attached. Delete or reassign those deals first." },
      { status: 409 }
    );
  }

  await db.delete(activities).where(eq(activities.contactId, id));
  await db.delete(tasks).where(eq(tasks.contactId, id));
  const [deleted] = await db.delete(contacts).where(eq(contacts.id, id)).returning();

  if (!deleted) return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
