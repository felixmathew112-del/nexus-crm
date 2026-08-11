import { db } from "@/db";
import { tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const rows = await db.select().from(tasks);
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
  await db.insert(tasks).values(newTask);
  return NextResponse.json(newTask, { status: 201 });
}
