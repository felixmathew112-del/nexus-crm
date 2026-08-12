"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export type DealFormDeal = {
  id: string;
  title: string;
  value: number;
  stageId: string;
  contactId: string;
  expectedCloseDate: string | null;
  ownerId?: string | null;
  lostReason?: string | null;
};
type Contact = { id: string; name: string; company: string | null };
type Stage = { id: string; name: string };
type OwnerOption = { id: string; name: string };

export const LOST_REASONS = ["price", "competitor", "no-budget", "timing", "other"] as const;

// Create/edit form for a deal, shared between the pipeline board's quick
// actions and the deal detail page. Pass `deal` to edit (PATCHes); omit it
// to create (POSTs).
export function DealFormModal({
  deal,
  contacts,
  stages,
  users,
  currentUserId,
  onClose,
  onSaved,
}: {
  deal?: DealFormDeal;
  contacts: Contact[];
  stages: Stage[];
  users: OwnerOption[];
  currentUserId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(deal);
  const [title, setTitle] = useState(deal?.title ?? "");
  const [contactId, setContactId] = useState(deal?.contactId ?? contacts[0]?.id ?? "");
  const [stageId, setStageId] = useState(deal?.stageId ?? stages[0]?.id ?? "");
  const [value, setValue] = useState(deal ? String(deal.value) : "");
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal?.expectedCloseDate ?? "");
  const [ownerId, setOwnerId] = useState(deal?.ownerId ?? currentUserId);
  const [lostReason, setLostReason] = useState<(typeof LOST_REASONS)[number] | "">(
    (deal?.lostReason as (typeof LOST_REASONS)[number]) ?? ""
  );
  const [submitting, setSubmitting] = useState(false);

  const lostStageId = stages.find((s) => s.name === "Lost")?.id;
  const isMovingToLost = Boolean(lostStageId) && stageId === lostStageId;
  const canSubmit = title.trim() && contactId && stageId && (!isMovingToLost || lostReason);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    await fetch(isEdit ? `/api/deals/${deal!.id}` : "/api/deals", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        contactId,
        stageId,
        value: value ? Number(value) : 0,
        expectedCloseDate: expectedCloseDate || null,
        ownerId: ownerId || null,
        lostReason: isMovingToLost ? lostReason : null,
      }),
    });
    setSubmitting(false);
    onSaved();
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
          <h2 className="font-display text-sm font-semibold">
            {isEdit ? "Edit deal" : "New deal"}
          </h2>
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
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kumar Builders - Bulk Order"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Contact</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {contacts.length === 0 && <option value="">No contacts yet</option>}
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` — ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Stage</label>
            <select
              value={stageId}
              onChange={(e) => setStageId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {isMovingToLost && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                Reason lost
              </label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value as typeof lostReason)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm capitalize outline-none focus:border-[var(--accent)]"
              >
                <option value="">Select a reason…</option>
                {LOST_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Value (₹)</label>
            <input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">
              Expected close date
            </label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Owner</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id === currentUserId ? `${u.name} (you)` : u.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? "Save changes" : "Create deal"}
          </button>
        </form>
      </div>
    </div>
  );
}
