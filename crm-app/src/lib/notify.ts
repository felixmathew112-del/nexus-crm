import { db } from "@/db";
import { notifications } from "@/db/schema";
import { randomUUID } from "crypto";

// Notifies `newOwnerId` that a deal/contact/task was just assigned to them.
// No-ops if there's no new owner, or if they assigned it to themselves.
export async function notifyAssignment({
  actingUserId,
  newOwnerId,
  type,
  dealId,
  contactId,
  message,
}: {
  actingUserId: string;
  newOwnerId: string | null | undefined;
  type: "deal_assigned" | "contact_assigned" | "task_assigned";
  dealId?: string | null;
  contactId?: string | null;
  message: string;
}) {
  if (!newOwnerId || newOwnerId === actingUserId) return;
  await db.insert(notifications).values({
    id: randomUUID(),
    userId: newOwnerId,
    type,
    dealId: dealId ?? null,
    contactId: contactId ?? null,
    message,
  });
}
