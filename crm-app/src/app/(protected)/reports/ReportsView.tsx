"use client";
import { useMemo, useState } from "react";
import { Trophy, Target, TrendingUp, Percent } from "lucide-react";
import { ScopeToggle, defaultScopeForRole, type Scope } from "@/components/ScopeToggle";

type Deal = {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  ownerId: string | null;
  lostReason: string | null;
};
type Stage = { id: string; name: string; order: number; color: string };
type User = { id: string; name: string };
type CurrentUser = { id: string; role: string | null };

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

export default function ReportsView({
  deals,
  stages,
  users,
  currentUser,
}: {
  deals: Deal[];
  stages: Stage[];
  users: User[];
  currentUser: CurrentUser;
}) {
  const [scope, setScope] = useState<Scope>(() => defaultScopeForRole(currentUser.role));
  const mine = scope === "mine";

  const orderedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);
  const wonStage = useMemo(() => stages.find((s) => s.name === "Won"), [stages]);
  const lostStage = useMemo(() => stages.find((s) => s.name === "Lost"), [stages]);
  const userMap = useMemo(() => Object.fromEntries(users.map((u) => [u.id, u.name])), [users]);

  const scopedDeals = useMemo(
    () => (mine ? deals.filter((d) => d.ownerId === currentUser.id) : deals),
    [deals, mine, currentUser.id]
  );

  const funnel = useMemo(
    () =>
      orderedStages.map((stage) => {
        const stageDeals = scopedDeals.filter((d) => d.stageId === stage.id);
        return {
          stage,
          count: stageDeals.length,
          value: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
        };
      }),
    [orderedStages, scopedDeals]
  );
  const maxFunnelCount = Math.max(1, ...funnel.map((f) => f.count));

  const wonDeals = scopedDeals.filter((d) => wonStage && d.stageId === wonStage.id);
  const lostDeals = scopedDeals.filter((d) => lostStage && d.stageId === lostStage.id);
  const closedCount = wonDeals.length + lostDeals.length;
  const winRate = closedCount === 0 ? 0 : Math.round((wonDeals.length / closedCount) * 100);
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const avgDealSize = wonDeals.length === 0 ? 0 : wonValue / wonDeals.length;
  const openValue = scopedDeals
    .filter((d) => d.stageId !== wonStage?.id && d.stageId !== lostStage?.id)
    .reduce((sum, d) => sum + (d.value ?? 0), 0);

  const lostReasonKeys = useMemo(
    () => Array.from(new Set(lostDeals.map((d) => d.lostReason ?? "unspecified"))),
    [lostDeals]
  );
  const lostReasonBreakdown = useMemo(
    () =>
      lostReasonKeys
        .map((reason) => ({
          reason,
          count: lostDeals.filter((d) => (d.lostReason ?? "unspecified") === reason).length,
        }))
        .sort((a, b) => b.count - a.count),
    [lostReasonKeys, lostDeals]
  );

  const ownerKeys = useMemo(
    () => Array.from(new Set(scopedDeals.map((d) => d.ownerId ?? "unassigned"))),
    [scopedDeals]
  );

  const leaderboard = useMemo(
    () =>
      ownerKeys
        .map((key) => {
          const ownerDeals = scopedDeals.filter((d) => (d.ownerId ?? "unassigned") === key);
          const won = ownerDeals.filter((d) => wonStage && d.stageId === wonStage.id);
          const lost = ownerDeals.filter((d) => lostStage && d.stageId === lostStage.id);
          const open = ownerDeals.filter(
            (d) =>
              (!wonStage || d.stageId !== wonStage.id) && (!lostStage || d.stageId !== lostStage.id)
          );
          return {
            ownerId: key === "unassigned" ? null : key,
            open: open.length,
            openValue: open.reduce((sum, d) => sum + (d.value ?? 0), 0),
            won: won.length,
            wonValue: won.reduce((sum, d) => sum + (d.value ?? 0), 0),
            lost: lost.length,
          };
        })
        .sort((a, b) => b.wonValue - a.wonValue),
    [ownerKeys, scopedDeals, wonStage, lostStage]
  );

  const cards = [
    { label: "Win rate", value: `${winRate}%`, icon: Percent, sub: `${wonDeals.length} won / ${closedCount} closed` },
    { label: "Won value", value: formatValue(wonValue), icon: Trophy, sub: `${wonDeals.length} deals` },
    { label: "Avg deal size", value: formatValue(avgDealSize), icon: Target, sub: "on won deals" },
    { label: "Open pipeline", value: formatValue(openValue), icon: TrendingUp, sub: `across ${orderedStages.length} stages` },
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
                <Icon size={16} className="text-[var(--accent)]" />
              </div>
              <div className="font-display text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{c.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-6">
        <h2 className="font-display text-sm font-semibold mb-4">Pipeline funnel</h2>
        <div className="space-y-2.5">
          {funnel.map(({ stage, count, value }) => (
            <div key={stage.id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-xs text-[var(--text-muted)] truncate">
                {stage.name}
              </span>
              <div className="flex-1 h-6 rounded bg-[var(--surface-raised)] overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{
                    width: `${(count / maxFunnelCount) * 100}%`,
                    backgroundColor: stage.color,
                    minWidth: count > 0 ? "6px" : 0,
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs text-[var(--text-muted)]">
                {count}
              </span>
              <span className="w-20 shrink-0 text-right text-xs font-medium">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {lostDeals.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-6">
          <h2 className="font-display text-sm font-semibold mb-4">Lost reasons</h2>
          <div className="space-y-2.5">
            {lostReasonBreakdown.map(({ reason, count }) => (
              <div key={reason} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-[var(--text-muted)] capitalize truncate">
                  {reason}
                </span>
                <div className="flex-1 h-6 rounded bg-[var(--surface-raised)] overflow-hidden">
                  <div
                    className="h-full rounded bg-risk transition-all"
                    style={{ width: `${(count / lostDeals.length) * 100}%`, minWidth: "6px" }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs text-[var(--text-muted)]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!mine && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-display text-sm font-semibold mb-4">Rep leaderboard</h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No deals yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase tracking-wide">
                  <th className="pb-2 font-medium">Rep</th>
                  <th className="pb-2 font-medium text-right">Open</th>
                  <th className="pb-2 font-medium text-right">Pipeline value</th>
                  <th className="pb-2 font-medium text-right">Won</th>
                  <th className="pb-2 font-medium text-right">Won value</th>
                  <th className="pb-2 font-medium text-right">Win rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => {
                  const rowClosed = row.won + row.lost;
                  const rowWinRate = rowClosed === 0 ? 0 : Math.round((row.won / rowClosed) * 100);
                  return (
                    <tr key={row.ownerId ?? "unassigned"} className="border-t border-[var(--border)]">
                      <td className="py-2.5 font-medium">
                        {row.ownerId ? userMap[row.ownerId] ?? "Unknown" : "Unassigned"}
                      </td>
                      <td className="py-2.5 text-right text-[var(--text-muted)]">{row.open}</td>
                      <td className="py-2.5 text-right text-[var(--text-muted)]">
                        {formatValue(row.openValue)}
                      </td>
                      <td className="py-2.5 text-right text-[var(--text-muted)]">{row.won}</td>
                      <td className="py-2.5 text-right font-display font-semibold text-[var(--accent)]">
                        {formatValue(row.wonValue)}
                      </td>
                      <td className="py-2.5 text-right text-[var(--text-muted)]">{rowWinRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
