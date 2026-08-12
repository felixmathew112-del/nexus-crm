"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Square,
  Plus,
  X,
  Loader2,
  Trash2,
  Building2,
  Kanban,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { ScopeToggle, defaultScopeForRole, type Scope } from "@/components/ScopeToggle";
import { getDueStatus } from "@/lib/dueStatus";

type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean | null;
  contactId: string | null;
  dealId: string | null;
  ownerId: string | null;
  contactName: string | null;
  dealTitle: string | null;
};
type Contact = { id: string; name: string };
type Deal = { id: string; title: string };
type CurrentUser = { id: string; role: string | null };

function NewTaskModal({
  contacts,
  deals,
  onClose,
  onCreated,
}: {
  contacts: Contact[];
  deals: Deal[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [contactId, setContactId] = useState("");
  const [dealId, setDealId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dueDate: dueDate || null,
        contactId: contactId || null,
        dealId: dealId || null,
      }),
    });
    const inserted = await res.json();
    const contact = contacts.find((c) => c.id === contactId);
    const deal = deals.find((d) => d.id === dealId);
    setSubmitting(false);
    onCreated({
      ...inserted,
      contactName: contact?.name ?? null,
      dealTitle: deal?.title ?? null,
    });
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
          <h2 className="font-display text-sm font-semibold">New task</h2>
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
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Task</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Contact (optional)
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">None</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Deal (optional)
            </label>
            <select
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">None</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Add task
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TasksList({
  tasks: initialTasks,
  currentUser,
}: {
  tasks: Task[];
  currentUser: CurrentUser;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [scope, setScope] = useState<Scope>(() => defaultScopeForRole(currentUser.role));

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
    fetch("/api/deals").then((r) => r.json()).then(setDeals);
  }, []);

  const sortedTasks = useMemo(() => {
    const visible =
      scope === "mine" ? tasks.filter((t) => t.ownerId === currentUser.id) : tasks;
    return [...visible].sort((a, b) => {
      if (Boolean(a.done) !== Boolean(b.done)) return a.done ? 1 : -1;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, scope, currentUser.id]);

  async function toggleDone(task: Task) {
    const done = !task.done;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done } : t)));
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
  }

  function handleCreated(task: Task) {
    setTasks((prev) => [task, ...prev]);
    setShowNewTask(false);
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <ScopeToggle value={scope} onChange={setScope} />
        <button
          type="button"
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium px-3 py-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New task
        </button>
      </div>

      <div className="space-y-2">
        {sortedTasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            <button
              type="button"
              onClick={() => toggleDone(t)}
              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              {t.done ? (
                <CheckSquare size={16} className="text-success" />
              ) : (
                <Square size={16} />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${t.done ? "line-through text-[var(--text-muted)]" : ""}`}>
                {t.title}
              </div>
              {(t.contactName || t.dealTitle) && (
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5">
                  {t.contactName && (
                    <span className="flex items-center gap-1">
                      <Building2 size={11} /> {t.contactName}
                    </span>
                  )}
                  {t.dealTitle && (
                    <span className="flex items-center gap-1 truncate">
                      <Kanban size={11} /> {t.dealTitle}
                    </span>
                  )}
                </div>
              )}
            </div>
            {t.dueDate && (() => {
              const status = getDueStatus(t.dueDate, t.done);
              return (
                <span
                  title={
                    status === "overdue" ? "Overdue" : status === "today" ? "Due today" : undefined
                  }
                  className={`flex items-center gap-1 text-xs shrink-0 ${
                    status === "overdue"
                      ? "text-risk font-medium"
                      : status === "today" || status === "soon"
                        ? "text-[var(--accent)]"
                        : "text-[var(--text-muted)]"
                  }`}
                >
                  {status === "overdue" && <AlertTriangle size={12} />}
                  {status === "today" && <Clock size={12} />}
                  {t.dueDate}
                </span>
              );
            })()}
            <button
              type="button"
              title="Delete task"
              onClick={() => handleDelete(t)}
              className="shrink-0 text-[var(--text-muted)] hover:text-risk transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sortedTasks.length === 0 && (
          <div className="text-sm text-[var(--text-muted)] text-center py-8">No tasks yet.</div>
        )}
      </div>

      {showNewTask && (
        <NewTaskModal
          contacts={contacts}
          deals={deals}
          onClose={() => setShowNewTask(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
