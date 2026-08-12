import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// A minimal user list (id + name only) for populating owner-assignment
// dropdowns. Unlike /api/users, this is available to any authenticated
// user, not just managers/admins.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select({ id: users.id, name: users.name }).from(users);
  return NextResponse.json(rows);
}
