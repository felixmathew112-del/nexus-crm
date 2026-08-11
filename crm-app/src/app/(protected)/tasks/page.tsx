import { db } from "@/db";
import { tasks, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckSquare, Square } from "lucide-react";

export default async function TasksPage() {
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      done: tasks.done,
      contactName: contacts.name,
    })
    .from(tasks)
    .leftJoin(contacts, eq(tasks.contactId, contacts.id));

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Reminders tied to contacts and deals — nothing falls through here.
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          >
            {t.done ? (
              <CheckSquare size={16} className="text-success shrink-0" />
            ) : (
              <Square size={16} className="text-[var(--text-muted)] shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm">{t.title}</div>
              {t.contactName && (
                <div className="text-xs text-[var(--text-muted)]">{t.contactName}</div>
              )}
            </div>
            {t.dueDate && (
              <span className="text-xs text-[var(--text-muted)] shrink-0">{t.dueDate}</span>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-sm text-[var(--text-muted)] text-center py-8">
            No tasks yet.
          </div>
        )}
      </div>
    </div>
  );
}
