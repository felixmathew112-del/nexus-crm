import { db, sqlite } from "./index";
import { contacts, stages, deals, tasks, activities, users } from "./schema";
import { randomUUID } from "crypto";

function id() {
  return randomUUID();
}

async function seed() {
  // Users
  const alice = { id: id(), name: "Alice Menon", email: "alice@company.com", role: "manager" };
  const ravi = { id: id(), name: "Ravi Nair", email: "ravi@company.com", role: "rep" };
  await db.insert(users).values([alice, ravi]);

  // Default pipeline stages
  const stageDefs = [
    { id: id(), name: "New Lead", order: 1, color: "#6366f1" },
    { id: id(), name: "Contacted", order: 2, color: "#0ea5e9" },
    { id: id(), name: "Qualified", order: 3, color: "#f59e0b" },
    { id: id(), name: "Proposal Sent", order: 4, color: "#f97316" },
    { id: id(), name: "Negotiation", order: 5, color: "#a855f7" },
    { id: id(), name: "Won", order: 6, color: "#22c55e" },
    { id: id(), name: "Lost", order: 7, color: "#ef4444" },
  ];
  await db.insert(stages).values(stageDefs);

  // Contacts
  const contactDefs = [
    { id: id(), name: "Sanjay Kumar", company: "Kumar Builders", email: "sanjay@kumarbuilders.com", phone: "+91 98470 11223", source: "referral", ownerId: ravi.id },
    { id: id(), name: "Fatima Al Sayed", company: "Al Sayed Trading", email: "fatima@alsayed.ae", phone: "+971 50 123 4567", source: "website", ownerId: alice.id },
    { id: id(), name: "Thomas Varghese", company: "Varghese Retail", email: "thomas@vretail.in", phone: "+91 94950 33221", source: "walk-in", ownerId: ravi.id },
    { id: id(), name: "Noora Al Balushi", company: "Balushi Holdings", email: "noora@balushi.om", phone: "+968 9123 4567", source: "whatsapp", ownerId: alice.id },
    { id: id(), name: "Anil Menon", company: "Menon Hardware", email: "anil@menonhw.in", phone: "+91 98460 55112", source: "referral", ownerId: ravi.id },
  ];
  await db.insert(contacts).values(contactDefs);

  // Deals spread across stages
  const dealDefs = [
    { id: id(), title: "Kumar Builders - Bulk Cement Order", contactId: contactDefs[0].id, stageId: stageDefs[1].id, value: 450000, ownerId: ravi.id, expectedCloseDate: "2026-08-20" },
    { id: id(), title: "Al Sayed - Annual Supply Contract", contactId: contactDefs[1].id, stageId: stageDefs[3].id, value: 1200000, ownerId: alice.id, expectedCloseDate: "2026-08-15" },
    { id: id(), title: "Varghese Retail - POS Rollout", contactId: contactDefs[2].id, stageId: stageDefs[0].id, value: 90000, ownerId: ravi.id, expectedCloseDate: "2026-09-01" },
    { id: id(), title: "Balushi Holdings - Filtration Units", contactId: contactDefs[3].id, stageId: stageDefs[4].id, value: 600000, ownerId: alice.id, expectedCloseDate: "2026-08-10", staleSince: "2026-07-20" },
    { id: id(), title: "Menon Hardware - Repeat Order", contactId: contactDefs[4].id, stageId: stageDefs[5].id, value: 150000, ownerId: ravi.id, expectedCloseDate: "2026-07-28" },
  ];
  await db.insert(deals).values(dealDefs);

  // Tasks
  await db.insert(tasks).values([
    { id: id(), dealId: dealDefs[0].id, contactId: contactDefs[0].id, title: "Follow up on quote", dueDate: "2026-08-03", ownerId: ravi.id },
    { id: id(), dealId: dealDefs[1].id, contactId: contactDefs[1].id, title: "Send revised proposal", dueDate: "2026-08-04", ownerId: alice.id },
    { id: id(), dealId: dealDefs[3].id, contactId: contactDefs[3].id, title: "Check in - deal is stale", dueDate: "2026-08-02", ownerId: alice.id },
  ]);

  // Activities
  await db.insert(activities).values([
    { id: id(), contactId: contactDefs[0].id, dealId: dealDefs[0].id, type: "call", content: "Discussed pricing for 200 bags, sending quote tomorrow.", authorId: ravi.id },
    { id: id(), contactId: contactDefs[1].id, dealId: dealDefs[1].id, type: "email", content: "Sent annual contract draft v2.", authorId: alice.id },
    { id: id(), contactId: contactDefs[3].id, dealId: dealDefs[3].id, type: "whatsapp", content: "No response in 12 days - flagged as at risk.", authorId: alice.id },
  ]);

  console.log("Seed complete.");
}

seed().then(() => sqlite.close());
