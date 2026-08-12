import { db } from "@/db";
import { deals, contacts, tasks, stages, activities, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import DashboardStats from "./DashboardStats";

export default async function DashboardPage() {
  const [allDeals, allContacts, allTasks, allStages, allUsers, recentActivities, currentUser] =
    await Promise.all([
      db.select().from(deals),
      db.select().from(contacts),
      db.select().from(tasks),
      db.select().from(stages),
      db.select({ id: users.id, name: users.name }).from(users),
      db
        .select({
          id: activities.id,
          type: activities.type,
          content: activities.content,
          createdAt: activities.createdAt,
          authorId: activities.authorId,
          contactId: activities.contactId,
          dealId: activities.dealId,
          contactName: contacts.name,
          dealTitle: deals.title,
        })
        .from(activities)
        .leftJoin(contacts, eq(activities.contactId, contacts.id))
        .leftJoin(deals, eq(activities.dealId, deals.id))
        .orderBy(desc(activities.createdAt))
        .limit(30),
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
        users={allUsers}
        activities={recentActivities}
        currentUser={currentUser!}
      />
    </div>
  );
}
