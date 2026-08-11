import { db } from "@/db";
import { contacts } from "@/db/schema";
import ContactsTable from "./ContactsTable";

export default async function ContactsPage() {
  const rows = await db.select().from(contacts);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Contacts</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Every lead and client in one list, with source tracked for what&apos;s actually working.
        </p>
      </div>

      <ContactsTable contacts={rows} />
    </div>
  );
}
