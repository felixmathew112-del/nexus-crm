"use client";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

type User = { id: string; name: string; email: string; role: string | null };
type CurrentUser = { id: string; role: string | null };

const ROLES = ["rep", "manager", "admin"] as const;

export default function UsersTable({
  users: initialUsers,
  currentUser,
}: {
  users: User[];
  currentUser: CurrentUser;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleRoleChange(user: User, role: string) {
    const previousRole = user.role;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
    setSavingId(user.id);

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSavingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.error ?? "Couldn't update this user's role.");
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: previousRole } : u)));
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--surface)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => {
            const isSelf = u.id === currentUser.id;
            return (
              <tr
                key={u.id}
                className={`border-t border-[var(--border)] ${
                  i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface)]/60"
                }`}
              >
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-1.5">
                    {u.name}
                    {isSelf && (
                      <span className="text-xs text-[var(--text-muted)] font-normal">(you)</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role ?? "rep"}
                      disabled={isSelf || savingId === u.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      title={isSelf ? "You can't change your own role" : undefined}
                      className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-sm capitalize outline-none focus:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {u.role === "admin" && (
                      <ShieldCheck size={14} className="text-[var(--accent)]" />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
