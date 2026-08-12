import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "manager" && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users);
  return NextResponse.json(rows);
}
