"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Flame, Pencil, Trash2, User as UserIcon } from "lucide-react";
import { ActivityPanel } from "@/components/ActivityModal";
import { TaskPanel } from "@/components/TaskModal";
import { DealFormModal } from "@/components/DealFormModal";

type Deal = {
  id: string;
  title: string;
  value: number | null;
  stageId: string;
  contactId: string;
  expectedCloseDate: string | null;
  staleSince: string | null;
  ownerId: string | null;
  contactName: string | null;
  contactCompany: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  stageName: string | null;
  stageColor: string | null;
};
type Contact = { id: string; name: string; company: string | null };
type Stage = { id: string; name: string; color: string };
type Owner = { id: string; name: string };

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

export default function DealDetailView({
  deal: initialDeal,
  currentUserId,
}: {
  deal: Deal;
  currentUserId: string;
}) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
    fetch("/api/stages").then((r) => r.json()).then(setStages);
    fetch("/api/users/basic").then((r) => r.json()).then(setOwners);
  }, []);

  const ownerName = useMemo(
    () => owners.find((o) => o.id === deal.ownerId)?.name ?? null,
    [owners, deal.ownerId]
  );

  type DealListRow = {
    id: string;
    title: string;
    value: number;
    stageId: string;
    contactId: string;
    contactName: string | null;
    contactCompany: string | null;
    expectedCloseDate: string | null;
    staleSince: string | null;
    ownerId: string | null;
  };

  function refreshDeal() {
    Promise.all([
      fetch("/api/deals").then((r) => r.json()) as Promise<DealListRow[]>,
      fetch("/api/contacts").then((r) => r.json()) as Promise<
        { id: string; email: string | null; phone: string | null }[]
      >,
    ]).then(([rows, contactRows]) => {
      const updated = rows.find((d) => d.id === deal.id);
      if (!updated) return;
      const contact = contactRows.find((c) => c.id === updated.contactId);
      const stage = stages.find((s) => s.id === updated.stageId);
      setDeal((prev) => ({
        ...prev,
        ...updated,
        contactEmail: contact?.email ?? prev.contactEmail,
        contactPhone: contact?.phone ?? prev.contactPhone,
        stageName: stage?.name ?? prev.stageName,
        stageColor: stage?.color ?? prev.stageColor,
      }));
    });
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${deal.title}"? This can't be undone.`)) return;
    const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      window.alert(body?.error ?? "Couldn't delete this deal.");
      return;
    }
    router.push("/pipeline");
  }

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors mb-4"
      >
        <ArrowLeft size={14} />
        Pipeline
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold">{deal.title}</h1>
            {deal.staleSince && (
              <span title="No activity recently — at risk" className="text-risk">
                <Flame size={18} />
              </span>
            )}
          </div>
          {deal.contactName && (
            <Link
              href={`/contacts/${deal.contactId}`}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors mt-1"
            >
              <Building2 size={13} />
              {deal.contactCompany ?? deal.contactName}
            </Link>
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
            Stage
          </div>
          <div className="flex items-center gap-1.5 font-display font-semibold">
            {deal.stageColor && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: deal.stageColor }}
              />
            )}
            {deal.stageName ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Value
          </div>
          <div className="font-display font-semibold text-[var(--accent)]">
            {formatValue(deal.value ?? 0)}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Expected close
          </div>
          <div className="font-display font-semibold">{deal.expectedCloseDate ?? "—"}</div>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
            Contact
          </div>
          <div className="text-sm">
            {deal.contactEmail && <div className="truncate">{deal.contactEmail}</div>}
            {deal.contactPhone && (
              <div className="text-[var(--text-muted)]">{deal.contactPhone}</div>
            )}
            {!deal.contactEmail && !deal.contactPhone && "—"}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <ActivityPanel contactId={deal.contactId} dealId={deal.id} onLogged={refreshDeal} />
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <TaskPanel contactId={deal.contactId} dealId={deal.id} />
        </div>
      </div>

      {showEdit && (
        <DealFormModal
          deal={{ ...deal, value: deal.value ?? 0 }}
          contacts={contacts}
          stages={stages}
          users={owners}
          currentUserId={currentUserId}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            refreshDeal();
          }}
        />
      )}
    </div>
  );
}
