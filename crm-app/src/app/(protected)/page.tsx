import { db } from "@/db";
import { deals, contacts, tasks, stages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TrendingUp, Flame, Users, ListTodo } from "lucide-react";

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

export default async function DashboardPage() {
  const allDeals = await db.select().from(deals);
  const allContacts = await db.select().from(contacts);
  const allTasks = await db.select().from(tasks);
  const allStages = await db.select().from(stages);

  const wonStage = allStages.find((s) => s.name === "Won");
  const lostStage = allStages.find((s) => s.name === "Lost");
  const openDeals = allDeals.filter(
    (d) => d.stageId !== wonStage?.id && d.stageId !== lostStage?.id
  );
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const staleDeals = allDeals.filter((d) => d.staleSince);
  const openTasks = allTasks.filter((t) => !t.done);

  const stageMap = Object.fromEntries(allStages.map((s) => [s.id, s]));

  const cards = [
    {
      label: "Open pipeline value",
      value: formatValue(pipelineValue),
      icon: TrendingUp,
      sub: `${openDeals.length} active deals`,
    },
    {
      label: "Deals at risk",
      value: staleDeals.length.toString(),
      icon: Flame,
      sub: "no recent activity",
      color: "text-risk",
    },
    {
      label: "Total contacts",
      value: allContacts.length.toString(),
      icon: Users,
      sub: "leads + clients",
    },
    {
      label: "Open tasks",
      value: openTasks.length.toString(),
      icon: ListTodo,
      sub: "across the team",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Everything management needs to see, without asking the team for a status update.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
                  {c.label}
                </span>
                <Icon size={16} className={c.color ?? "text-[var(--accent)]"} />
              </div>
              <div className="font-display text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{c.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="font-display text-sm font-semibold mb-4">Deals needing attention</h2>
        <div className="space-y-2">
          {staleDeals.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">Nothing stale right now — good sign.</p>
          )}
          {staleDeals.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-risk" />
                <span className="text-sm">{d.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                <span>{stageMap[d.stageId]?.name}</span>
                <span className="font-display text-[var(--accent)] font-semibold">
                  {formatValue(d.value ?? 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
