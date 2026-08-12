import { db } from "@/db";
import { deals, contacts, tasks, stages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import DashboardStats from "./DashboardStats";

export default async function DashboardPage() {
  const [allDeals, allContacts, allTasks, allStages, currentUser] = await Promise.all([
    db.select().from(deals),
    db.select().from(contacts),
    db.select().from(tasks),
    db.select().from(stages),
    getCurrentUser(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Everything management needs to see, without asking the team for a status update.
        </p>
      </div>

      <DashboardStats
        deals={allDeals}
        contacts={allContacts}
        tasks={allTasks}
        stages={allStages}
        currentUser={currentUser!}
      />
    </div>
  );
}
