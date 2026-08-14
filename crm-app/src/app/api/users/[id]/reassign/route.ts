import { db } from "@/db";
import { contacts, deals, users } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { notifyAssignment } from "@/lib/notify";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const ownedContacts = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.ownerId, id));
  const ownedDeals = await db.select({ id: deals.id }).from(deals).where(eq(deals.ownerId, id));
  return NextResponse.json({ contacts: ownedContacts.length, deals: ownedDeals.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: fromUserId } = await params;
  const body = await req.json();
  const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";

  if (!toUserId) {
    return NextResponse.json({ error: "Choose who to reassign to" }, { status: 400 });
  }
  if (toUserId === fromUserId) {
    return NextResponse.json({ error: "Choose a different owner" }, { status: 400 });
  }

  const [fromUser] = await db.select().from(users).where(eq(users.id, fromUserId));
  const [toUser] = await db.select().from(users).where(eq(users.id, toUserId));
  if (!fromUser || !toUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const reassignedContacts = await db
    .update(contacts)
    .set({ ownerId: toUserId })
    .where(eq(contacts.ownerId, fromUserId))
    .returning({ id: contacts.id });
  const reassignedDeals = await db
    .update(deals)
    .set({ ownerId: toUserId })
    .where(eq(deals.ownerId, fromUserId))
    .returning({ id: deals.id });

  if (reassignedContacts.length > 0 || reassignedDeals.length > 0) {
    await notifyAssignment({
      actingUserId: user.id,
      newOwnerId: toUserId,
      type: "bulk_reassignment",
      message: `${user.name} reassigned ${fromUser.name}'s book to you: ${reassignedContacts.length} contact${reassignedContacts.length === 1 ? "" : "s"} and ${reassignedDeals.length} deal${reassignedDeals.length === 1 ? "" : "s"}`,
    });
  }

  return NextResponse.json({
    contacts: reassignedContacts.length,
    deals: reassignedDeals.length,
  });
}
