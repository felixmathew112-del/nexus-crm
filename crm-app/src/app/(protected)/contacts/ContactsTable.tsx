"use client";
import { useMemo, useState } from "react";
import {
  Phone,
  Mail,
  Building2,
  MessageSquarePlus,
  ListTodo,
  UserPlus,
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { ActivityModal } from "@/components/ActivityModal";
import { TaskModal } from "@/components/TaskModal";
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

const LEAD_SOURCES = ["referral", "website", "walk-in", "whatsapp"] as const;

function ContactFormModal({
  contact,
  onClose,
  onSaved,
}: {
  contact?: Contact;
  onClose: () => void;
  onSaved: (contact: Contact) => void;
}) {
  const isEdit = Boolean(contact);
  const [name, setName] = useState(contact?.name ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [source, setSource] = useState<(typeof LEAD_SOURCES)[number]>(
    (contact?.source as (typeof LEAD_SOURCES)[number]) ?? "referral"
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch(isEdit ? `/api/contacts/${contact!.id}` : "/api/contacts", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        company: company || null,
        email: email || null,
        phone: phone || null,
        source,
      }),
    });
    const saved: Contact = await res.json();
    setSubmitting(false);
    onSaved(saved);
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
          <h2 className="font-display text-sm font-semibold">
            {isEdit ? "Edit contact" : "New contact"}
          </h2>
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
            {isEdit ? "Save changes" : "Add contact"}
          </button>
        </form>
      </div>
    </div>
  );
}

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
