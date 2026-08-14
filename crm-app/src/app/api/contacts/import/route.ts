import { db } from "@/db";
import { contacts, users } from "@/db/schema";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

const MAX_ROWS = 1000;

type ImportRow = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  owner?: string;
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Import is limited to ${MAX_ROWS} rows at a time` }, { status: 400 });
  }

  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
  const userByEmail = new Map(allUsers.map((u) => [u.email.toLowerCase(), u]));
  const userByName = new Map(allUsers.map((u) => [u.name.toLowerCase(), u]));

  const existingContacts = await db.select({ email: contacts.email }).from(contacts);
  const existingEmails = new Set(
    existingContacts.map((c) => c.email?.toLowerCase()).filter((e): e is string => !!e)
  );

  const toInsert: (typeof contacts.$inferInsert)[] = [];
  let skippedDuplicates = 0;
  let skippedInvalid = 0;
  const seenInBatch = new Set<string>();

  for (const row of rows) {
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!name) {
      skippedInvalid++;
      continue;
    }

    const email = typeof row.email === "string" ? row.email.trim() : "";
    const emailKey = email.toLowerCase();
    if (emailKey && (existingEmails.has(emailKey) || seenInBatch.has(emailKey))) {
      skippedDuplicates++;
      continue;
    }
    if (emailKey) seenInBatch.add(emailKey);

    const ownerRaw = typeof row.owner === "string" ? row.owner.trim() : "";
    const matchedOwner = ownerRaw
      ? userByEmail.get(ownerRaw.toLowerCase()) ?? userByName.get(ownerRaw.toLowerCase())
      : undefined;

    toInsert.push({
      id: randomUUID(),
      name,
      company: (typeof row.company === "string" && row.company.trim()) || null,
      email: email || null,
      phone: (typeof row.phone === "string" && row.phone.trim()) || null,
      source: (typeof row.source === "string" && row.source.trim()) || null,
      // Unmatched or blank owner falls back to whoever is running the
      // import, same default the single-contact "New contact" form uses.
      ownerId: matchedOwner?.id ?? user.id,
    });
  }

  if (toInsert.length > 0) {
    await db.insert(contacts).values(toInsert);
  }

  return NextResponse.json({
    created: toInsert.length,
    skippedDuplicates,
    skippedInvalid,
  });
}
