import { db } from "@/db";
import { deals, contacts, stages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DealDetailView from "./DealDetailView";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [row] = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      contactId: deals.contactId,
      expectedCloseDate: deals.expectedCloseDate,
      staleSince: deals.staleSince,
      lostReason: deals.lostReason,
      ownerId: deals.ownerId,
      contactName: contacts.name,
      contactCompany: contacts.company,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
      stageName: stages.name,
      stageColor: stages.color,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .leftJoin(stages, eq(deals.stageId, stages.id))
    .where(eq(deals.id, id));

  if (!row) notFound();

  return <DealDetailView deal={row} currentUserId={currentUser!.id} />;
}
