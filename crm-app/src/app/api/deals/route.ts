import { db } from "@/db";
import { deals, contacts } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newDeal = {
    id: randomUUID(),
    title: body.title,
    contactId: body.contactId,
    stageId: body.stageId,
    value: body.value ?? 0,
    expectedCloseDate: body.expectedCloseDate ?? null,
  };
  await db.insert(deals).values(newDeal);
  return NextResponse.json(newDeal, { status: 201 });
}
