import { db } from "@/db";
import { deals, stages } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const LOCKED_STAGE_NAMES = ["Won", "Lost"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [stage] = await db.select().from(stages).where(eq(stages.id, id));
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  const body = await req.json();
  const update: Partial<typeof stages.$inferInsert> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
    }
    if (LOCKED_STAGE_NAMES.includes(stage.name) && name !== stage.name) {
      return NextResponse.json(
        { error: `"${stage.name}" can't be renamed — other pages rely on this name` },
        { status: 400 }
      );
    }
    if (name !== stage.name) {
      const [existing] = await db.select().from(stages).where(eq(stages.name, name));
      if (existing) {
        return NextResponse.json(
          { error: "A stage with that name already exists" },
          { status: 409 }
        );
      }
    }
    update.name = name;
  }

  if (body.color !== undefined) {
    const color = typeof body.color === "string" ? body.color.trim() : "";
    if (!HEX_COLOR.test(color)) {
      return NextResponse.json(
        { error: "Color must be a hex value like #6366f1" },
        { status: 400 }
      );
    }
    update.color = color;
  }

  if (body.probability !== undefined) {
    if (typeof body.probability !== "number" || !Number.isFinite(body.probability)) {
      return NextResponse.json({ error: "Probability must be a number" }, { status: 400 });
    }
    update.probability = Math.min(100, Math.max(0, Math.round(body.probability)));
  }

  if (body.order !== undefined) {
    if (typeof body.order !== "number" || !Number.isFinite(body.order)) {
      return NextResponse.json({ error: "Order must be a number" }, { status: 400 });
    }
    update.order = body.order;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes supplied" }, { status: 400 });
  }

  const [updated] = await db
    .update(stages)
    .set(update)
    .where(eq(stages.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [stage] = await db.select().from(stages).where(eq(stages.id, id));
  if (!stage) return NextResponse.json({ error: "Stage not found" }, { status: 404 });

  if (LOCKED_STAGE_NAMES.includes(stage.name)) {
    return NextResponse.json(
      { error: `"${stage.name}" can't be deleted — other pages rely on this stage existing` },
      { status: 400 }
    );
  }

  const dealsInStage = await db.select({ id: deals.id }).from(deals).where(eq(deals.stageId, id));
  if (dealsInStage.length > 0) {
    return NextResponse.json(
      {
        error: `Move the ${dealsInStage.length} deal${dealsInStage.length === 1 ? "" : "s"} in this stage before deleting it`,
      },
      { status: 409 }
    );
  }

  await db.delete(stages).where(eq(stages.id, id));
  return NextResponse.json({ ok: true });
}
