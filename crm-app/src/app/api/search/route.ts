import { db } from "@/db";
import { contacts, deals, stages } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, like, or } from "drizzle-orm";

const RESULT_LIMIT = 8;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ contacts: [], deals: [] });

  const pattern = `%${q}%`;

  const matchedContacts = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      company: contacts.company,
      email: contacts.email,
    })
    .from(contacts)
    .where(
      or(
        like(contacts.name, pattern),
        like(contacts.company, pattern),
        like(contacts.email, pattern),
        like(contacts.phone, pattern)
      )
    )
    .limit(RESULT_LIMIT);

  const matchedDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      contactName: contacts.name,
      contactCompany: contacts.company,
      stageName: stages.name,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .leftJoin(stages, eq(deals.stageId, stages.id))
    .where(
      or(like(deals.title, pattern), like(contacts.name, pattern), like(contacts.company, pattern))
    )
    .limit(RESULT_LIMIT);

  return NextResponse.json({ contacts: matchedContacts, deals: matchedDeals });
}
