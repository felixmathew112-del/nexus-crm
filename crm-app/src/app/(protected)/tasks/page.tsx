import { db } from "@/db";
import { tasks, contacts, deals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import TasksList from "./TasksList";

export default async function TasksPage() {
  const [rows, currentUser] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        done: tasks.done,
        contactId: tasks.contactId,
        dealId: tasks.dealId,
        ownerId: tasks.ownerId,
        contactName: contacts.name,
        dealTitle: deals.title,
      })
      .from(tasks)
      .leftJoin(contacts, eq(tasks.contactId, contacts.id))
      .leftJoin(deals, eq(tasks.dealId, deals.id)),
    getCurrentUser(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Reminders tied to contacts and deals — nothing falls through here.
        </p>
      </div>

      <TasksList tasks={rows} currentUser={currentUser!} />
    </div>
  );
}
