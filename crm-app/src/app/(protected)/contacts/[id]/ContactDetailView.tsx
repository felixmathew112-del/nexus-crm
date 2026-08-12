"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Flame,
  Pencil,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { ActivityPanel } from "@/components/ActivityModal";
import { TaskPanel } from "@/components/TaskModal";
import { ContactFormModal, type ContactFormContact } from "@/components/ContactFormModal";

type Contact = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  ownerId: string | null;
};

type Deal = {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  expectedCloseDate: string | null;
  staleSince: string | null;
  stageName: string | null;
  stageColor: string | null;
};
type Owner = { id: string; name: string };

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

export default function ContactDetailView({
  contact: initialContact,
  deals,
  currentUserId,
}: {
  contact: Contact;
  deals: Deal[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch("/api/users/basic").then((r) => r.json()).then(setOwners);
  }, []);

  const ownerName = useMemo(
    () => owners.find((o) => o.id === contact.ownerId)?.name ?? null,
    [owners, contact.ownerId]
  );

  function handleSaved(updated: ContactFormContact) {
    setContact(updated);
    setShowEdit(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${contact.name}? This can't be undone.`)) return;
    const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.error ?? "Couldn't delete this contact.");
      return;
    }
    router.push("/contacts");
  }

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Contacts
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold">{contact.name}</h1>
          {contact.company && (
            <div className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-1">
              <Building2 size={13} />
              {contact.company}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] text-sm px-3 py-2 hover:border-[var(--accent)]/50 transition-colors"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] text-sm px-3 py-2 text-risk hover:border-risk transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Owner
          </div>
          <div className="flex items-center gap-1.5 font-display font-semibold truncate">
            <UserIcon size={13} className="shrink-0 text-[var(--text-muted)]" />
            {ownerName ?? "Unassigned"}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Email
          </div>
          <div className="font-display font-semibold flex items-center gap-1.5 truncate">
            {contact.email && <Mail size={13} className="shrink-0" />}
            {contact.email ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Phone
          </div>
          <div className="font-display font-semibold flex items-center gap-1.5">
            {contact.phone && <Phone size={13} className="shrink-0" />}
            {contact.phone ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Source
          </div>
          <div className="font-display font-semibold capitalize">{contact.source ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Deals
          </div>
          <div className="font-display font-semibold">{deals.length}</div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-display text-sm font-semibold mb-3">Deals</h2>
        {deals.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            No deals for this contact yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {deals.map((d) => (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--accent)]/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-snug">{d.title}</span>
                  {d.staleSince && (
                    <span title="No activity recently — at risk" className="text-risk shrink-0">
                      <Flame size={14} />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
                  {d.stageColor && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.stageColor }}
                    />
                  )}
                  {d.stageName ?? "—"}
                </div>
                <div className="font-display text-sm font-semibold text-[var(--accent)] mt-2">
                  {formatValue(d.value ?? 0)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <ActivityPanel contactId={contact.id} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <TaskPanel contactId={contact.id} />
        </div>
      </div>

      {showEdit && (
        <ContactFormModal
          contact={contact}
          users={owners}
          currentUserId={currentUserId}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
