import { db } from "@/db";
import { tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");
  const contactId = searchParams.get("contactId");
  const condition = dealId
    ? eq(tasks.dealId, dealId)
    : contactId
      ? eq(tasks.contactId, contactId)
      : undefined;

  const rows = await db
    .select()
    .from(tasks)
    .where(condition)
    .orderBy(desc(tasks.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newTask = {
    id: randomUUID(),
    dealId: body.dealId ?? null,
    contactId: body.contactId ?? null,
    title: body.title,
    dueDate: body.dueDate ?? null,
    ownerId: body.ownerId ?? null,
  };
  const [inserted] = await db.insert(tasks).values(newTask).returning();
  return NextResponse.json(inserted, { status: 201 });
}
