"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus, KeyRound, ArrowRightLeft, X, Loader2 } from "lucide-react";

type User = { id: string; name: string; email: string; role: string | null };
type CurrentUser = { id: string; role: string | null };

const ROLES = ["rep", "manager", "admin"] as const;

function NewUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: User) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("rep");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim() && email.trim() && password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(body?.error ?? "Couldn't create this user.");
      return;
    }
    onCreated(body);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="font-display text-sm font-semibold">New user</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm capitalize outline-none focus:border-[var(--accent)]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-risk">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Add user
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  user,
  onClose,
  onReset,
}: {
  user: User;
  onClose: () => void;
  onReset: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/users/${user.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't reset this user's password.");
      return;
    }
    onReset();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="font-display text-sm font-semibold">Reset password for {user.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          {error && <p className="text-xs text-risk">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Reset password
          </button>
        </form>
      </div>
    </div>
  );
}

function ReassignModal({
  fromUser,
  otherUsers,
  onClose,
  onDone,
}: {
  fromUser: User;
  otherUsers: User[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [toUserId, setToUserId] = useState("");
  const [counts, setCounts] = useState<{ contacts: number; deals: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ contacts: number; deals: number } | null>(null);

  useEffect(() => {
    fetch(`/api/users/${fromUser.id}/reassign`)
      .then((r) => r.json())
      .then(setCounts);
  }, [fromUser.id]);

  const hasBook = !!counts && (counts.contacts > 0 || counts.deals > 0);
  const canSubmit = toUserId && hasBook;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/users/${fromUser.id}/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(body?.error ?? "Couldn't reassign.");
      return;
    }
    setResult(body);
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="font-display text-sm font-semibold">Reassign {fromUser.name}&apos;s book</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm">
              Reassigned <span className="font-medium">{result.contacts}</span> contact
              {result.contacts === 1 ? "" : "s"} and{" "}
              <span className="font-medium">{result.deals}</span> deal
              {result.deals === 1 ? "" : "s"}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-[var(--text-muted)]">
              {counts === null
                ? "Checking their book of business…"
                : `Currently owns ${counts.contacts} contact${counts.contacts === 1 ? "" : "s"} and ${counts.deals} deal${counts.deals === 1 ? "" : "s"}.`}
            </p>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                Move everything to
              </label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              >
                <option value="">Choose a rep…</option>
                {otherUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {counts !== null && !hasBook && (
              <p className="text-xs text-[var(--text-muted)]">
                Nothing to reassign — {fromUser.name} doesn&apos;t own any contacts or deals.
              </p>
            )}
            {error && <p className="text-xs text-risk">{error}</p>}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Reassign
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function UsersTable({
  users: initialUsers,
  currentUser,
}: {
  users: User[];
  currentUser: CurrentUser;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNewUser, setShowNewUser] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [reassignUser, setReassignUser] = useState<User | null>(null);

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

  function handleCreated(user: User) {
    setUsers((prev) => [...prev, user]);
    setShowNewUser(false);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowNewUser(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium px-3 py-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus size={14} />
          New user
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium w-20"></th>
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
                        <span className="text-xs text-[var(--text-muted)] font-normal">
                          (you)
                        </span>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        title="Reassign their contacts & deals"
                        disabled={users.length < 2}
                        onClick={() => setReassignUser(u)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowRightLeft size={14} />
                      </button>
                      <button
                        type="button"
                        title="Reset password"
                        onClick={() => setResetUser(u)}
                        className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                      >
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNewUser && (
        <NewUserModal onClose={() => setShowNewUser(false)} onCreated={handleCreated} />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onReset={() => {
            window.alert(`Password reset for ${resetUser.name}.`);
            setResetUser(null);
          }}
        />
      )}
      {reassignUser && (
        <ReassignModal
          fromUser={reassignUser}
          otherUsers={users.filter((u) => u.id !== reassignUser.id)}
          onClose={() => setReassignUser(null)}
          onDone={() => {}}
        />
      )}
    </>
  );
}
