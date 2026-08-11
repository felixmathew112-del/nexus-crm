import { db } from "@/db";
import { activities, deals } from "@/db/schema";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");
  const contactId = searchParams.get("contactId");
  const condition = dealId
    ? eq(activities.dealId, dealId)
    : contactId
      ? eq(activities.contactId, contactId)
      : undefined;

  const rows = await db
    .select()
    .from(activities)
    .where(condition)
    .orderBy(desc(activities.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const newActivity = {
    id: randomUUID(),
    contactId: body.contactId,
    dealId: body.dealId ?? null,
    type: body.type,
    content: body.content,
    authorId: user.id,
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
