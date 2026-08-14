import { db } from "@/db";
import { stages } from "@/db/schema";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const rows = await db.select().from(stages).orderBy(asc(stages.order));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const color = typeof body.color === "string" ? body.color.trim() : "";
  const probability =
    typeof body.probability === "number" && Number.isFinite(body.probability)
      ? Math.min(100, Math.max(0, Math.round(body.probability)))
      : 50;

  if (!name) {
    return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
  }
  if (!HEX_COLOR.test(color)) {
    return NextResponse.json({ error: "Color must be a hex value like #6366f1" }, { status: 400 });
  }
  if (name === "Won" || name === "Lost") {
    return NextResponse.json(
      { error: `"${name}" is reserved for the built-in stage of that name` },
      { status: 400 }
    );
  }

  const [existing] = await db.select().from(stages).where(eq(stages.name, name));
  if (existing) {
    return NextResponse.json({ error: "A stage with that name already exists" }, { status: 409 });
  }

  // New stages land just before "Won"/"Lost" so the pipeline's terminal
  // stages stay last, rather than tacked on after them.
  const allStages = await db.select().from(stages).orderBy(asc(stages.order));
  const closingOrder = allStages.find((s) => s.name === "Won" || s.name === "Lost")?.order;
  const insertOrder = closingOrder ?? (allStages.at(-1)?.order ?? 0) + 1;

  const newStage = {
    id: randomUUID(),
    name,
    order: insertOrder,
    color,
    probability,
  };

  db.transaction((tx) => {
    for (const s of allStages) {
      if (s.order >= insertOrder) {
        tx.update(stages).set({ order: s.order + 1 }).where(eq(stages.id, s.id)).run();
      }
    }
    tx.insert(stages).values(newStage).run();
  });

  return NextResponse.json(newStage, { status: 201 });
}
