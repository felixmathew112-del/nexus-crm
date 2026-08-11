import { db } from "@/db";
import { tasks } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  await db.update(tasks).set({ done: body.done }).where(eq(tasks.id, id));
  return NextResponse.json({ ok: true });
}
