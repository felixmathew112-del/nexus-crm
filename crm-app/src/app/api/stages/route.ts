import { db } from "@/db";
import { stages } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(stages).orderBy(asc(stages.order));
  return NextResponse.json(rows);
}
