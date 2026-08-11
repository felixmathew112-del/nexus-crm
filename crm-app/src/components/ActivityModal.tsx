"use client";
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { format } from "date-fns";

export const ACTIVITY_TYPES = ["note", "call", "email", "whatsapp"] as const;

export type Activity = {
  id: string;
  dealId: string | null;
  contactId: string;
  type: string;
  content: string;
  createdAt: string | null;
  authorId: string | null;
};

function ActivityForm({
  contactId,
  dealId,
  onLogged,
}: {
  contactId: string;
  dealId?: string | null;
  onLogged: (activity: Activity) => void;
}) {
  const [type, setType] = useState<(typeof ACTIVITY_TYPES)[number]>("note");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, dealId: dealId ?? null, type, content }),
    });
    const activity: Activity = await res.json();
    setContent("");
    setSubmitting(false);
    onLogged(activity);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm capitalize outline-none focus:border-[var(--accent)]"
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1.5">Notes</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="What happened?"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        Log activity
      </button>
    </form>
  );
}

// Shows an entity's activity timeline (a deal's or a contact's) with the
// log-activity form above it. Pass dealId to scope to one deal; omit it to
// scope to everything logged against the contact.
export function ActivityModal({
  title,
  subtitle,
  contactId,
  dealId,
  onClose,
  onLogged,
}: {
  title: string;
  subtitle?: string | null;
  contactId: string;
  dealId?: string | null;
  onClose: () => void;
  onLogged?: () => void;
}) {
  const [activities, setActivities] = useState<Activity[] | null>(null);

  useEffect(() => {
    const qs = dealId ? `dealId=${dealId}` : `contactId=${contactId}`;
    fetch(`/api/activities?${qs}`)
      .then((r) => r.json())
      .then(setActivities);
  }, [contactId, dealId]);

  function handleLogged(activity: Activity) {
    setActivities((prev) => [activity, ...(prev ?? [])]);
    onLogged?.();
  }

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

        <div className="shrink-0">
          <ActivityForm contactId={contactId} dealId={dealId} onLogged={handleLogged} />
        </div>

        <h3 className="font-display text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mt-5 mb-2 shrink-0">
          Activity history
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {activities === null && (
            <p className="text-xs text-[var(--text-muted)]">Loading…</p>
          )}
          {activities?.length === 0 && (
            <p className="text-xs text-[var(--text-muted)]">No activity logged yet.</p>
          )}
          {activities?.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium capitalize text-[var(--accent)]">
                  {a.type.replace("_", " ")}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                  {a.createdAt ? format(new Date(a.createdAt), "MMM d, h:mm a") : ""}
                </span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
