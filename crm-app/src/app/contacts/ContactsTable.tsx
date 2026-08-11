"use client";
import { useState } from "react";
import {
  Phone,
  Mail,
  Building2,
  MessageSquarePlus,
  ListTodo,
  UserPlus,
  X,
  Loader2,
} from "lucide-react";
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

const LEAD_SOURCES = ["referral", "website", "walk-in", "whatsapp"] as const;

function NewContactModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<(typeof LEAD_SOURCES)[number]>("referral");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        source,
      }),
    });
    const contact: Contact = await res.json();
    setSubmitting(false);
    onCreated(contact);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="font-display text-sm font-semibold">New contact</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Lead source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as typeof source)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm capitalize outline-none focus:border-[var(--accent)]"
            >
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Add contact
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ContactsTable({ contacts: initialContacts }: { contacts: Contact[] }) {
  const [contacts, setContacts] = useState(initialContacts);
  const [activityContact, setActivityContact] = useState<Contact | null>(null);
  const [taskContact, setTaskContact] = useState<Contact | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);

  function handleCreated(contact: Contact) {
    setContacts((prev) => [contact, ...prev]);
    setShowNewContact(false);
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowNewContact(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium px-3 py-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus size={14} />
          New contact
        </button>
      </div>

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
            {contacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  No contacts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewContact && (
        <NewContactModal onClose={() => setShowNewContact(false)} onCreated={handleCreated} />
      )}
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
