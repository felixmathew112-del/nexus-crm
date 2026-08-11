"use client";
import { useState } from "react";
import { Phone, Mail, Building2, MessageSquarePlus, ListTodo } from "lucide-react";
import { ActivityModal } from "@/components/ActivityModal";
import { TaskModal } from "@/components/TaskModal";

type Contact = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
};

export default function ContactsTable({ contacts }: { contacts: Contact[] }) {
  const [activityContact, setActivityContact] = useState<Contact | null>(null);
  const [taskContact, setTaskContact] = useState<Contact | null>(null);

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--surface)] text-left text-[var(--text-muted)] text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c, i) => (
              <tr
                key={c.id}
                className={`border-t border-[var(--border)] ${
                  i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface)]/60"
                } hover:bg-[var(--surface-raised)] transition-colors`}
              >
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={13} />
                    {c.company ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  <div className="flex flex-col gap-1">
                    {c.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} /> {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} /> {c.phone}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs capitalize">
                    {c.source ?? "unknown"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      title="Activity history"
                      onClick={() => setActivityContact(c)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <MessageSquarePlus size={15} />
                    </button>
                    <button
                      type="button"
                      title="Tasks"
                      onClick={() => setTaskContact(c)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ListTodo size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activityContact && (
        <ActivityModal
          title={activityContact.name}
          subtitle={activityContact.company}
          contactId={activityContact.id}
          onClose={() => setActivityContact(null)}
        />
      )}
      {taskContact && (
        <TaskModal
          title={taskContact.name}
          subtitle={taskContact.company}
          contactId={taskContact.id}
          onClose={() => setTaskContact(null)}
        />
      )}
    </>
  );
}
