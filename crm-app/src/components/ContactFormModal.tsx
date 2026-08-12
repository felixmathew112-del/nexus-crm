"use client";
import { useMemo, useState } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export type ContactFormContact = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  ownerId: string | null;
};

export const LEAD_SOURCES = ["referral", "website", "walk-in", "whatsapp"] as const;

type OwnerOption = { id: string; name: string };
type ExistingContact = { id: string; name: string; email: string | null; phone: string | null };

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

// Create/edit form for a contact, shared between the contacts table's quick
// actions and the contact detail page. Pass `contact` to edit (PATCHes);
// omit it to create (POSTs).
export function ContactFormModal({
  contact,
  existingContacts,
  users,
  currentUserId,
  onClose,
  onSaved,
}: {
  contact?: ContactFormContact;
  existingContacts: ExistingContact[];
  users: OwnerOption[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (contact: ContactFormContact) => void;
}) {
  const isEdit = Boolean(contact);
  const [name, setName] = useState(contact?.name ?? "");
  const [company, setCompany] = useState(contact?.company ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [source, setSource] = useState<(typeof LEAD_SOURCES)[number]>(
    (contact?.source as (typeof LEAD_SOURCES)[number]) ?? "referral"
  );
  const [ownerId, setOwnerId] = useState(contact?.ownerId ?? currentUserId);
  const [submitting, setSubmitting] = useState(false);

  const duplicateMatch = useMemo(() => {
    const trimmedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    return existingContacts.find((c) => {
      if (c.id === contact?.id) return false;
      const emailMatch = trimmedEmail && c.email?.toLowerCase() === trimmedEmail;
      const phoneMatch = normalizedPhone && c.phone && normalizePhone(c.phone) === normalizedPhone;
      return Boolean(emailMatch || phoneMatch);
    });
  }, [existingContacts, email, phone, contact?.id]);

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
        ownerId: ownerId || null,
      }),
    });
    const saved: ContactFormContact = await res.json();
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

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1.5">Owner</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id === currentUserId ? `${u.name} (you)` : u.name}
                </option>
              ))}
            </select>
          </div>

          {duplicateMatch && (
            <div className="flex items-start gap-2 rounded-lg border border-risk/30 bg-risk/10 px-3 py-2 text-xs text-risk">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Matches an existing contact:{" "}
                <Link
                  href={`/contacts/${duplicateMatch.id}`}
                  target="_blank"
                  className="font-medium underline"
                >
                  {duplicateMatch.name}
                </Link>
                . You can still save if this is a different person.
              </span>
            </div>
          )}

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
