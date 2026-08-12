"use client";

export type Scope = "mine" | "all";

// Managers/admins default to seeing the whole team's data; reps default to
// their own. Either can switch via the toggle.
export function defaultScopeForRole(role: string | null | undefined): Scope {
  return role === "rep" ? "mine" : "all";
}

export function ScopeToggle({
  value,
  onChange,
}: {
  value: Scope;
  onChange: (value: Scope) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5">
      {(["mine", "all"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === s
              ? "bg-[var(--accent)] text-[var(--bg)]"
              : "text-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {s === "mine" ? "Mine" : "Everyone"}
        </button>
      ))}
    </div>
  );
}
