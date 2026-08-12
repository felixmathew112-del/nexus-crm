import { db } from "@/db";
import { deals, stages, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import ReportsView from "./ReportsView";

export default async function ReportsPage() {
  const [allDeals, allStages, allUsers, currentUser] = await Promise.all([
    db.select().from(deals),
    db.select().from(stages),
    db.select({ id: users.id, name: users.name }).from(users),
    getCurrentUser(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Win rate, pipeline funnel, and who&apos;s closing what.
        </p>
      </div>

      <ReportsView
        deals={allDeals}
        stages={allStages}
        users={allUsers}
        currentUser={currentUser!}
      />
    </div>
  );
}
