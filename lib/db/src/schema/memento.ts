import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "contacted",
  "confirmed",
  "declined",
  "cancelled",
]);

export const bookingRequestsTable = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  status: bookingStatusEnum("status").notNull().default("pending"),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  preferredContactMethod: text("preferred_contact_method").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time"),
  durationHours: integer("duration_hours"),
  venue: text("venue").notNull(),
  location: text("location").notNull(),
  guestCount: integer("guest_count").notNull(),
  printFormat: text("print_format").notNull(),
  backdropPreference: text("backdrop_preference").notNull(),
  addOns: jsonb("add_ons").$type<string[]>().notNull().default([]),
  brandedRequirements: text("branded_requirements"),
  notes: text("notes"),
  consent: boolean("consent").notNull(),
  earlyRequest: boolean("early_request").notNull().default(false),
  potentialConflict: boolean("potential_conflict").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const adminNotesTable = pgTable("admin_notes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingRequestsTable.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blockedAvailabilityTable = pgTable("blocked_availability", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  startTime: time("start_time"),
  endTime: time("end_time"),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettingsTable = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type BookingRequest = typeof bookingRequestsTable.$inferSelect;
export type AdminNote = typeof adminNotesTable.$inferSelect;
export type BlockedAvailability = typeof blockedAvailabilityTable.$inferSelect;