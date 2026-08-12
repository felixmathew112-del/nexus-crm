import { db } from "@/db";
import { contacts } from "@/db/schema";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { notifyAssignment } from "@/lib/notify";

export async function GET() {
  const rows = await db.select().from(contacts);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const newContact = {
    id: randomUUID(),
    name: body.name,
    company: body.company ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    source: body.source ?? null,
    ownerId: body.ownerId !== undefined ? body.ownerId : user.id,
  };
  await db.insert(contacts).values(newContact);
  await notifyAssignment({
    actingUserId: user.id,
    newOwnerId: newContact.ownerId,
    type: "contact_assigned",
    contactId: newContact.id,
    message: `${user.name} assigned you a new contact: ${newContact.name}`,
  });
  return NextResponse.json(newContact, { status: 201 });
}
