"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, Flame, Users, ListTodo, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ScopeToggle, defaultScopeForRole, type Scope } from "@/components/ScopeToggle";
import { getDueStatus } from "@/lib/dueStatus";

type Deal = {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  ownerId: string | null;
  staleSince: string | null;
};
type Contact = { id: string; ownerId: string | null };
type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean | null;
  ownerId: string | null;
};
type Stage = { id: string; name: string };
type User = { id: string; name: string };
type Activity = {
  id: string;
  type: string;
  content: string;
  createdAt: string | null;
  authorId: string | null;
  contactId: string | null;
  dealId: string | null;
  contactName: string | null;
  dealTitle: string | null;
};
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
  users,
  activities,
  currentUser,
}: {
  deals: Deal[];
  contacts: Contact[];
  tasks: Task[];
  stages: Stage[];
  users: User[];
  activities: Activity[];
  currentUser: CurrentUser;
}) {
  const [scope, setScope] = useState<Scope>(() => defaultScopeForRole(currentUser.role));
  const mine = scope === "mine";

  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u.name])), [users]);

  const scopedActivities = useMemo(
    () => (mine ? activities.filter((a) => a.authorId === currentUser.id) : activities),
    [activities, mine, currentUser.id]
  );

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
    const dueTasks = openTasks
      .filter((t) => {
        const status = getDueStatus(t.dueDate, t.done);
        return status === "overdue" || status === "today";
      })
      .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

    return { openDeals, pipelineValue, staleDeals, openTasks, dueTasks, scopedContacts };
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mt-6">
        <h2 className="font-display text-sm font-semibold mb-4">Tasks due soon</h2>
        <div className="space-y-2">
          {stats.dueTasks.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              Nothing overdue or due today — good sign.
            </p>
          )}
          {stats.dueTasks.map((t) => {
            const status = getDueStatus(t.dueDate, t.done);
            return (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {status === "overdue" ? (
                    <AlertTriangle size={14} className="text-risk" />
                  ) : (
                    <Clock size={14} className="text-[var(--accent)]" />
                  )}
                  <span className="text-sm">{t.title}</span>
                </div>
                <span
                  className={`text-xs font-medium ${
                    status === "overdue" ? "text-risk" : "text-[var(--accent)]"
                  }`}
                >
                  {status === "overdue" ? "Overdue" : "Due today"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mt-6">
        <h2 className="font-display text-sm font-semibold mb-4">
          {mine ? "Your recent activity" : "Team activity"}
        </h2>
        <div className="space-y-2">
          {scopedActivities.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">Nothing logged yet.</p>
          )}
          {scopedActivities.map((a) => {
            const href = a.dealId
              ? `/deals/${a.dealId}`
              : a.contactId
                ? `/contacts/${a.contactId}`
                : null;
            const target = a.dealTitle ?? a.contactName;
            return (
              <div
                key={a.id}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium capitalize text-[var(--accent)] shrink-0">
                      {a.type.replace("_", " ")}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] truncate">
                      {a.authorId ? userMap[a.authorId] ?? "Unknown" : "Unknown"}
                      {target && (
                        <>
                          {" "}
                          on{" "}
                          {href ? (
                            <Link href={href} className="hover:text-[var(--accent)] hover:underline">
                              {target}
                            </Link>
                          ) : (
                            target
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    {a.createdAt ? format(new Date(a.createdAt), "MMM d, h:mm a") : ""}
                  </span>
                </div>
                <p className="text-sm mt-1 truncate">{a.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
