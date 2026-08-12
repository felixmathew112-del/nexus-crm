import { db } from "@/db";
import { activities, contacts, deals, tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

// Merges `loserId` into the contact at [id] ("the winner"): the loser's
// deals/activities/tasks move over, any fields the winner is missing get
// filled in from the loser, and the loser is deleted.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const loserId = body.loserId;
  if (!loserId || loserId === id) {
    return NextResponse.json({ error: "Pick a different contact to merge" }, { status: 400 });
  }

  const [winner] = await db.select().from(contacts).where(eq(contacts.id, id));
  const [loser] = await db.select().from(contacts).where(eq(contacts.id, loserId));
  if (!winner || !loser) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await db.update(deals).set({ contactId: id }).where(eq(deals.contactId, loserId));
  await db.update(activities).set({ contactId: id }).where(eq(activities.contactId, loserId));
  await db.update(tasks).set({ contactId: id }).where(eq(tasks.contactId, loserId));

  const fillFields: Record<string, string> = {};
  if (!winner.company && loser.company) fillFields.company = loser.company;
  if (!winner.email && loser.email) fillFields.email = loser.email;
  if (!winner.phone && loser.phone) fillFields.phone = loser.phone;
  if (!winner.source && loser.source) fillFields.source = loser.source;

  let mergedWinner = winner;
  if (Object.keys(fillFields).length > 0) {
    [mergedWinner] = await db
      .update(contacts)
      .set(fillFields)
      .where(eq(contacts.id, id))
      .returning();
  }

  await db.delete(contacts).where(eq(contacts.id, loserId));

  return NextResponse.json(mergedWinner);
}
