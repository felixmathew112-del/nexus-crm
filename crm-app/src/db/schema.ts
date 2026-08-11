import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------- Contacts / Leads ----------
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  source: text("source"), // e.g. website, referral, walk-in, whatsapp
  ownerId: text("owner_id"), // sales rep assigned
  createdAt: text("created_at").default(sql`(current_timestamp)`),
  lastContactedAt: text("last_contacted_at"),
});

// ---------- Pipeline stages (configurable per org, seeded with defaults) ----------
export const stages = sqliteTable("stages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  color: text("color").notNull(),
});

// ---------- Deals (a contact moving through the pipeline) ----------
export const deals = sqliteTable("deals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  contactId: text("contact_id").notNull(),
  stageId: text("stage_id").notNull(),
  value: real("value").default(0),
  ownerId: text("owner_id"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").default(sql`(current_timestamp)`),
  expectedCloseDate: text("expected_close_date"),
  staleSince: text("stale_since"), // set when no activity for N days -> powers "at risk" flag
});

// ---------- Tasks / reminders (kills "leads slipping through cracks") ----------
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  dealId: text("deal_id"),
  contactId: text("contact_id"),
  title: text("title").notNull(),
  dueDate: text("due_date"),
  done: integer("done", { mode: "boolean" }).default(false),
  ownerId: text("owner_id"),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
});

// ---------- Activity log (calls, emails, whatsapp, notes - unified timeline) ----------
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").notNull(),
  dealId: text("deal_id"),
  type: text("type").notNull(), // note | call | email | whatsapp | stage_change
  content: text("content").notNull(),
  createdAt: text("created_at").default(sql`(current_timestamp)`),
  authorId: text("author_id"),
});

// ---------- Users (sales reps / admins) ----------
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").default("rep"), // rep | manager | admin
});
