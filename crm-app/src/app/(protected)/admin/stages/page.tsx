import { db } from "@/db";
import { deals, stages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import StagesTable from "./StagesTable";

export default async function AdminStagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "manager" && currentUser.role !== "admin")) {
    redirect("/");
  }

  const rows = await db.select().from(stages).orderBy(asc(stages.order));
  const dealRows = await db.select({ stageId: deals.stageId }).from(deals);
  const dealCounts: Record<string, number> = {};
  for (const d of dealRows) {
    dealCounts[d.stageId] = (dealCounts[d.stageId] ?? 0) + 1;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Pipeline stages</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Configure the stages deals move through, their color, and the close probability used
          for the weighted forecast on Reports.
        </p>
      </div>

      <StagesTable stages={rows} dealCounts={dealCounts} />
    </div>
  );
}
