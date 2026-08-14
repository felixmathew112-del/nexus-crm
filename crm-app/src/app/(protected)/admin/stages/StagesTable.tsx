"use client";
import { useState } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, X, Loader2, Lock } from "lucide-react";

type Stage = {
  id: string;
  name: string;
  order: number;
  color: string;
  probability: number | null;
};

const LOCKED_NAMES = ["Won", "Lost"];
const DEFAULT_COLOR = "#6366f1";

function NewStageModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (stage: Stage) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [probability, setProbability] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, probability }),
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(body?.error ?? "Couldn't create this stage.");
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
          <h2 className="font-display text-sm font-semibold">New stage</h2>
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
              placeholder="e.g. Demo Scheduled"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex gap-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">
                Close probability
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text-muted)]">%</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-risk">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Add stage
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StagesTable({
  stages: initialStages,
  dealCounts,
}: {
  stages: Stage[];
  dealCounts: Record<string, number>;
}) {
  const [stages, setStages] = useState(
    [...initialStages].sort((a, b) => a.order - b.order)
  );
  const [counts, setCounts] = useState(dealCounts);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNewStage, setShowNewStage] = useState(false);

  function patchLocal(id: string, patch: Partial<Stage>) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function saveStage(id: string, patch: Record<string, unknown>, previous: Stage) {
    setSavingId(id);
    const res = await fetch(`/api/stages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavingId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.error ?? "Couldn't update this stage.");
      patchLocal(id, previous);
    }
  }

  function handleNameBlur(stage: Stage, value: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === stage.name) {
      patchLocal(stage.id, { name: stage.name });
      return;
    }
    patchLocal(stage.id, { name: trimmed });
    saveStage(stage.id, { name: trimmed }, stage);
  }

  function handleColorChange(stage: Stage, value: string) {
    patchLocal(stage.id, { color: value });
    saveStage(stage.id, { color: value }, stage);
  }

  function handleProbabilityBlur(stage: Stage, value: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(value)));
    patchLocal(stage.id, { probability: clamped });
    if (clamped !== stage.probability) {
      saveStage(stage.id, { probability: clamped }, stage);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stages.length) return;

    const a = stages[index];
    const b = stages[target];
    const reordered = [...stages];
    reordered[index] = { ...b, order: a.order };
    reordered[target] = { ...a, order: b.order };
    reordered.sort((x, y) => x.order - y.order);
    setStages(reordered);

    setSavingId(a.id);
    const [resA, resB] = await Promise.all([
      fetch(`/api/stages/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/stages/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order }),
      }),
    ]);
    setSavingId(null);
    if (!resA.ok || !resB.ok) {
      window.alert("Couldn't reorder these stages.");
      setStages((prev) => [...prev].sort((x, y) => x.order - y.order));
    }
  }

  async function handleDelete(stage: Stage) {
    if (!window.confirm(`Delete the "${stage.name}" stage? This can't be undone.`)) return;
    const res = await fetch(`/api/stages/${stage.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.error ?? "Couldn't delete this stage.");
      return;
    }
    setStages((prev) => prev.filter((s) => s.id !== stage.id));
  }

  function handleCreated(stage: Stage) {
    setStages((prev) => [...prev, stage].sort((a, b) => a.order - b.order));
    setCounts((prev) => ({ ...prev, [stage.id]: 0 }));
    setShowNewStage(false);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowNewStage(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium px-3 py-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New stage
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium w-16">Order</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Color</th>
              <th className="px-4 py-3 font-medium">Close probability</th>
              <th className="px-4 py-3 font-medium text-right">Deals</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => {
              const locked = LOCKED_NAMES.includes(s.name);
              const dealCount = counts[s.id] ?? 0;
              return (
                <tr
                  key={s.id}
                  className={`border-t border-[var(--border)] ${
                    i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface)]/60"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Move up"
                        disabled={i === 0 || savingId === s.id}
                        onClick={() => handleMove(i, -1)}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        title="Move down"
                        disabled={i === stages.length - 1 || savingId === s.id}
                        onClick={() => handleMove(i, 1)}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        defaultValue={s.name}
                        key={s.name}
                        disabled={locked}
                        onBlur={(e) => handleNameBlur(s, e.target.value)}
                        title={locked ? "This stage name is used by pipeline logic and can't change" : undefined}
                        className="w-40 rounded-lg border border-transparent bg-transparent px-2 py-1 -mx-2 outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-raised)] disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                      {locked && <Lock size={12} className="text-[var(--text-muted)] shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) => handleColorChange(s, e.target.value)}
                      className="h-7 w-10 rounded border border-[var(--border)] bg-[var(--surface-raised)] p-0.5"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={s.probability ?? 50}
                        key={`${s.id}-${s.probability}`}
                        onBlur={(e) => handleProbabilityBlur(s, Number(e.target.value))}
                        className="w-16 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-sm outline-none focus:border-[var(--accent)]"
                      />
                      <span className="text-[var(--text-muted)]">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--text-muted)]">{dealCount}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      title={
                        locked
                          ? "This stage can't be deleted"
                          : dealCount > 0
                          ? "Move deals out of this stage first"
                          : "Delete stage"
                      }
                      disabled={locked || dealCount > 0}
                      onClick={() => handleDelete(s)}
                      className="text-[var(--text-muted)] hover:text-risk disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNewStage && (
        <NewStageModal onClose={() => setShowNewStage(false)} onCreated={handleCreated} />
      )}
    </>
  );
}
