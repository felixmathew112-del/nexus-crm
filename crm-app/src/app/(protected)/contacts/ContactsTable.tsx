"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Mail,
  Building2,
  MessageSquarePlus,
  ListTodo,
  UserPlus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import { ActivityModal } from "@/components/ActivityModal";
import { TaskModal } from "@/components/TaskModal";
import { ContactFormModal } from "@/components/ContactFormModal";
import { ScopeToggle, defaultScopeForRole, type Scope } from "@/components/ScopeToggle";

type Contact = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  ownerId: string | null;
};
type CurrentUser = { id: string; role: string | null };

export default function ContactsTable({
  contacts: initialContacts,
  currentUser,
}: {
  contacts: Contact[];
  currentUser: CurrentUser;
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [activityContact, setActivityContact] = useState<Contact | null>(null);
  const [taskContact, setTaskContact] = useState<Contact | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [scope, setScope] = useState<Scope>(() => defaultScopeForRole(currentUser.role));

  function handleCreated(contact: Contact) {
    setContacts((prev) => [contact, ...prev]);
    setShowNewContact(false);
  }

  function handleEdited(contact: Contact) {
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
    setEditContact(null);
  }

  async function handleDelete(contact: Contact) {
    if (!window.confirm(`Delete ${contact.name}? This can't be undone.`)) return;
    const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.error ?? "Couldn't delete this contact.");
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== contact.id));
  }

  const sourceOptions = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.source ?? "unknown"))).sort(),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (scope === "mine" && c.ownerId !== currentUser.id) return false;
      if (sourceFilter !== "all" && (c.source ?? "unknown") !== sourceFilter) return false;
      if (!q) return true;
      return [c.name, c.company, c.email, c.phone].some((field) =>
        field?.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, sourceFilter, scope, currentUser.id]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, email, phone…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <ScopeToggle value={scope} onChange={setScope} />

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm capitalize outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All sources</option>
          {sourceOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="text-xs text-[var(--text-muted)] sm:ml-1">
          {filteredContacts.length} of {contacts.length}
        </span>

        <button
          type="button"
          onClick={() => setShowNewContact(true)}
          className="sm:ml-auto flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg)] text-sm font-medium px-3 py-2 hover:opacity-90 transition-opacity"
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
            {filteredContacts.map((c, i) => (
              <tr
                key={c.id}
                className={`border-t border-[var(--border)] ${
                  i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--surface)]/60"
                } hover:bg-[var(--surface-raised)] transition-colors`}
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/contacts/${c.id}`}
                    className="hover:text-[var(--accent)] hover:underline transition-colors"
                  >
                    {c.name}
                  </Link>
                </td>
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
                    <button
                      type="button"
                      title="Edit contact"
                      onClick={() => setEditContact(c)}
                      className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="Delete contact"
                      onClick={() => handleDelete(c)}
                      className="text-[var(--text-muted)] hover:text-risk transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredContacts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  {contacts.length === 0 ? "No contacts yet." : "No contacts match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNewContact && (
        <ContactFormModal onClose={() => setShowNewContact(false)} onSaved={handleCreated} />
      )}
      {editContact && (
        <ContactFormModal
          contact={editContact}
          onClose={() => setEditContact(null)}
          onSaved={handleEdited}
        />
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
