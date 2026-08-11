import { db } from "@/db";
import { contacts, users } from "@/db/schema";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { count } from "drizzle-orm";

// Cycles new contacts across sales reps in name order. Stateless by design:
// the existing contact count doubles as the round-robin position, so it
// doesn't depend on in-memory state that wouldn't survive a restart.
async function nextRoundRobinOwner() {
  const reps = await db.select().from(users).orderBy(users.name);
  if (reps.length === 0) return null;
  const [{ value }] = await db.select({ value: count() }).from(contacts);
  return reps[value % reps.length].id;
}

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
    ownerId: body.ownerId ?? (await nextRoundRobinOwner()),
  };
  await db.insert(contacts).values(newContact);
  return NextResponse.json(newContact, { status: 201 });
}
