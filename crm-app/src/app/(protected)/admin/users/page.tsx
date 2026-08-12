import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "manager" && currentUser.role !== "admin")) {
    redirect("/");
  }

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Users</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage who&apos;s on the team and what they can see.
        </p>
      </div>

      <UsersTable users={rows} currentUser={currentUser} />
    </div>
  );
}
