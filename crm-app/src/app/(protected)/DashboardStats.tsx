"use client";
import { useMemo, useState } from "react";
import { TrendingUp, Flame, Users, ListTodo } from "lucide-react";
import { ScopeToggle, defaultScopeForRole, type Scope } from "@/components/ScopeToggle";

type Deal = {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  ownerId: string | null;
  staleSince: string | null;
};
type Contact = { id: string; ownerId: string | null };
type Task = { id: string; done: boolean | null; ownerId: string | null };
type Stage = { id: string; name: string };
type CurrentUser = { id: string; role: string | null };

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

export default function DashboardStats({
  deals,
  contacts,
  tasks,
  stages,
  currentUser,
}: {
  deals: Deal[];
  contacts: Contact[];
  tasks: Task[];
  stages: Stage[];
  currentUser: CurrentUser;
}) {
  const [scope, setScope] = useState<Scope>(() => defaultScopeForRole(currentUser.role));
  const mine = scope === "mine";

  const stats = useMemo(() => {
    const scopedDeals = mine ? deals.filter((d) => d.ownerId === currentUser.id) : deals;
    const scopedContacts = mine ? contacts.filter((c) => c.ownerId === currentUser.id) : contacts;
    const scopedTasks = mine ? tasks.filter((t) => t.ownerId === currentUser.id) : tasks;

    const wonStage = stages.find((s) => s.name === "Won");
    const lostStage = stages.find((s) => s.name === "Lost");
    const openDeals = scopedDeals.filter(
      (d) => d.stageId !== wonStage?.id && d.stageId !== lostStage?.id
    );
    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const staleDeals = scopedDeals.filter((d) => d.staleSince);
    const openTasks = scopedTasks.filter((t) => !t.done);

    return { openDeals, pipelineValue, staleDeals, openTasks, scopedContacts };
  }, [deals, contacts, tasks, stages, mine, currentUser.id]);

  const stageMap = useMemo(() => Object.fromEntries(stages.map((s) => [s.id, s])), [stages]);

  const cards = [
    {
      label: "Open pipeline value",
      value: formatValue(stats.pipelineValue),
      icon: TrendingUp,
      sub: `${stats.openDeals.length} active deals`,
    },
    {
      label: "Deals at risk",
      value: stats.staleDeals.length.toString(),
      icon: Flame,
      sub: "no recent activity",
      color: "text-risk",
    },
    {
      label: mine ? "Your contacts" : "Total contacts",
      value: stats.scopedContacts.length.toString(),
      icon: Users,
      sub: "leads + clients",
    },
    {
      label: "Open tasks",
      value: stats.openTasks.length.toString(),
      icon: ListTodo,
      sub: mine ? "assigned to you" : "across the team",
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <ScopeToggle value={scope} onChange={setScope} />
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
          {stats.staleDeals.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">Nothing stale right now — good sign.</p>
          )}
          {stats.staleDeals.map((d) => (
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
    </>
  );
}
