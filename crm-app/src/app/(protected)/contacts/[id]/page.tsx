import { db } from "@/db";
import { contacts, deals, stages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import ContactDetailView from "./ContactDetailView";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) notFound();

  const contactDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      expectedCloseDate: deals.expectedCloseDate,
      staleSince: deals.staleSince,
      stageName: stages.name,
      stageColor: stages.color,
    })
    .from(deals)
    .leftJoin(stages, eq(deals.stageId, stages.id))
    .where(eq(deals.contactId, id));

  return (
    <ContactDetailView
      contact={contact}
      deals={contactDeals}
      currentUserId={currentUser!.id}
      currentUserRole={currentUser!.role}
    />
  );
}
