import { pgTable, text, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Timestamp columns stay plain text (rather than a native timestamp type) so
// every reader in the app - which already treats them as opaque strings and
// parses with `new Date(...)` - keeps working unchanged. now()::text always
// includes a UTC offset, so that parsing is unambiguous regardless of the
// database server's session timezone.
const nowText = (columnName: string) => text(columnName).default(sql`now()::text`);

// ---------- Contacts / Leads ----------
export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  source: text("source"), // e.g. website, referral, walk-in, whatsapp
  ownerId: text("owner_id"), // sales rep assigned
  createdAt: nowText("created_at"),
  lastContactedAt: text("last_contacted_at"),
});

// ---------- Pipeline stages (configurable per org, seeded with defaults) ----------
export const stages = pgTable("stages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull(),
  probability: integer("probability"), // 0-100, likelihood a deal in this stage closes Won
});

// ---------- Deals (a contact moving through the pipeline) ----------
export const deals = pgTable("deals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  contactId: text("contact_id").notNull(),
  stageId: text("stage_id").notNull(),
  value: doublePrecision("value").default(0),
  ownerId: text("owner_id"),
  createdAt: nowText("created_at"),
  updatedAt: nowText("updated_at"),
  expectedCloseDate: text("expected_close_date"),
  staleSince: text("stale_since"), // set when no activity for N days -> powers "at risk" flag
  lostReason: text("lost_reason"), // why a deal moved to the Lost stage
});

// ---------- Tasks / reminders (kills "leads slipping through cracks") ----------
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  dealId: text("deal_id"),
  contactId: text("contact_id"),
  title: text("title").notNull(),
  dueDate: text("due_date"),
  done: boolean("done").default(false),
  ownerId: text("owner_id"),
  createdAt: nowText("created_at"),
});

// ---------- Activity log (calls, emails, whatsapp, notes - unified timeline) ----------
export const activities = pgTable("activities", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull(),
  dealId: text("deal_id"),
  type: text("type").notNull(), // note | call | email | whatsapp | stage_change
  content: text("content").notNull(),
  createdAt: nowText("created_at"),
  authorId: text("author_id"),
});

// ---------- Users (sales reps / admins) ----------
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").default("rep"), // rep | manager | admin
  passwordHash: text("password_hash"), // salt:hash (scrypt) - null means login is disabled
});

// ---------- Notifications (e.g. "this deal/contact was just assigned to you") ----------
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(), // recipient
  type: text("type").notNull(), // deal_assigned | contact_assigned
  dealId: text("deal_id"),
  contactId: text("contact_id"),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  createdAt: nowText("created_at"),
});
