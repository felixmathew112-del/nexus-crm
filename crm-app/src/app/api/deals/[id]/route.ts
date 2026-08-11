import { db } from "@/db";
import { deals } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await db
    .update(deals)
    .set({ stageId: body.stageId, updatedAt: new Date().toISOString(), staleSince: null })
    .where(eq(deals.id, id));
  return NextResponse.json({ ok: true });
}
