import { db } from "@/db";
import { contacts } from "@/db/schema";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const rows = await db.select().from(contacts);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newContact = {
    id: randomUUID(),
    name: body.name,
    company: body.company ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    source: body.source ?? null,
  };
  await db.insert(contacts).values(newContact);
  return NextResponse.json(newContact, { status: 201 });
}
