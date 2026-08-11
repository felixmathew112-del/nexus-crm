import { db } from "@/db";
import { activities, deals } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const rows = await db.select().from(activities);
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
  await db.insert(activities).values(newActivity);

  if (newActivity.dealId) {
    await db
      .update(deals)
      .set({ staleSince: null, updatedAt: new Date().toISOString() })
      .where(eq(deals.id, newActivity.dealId));
  }

  return NextResponse.json(newActivity, { status: 201 });
}
