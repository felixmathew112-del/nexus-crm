import { db } from "@/db";
import { activities, deals } from "@/db/schema";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const dealId = new URL(req.url).searchParams.get("dealId");
  const rows = await db
    .select()
    .from(activities)
    .where(dealId ? eq(activities.dealId, dealId) : undefined)
    .orderBy(desc(activities.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newActivity = {
    id: randomUUID(),
    contactId: body.contactId,
    dealId: body.dealId ?? null,
    type: body.type,
    content: body.content,
    authorId: body.authorId ?? null,
  };
  const [inserted] = await db.insert(activities).values(newActivity).returning();

  if (newActivity.dealId) {
    await db
      .update(deals)
      .set({ staleSince: null, updatedAt: new Date().toISOString() })
      .where(eq(deals.id, newActivity.dealId));
  }

  return NextResponse.json(inserted, { status: 201 });
}
