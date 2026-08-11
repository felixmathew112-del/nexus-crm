"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Flame, Building2, MessageSquarePlus } from "lucide-react";
import { ActivityModal } from "@/components/ActivityModal";

type Stage = { id: string; name: string; order: number; color: string };
type Deal = {
  id: string;
  title: string;
  value: number;
  stageId: string;
  contactId: string;
  contactName: string | null;
  contactCompany: string | null;
  expectedCloseDate: string | null;
  staleSince: string | null;
};

function formatValue(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  return `₹${v.toLocaleString()}`;
}

function DealCard({
  deal,
  onLogActivity,
}: {
  deal: Deal;
  onLogActivity: (deal: Deal) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3 mb-2.5 cursor-grab active:cursor-grabbing hover:border-[var(--accent)]/50 transition-colors ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-snug">{deal.title}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {deal.staleSince && (
            <span title="No activity recently — at risk" className="text-risk">
              <Flame size={14} />
            </span>
          )}
          <button
            type="button"
            title="Activity history"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onLogActivity(deal);
            }}
            className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            <MessageSquarePlus size={14} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
        <Building2 size={12} />
        <span className="truncate">{deal.contactCompany ?? deal.contactName}</span>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="font-display text-sm font-semibold text-[var(--accent)]">
          {formatValue(deal.value)}
        </span>
        {deal.expectedCloseDate && (
          <span className="text-[10px] text-[var(--text-muted)]">
            {deal.expectedCloseDate}
          </span>
        )}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  deals,
  onLogActivity,
}: {
  stage: Stage;
  deals: Deal[];
  onLogActivity: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-1 mb-3">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: stage.color }}
        />
        <span className="font-display text-sm font-semibold">{stage.name}</span>
        <span className="text-xs text-[var(--text-muted)]">{deals.length}</span>
        <span className="ml-auto text-xs text-[var(--text-muted)]">
          {formatValue(total)}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl border p-2 min-h-[200px] transition-colors ${
          isOver
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onLogActivity={onLogActivity} />
        ))}
        {deals.length === 0 && (
          <div className="text-xs text-[var(--text-muted)] text-center py-6">
            No deals here
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelineBoard() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [activityDeal, setActivityDeal] = useState<Deal | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function refreshDeals() {
    fetch("/api/deals").then((r) => r.json()).then(setDeals);
  }

  useEffect(() => {
    fetch("/api/stages").then((r) => r.json()).then(setStages);
    refreshDeals();
  }, []);

  const dealsByStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    for (const stage of stages) map[stage.id] = [];
    for (const deal of deals) {
      if (!map[deal.stageId]) map[deal.stageId] = [];
      map[deal.stageId].push(deal);
    }
    return map;
  }, [stages, deals]);

  function handleDragStart(event: DragStartEvent) {
    const deal = deals.find((d) => d.id === event.active.id);
    setActiveDeal(deal ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over) return;
    const newStageId = over.id as string;
    const dealId = active.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stageId === newStageId) return;

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stageId: newStageId, staleSince: null } : d))
    );
    await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId: newStageId }),
    });
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] ?? []}
              onLogActivity={setActivityDeal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} onLogActivity={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
      {activityDeal && (
        <ActivityModal
          title={activityDeal.title}
          subtitle={activityDeal.contactCompany ?? activityDeal.contactName}
          contactId={activityDeal.contactId}
          dealId={activityDeal.id}
          onClose={() => setActivityDeal(null)}
          onLogged={refreshDeals}
        />
      )}
    </>
  );
}
