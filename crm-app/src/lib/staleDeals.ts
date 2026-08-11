import { db } from "@/db";
import { activities, deals, stages } from "@/db/schema";
import { and, desc, eq, notInArray } from "drizzle-orm";

const STALE_DAYS = 5;
const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

async function openDealIds() {
  const allStages = await db.select().from(stages);
  const closedStageIds = allStages
    .filter((s) => s.name === "Won" || s.name === "Lost")
    .map((s) => s.id);

  return closedStageIds.length
    ? db.select().from(deals).where(notInArray(deals.stageId, closedStageIds))
    : db.select().from(deals);
}

// Flags deals with no logged activity for STALE_DAYS+ by setting staleSince
// to the timestamp of the last activity (or deal creation, if none ever logged).
export async function markStaleDeals() {
  const candidates = await openDealIds();
  const threshold = Date.now() - STALE_MS;
  let markedStale = 0;

  for (const deal of candidates) {
    if (deal.staleSince) continue; // already flagged; cleared on activity/stage change

    const [lastActivity] = await db
      .select({ createdAt: activities.createdAt })
      .from(activities)
      .where(eq(activities.dealId, deal.id))
      .orderBy(desc(activities.createdAt))
      .limit(1);

    const lastActivityAt = lastActivity?.createdAt ?? deal.createdAt;
    if (!lastActivityAt || new Date(lastActivityAt).getTime() > threshold) continue;

    await db
      .update(deals)
      .set({ staleSince: lastActivityAt })
      .where(and(eq(deals.id, deal.id)));
    markedStale++;
  }

  return { checked: candidates.length, markedStale };
}

declare global {
  var __staleDealSchedulerStarted: boolean | undefined;
}

export function startStaleDealScheduler() {
  if (globalThis.__staleDealSchedulerStarted) return;
  globalThis.__staleDealSchedulerStarted = true;

  const run = () => markStaleDeals().catch((err) => console.error("[stale-check] failed", err));
  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
