export type DueStatus = "overdue" | "today" | "soon";

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// dueDate is a plain "YYYY-MM-DD" string (no time/timezone), so comparisons
// stay lexicographic against the viewer's local date - no date-fns/UTC
// conversion needed. "soon" covers the next 2 days after today.
export function getDueStatus(
  dueDate: string | null | undefined,
  done: boolean | null | undefined
): DueStatus | null {
  if (done || !dueDate) return null;

  const now = new Date();
  const today = localDateStr(now);
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";

  const soonCutoff = new Date(now);
  soonCutoff.setDate(soonCutoff.getDate() + 2);
  if (dueDate <= localDateStr(soonCutoff)) return "soon";

  return null;
}
