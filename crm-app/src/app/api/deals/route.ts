import { db } from "@/db";
import { deals, contacts } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { notifyAssignment } from "@/lib/notify";

export async function GET() {
  const rows = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      contactId: deals.contactId,
      contactName: contacts.name,
      contactCompany: contacts.company,
      expectedCloseDate: deals.expectedCloseDate,
      staleSince: deals.staleSince,
      ownerId: deals.ownerId,
      lostReason: deals.lostReason,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const newDeal = {
    id: randomUUID(),
    title: body.title,
    contactId: body.contactId,
    stageId: body.stageId,
    value: body.value ?? 0,
    expectedCloseDate: body.expectedCloseDate ?? null,
    ownerId: body.ownerId !== undefined ? body.ownerId : user.id,
    lostReason: body.lostReason ?? null,
  };
  await db.insert(deals).values(newDeal);
  await notifyAssignment({
    actingUserId: user.id,
    newOwnerId: newDeal.ownerId,
    type: "deal_assigned",
    dealId: newDeal.id,
    message: `${user.name} assigned you a new deal: ${newDeal.title}`,
  });
  return NextResponse.json(newDeal, { status: 201 });
}
