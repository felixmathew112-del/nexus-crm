"use client";
import { useEffect, useState } from "react";
import { X, Loader2, CheckSquare, Square } from "lucide-react";

export type Task = {
  id: string;
  dealId: string | null;
  contactId: string | null;
  title: string;
  dueDate: string | null;
  done: boolean | null;
  ownerId: string | null;
  createdAt: string | null;
};

function TaskForm({
  contactId,
  dealId,
  onCreated,
}: {
  contactId?: string | null;
  dealId?: string | null;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: contactId ?? null,
        dealId: dealId ?? null,
        title,
        dueDate: dueDate || null,
      }),
    });
    const task: Task = await res.json();
    setTitle("");
    setDueDate("");
    setSubmitting(false);
    onCreated(task);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Task</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to happen?"
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

      <button
        type="submit"
        disabled={!title.trim() || submitting}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        Add task
      </button>
    </form>
  );
}

// The add-task form plus the resulting list, with no modal chrome - usable
// standalone on a page, or wrapped in TaskModal's overlay. Pass dealId to
// scope to one deal; omit it to scope to everything tied to the contact.
export function TaskPanel({
  contactId,
  dealId,
  onChanged,
}: {
  contactId?: string | null;
  dealId?: string | null;
  onChanged?: () => void;
}) {
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    const qs = dealId ? `dealId=${dealId}` : `contactId=${contactId}`;
    fetch(`/api/tasks?${qs}`)
      .then((r) => r.json())
      .then(setTasks);
  }, [contactId, dealId]);

  function handleCreated(task: Task) {
    setTasks((prev) => [task, ...(prev ?? [])]);
    onChanged?.();
  }

  async function toggleDone(task: Task) {
    const done = !task.done;
    setTasks((prev) => prev?.map((t) => (t.id === task.id ? { ...t, done } : t)) ?? null);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    onChanged?.();
  }

  return (
    <>
      <TaskForm contactId={contactId} dealId={dealId} onCreated={handleCreated} />

      <h3 className="font-display text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mt-5 mb-2">
        Tasks
      </h3>
      <div className="space-y-2">
        {tasks === null && <p className="text-xs text-[var(--text-muted)]">Loading…</p>}
        {tasks?.length === 0 && <p className="text-xs text-[var(--text-muted)]">No tasks yet.</p>}
        {tasks?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleDone(t)}
            className="w-full flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-left hover:border-[var(--accent)]/50 transition-colors"
          >
            {t.done ? (
              <CheckSquare size={15} className="text-success shrink-0" />
            ) : (
              <Square size={15} className="text-[var(--text-muted)] shrink-0" />
            )}
            <span
              className={`flex-1 text-sm ${t.done ? "line-through text-[var(--text-muted)]" : ""}`}
            >
              {t.title}
            </span>
            {t.dueDate && (
              <span className="text-[10px] text-[var(--text-muted)] shrink-0">{t.dueDate}</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

// Modal wrapper around TaskPanel, for quick-action use from a board/table
// row without navigating away.
export function TaskModal({
  title,
  subtitle,
  contactId,
  dealId,
  onClose,
  onChanged,
}: {
  title: string;
  subtitle?: string | null;
  contactId?: string | null;
  dealId?: string | null;
  onClose: () => void;
  onChanged?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4 shrink-0">
          <div>
            <h2 className="font-display text-sm font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5">
          <TaskPanel contactId={contactId} dealId={dealId} onChanged={onChanged} />
        </div>
      </div>
    </div>
  );
}
