import { Router, type IRouter, type RequestHandler } from "express";
import { and, asc, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  AddBookingNoteBody,
  AddBookingNoteParams,
  CreateBlockedAvailabilityBody,
  CreateBlockedAvailabilityResponse,
  CreateBookingBody,
  CreateBookingResponse,
  DeleteBlockedAvailabilityParams,
  GetAdminSummaryResponse,
  GetAvailabilityQueryParams,
  GetAvailabilityResponse,
  GetBookingParams,
  GetBookingResponse,
  GetSiteSettingsResponse,
  ListBlockedAvailabilityResponse,
  ListBookingsQueryParams,
  ListBookingsResponse,
  UpdateBookingBody,
  UpdateBookingParams,
  UpdateBookingResponse,
} from "@workspace/api-zod";
import {
  adminNotesTable,
  blockedAvailabilityTable,
  bookingRequestsTable,
  db,
  siteSettingsTable,
} from "@workspace/db";

const router: IRouter = Router();
const requestTimes = new Map<string, number[]>();

const requireAdmin: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const allowlisted = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const claimEmail = String(
    auth.sessionClaims?.email ??
      auth.sessionClaims?.email_address ??
      "",
  ).toLowerCase();
  if (allowlisted && claimEmail !== allowlisted) {
    res.status(403).json({ error: "Administrator access required" });
    return;
  }
  next();
};

function dateString(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function overlaps(startA: string, endA: string | null, startB: string | null, endB: string | null): boolean {
  if (!startB || !endB || !endA) return true;
  return startA < endB && endA > startB;
}

async function notesFor(ids: number[]) {
  if (!ids.length) return new Map<number, Array<{ id: number; note: string; createdAt: Date }>>();
  const notes = await db.select().from(adminNotesTable).where(sql`${adminNotesTable.bookingId} = ANY(${ids})`).orderBy(asc(adminNotesTable.createdAt));
  const map = new Map<number, Array<{ id: number; note: string; createdAt: Date }>>();
  for (const note of notes) {
    const list = map.get(note.bookingId) ?? [];
    list.push({ id: note.id, note: note.note, createdAt: note.createdAt });
    map.set(note.bookingId, list);
  }
  return map;
}

function serializeBooking(booking: typeof bookingRequestsTable.$inferSelect, adminNotes: Array<{ id: number; note: string; createdAt: Date }> = []) {
  return {
    ...booking,
    durationHours: booking.durationHours ?? null,
    endTime: booking.endTime?.slice(0, 5) ?? null,
    startTime: booking.startTime.slice(0, 5),
    email: booking.email ?? null,
    brandedRequirements: booking.brandedRequirements ?? null,
    notes: booking.notes ?? null,
    adminNotes,
  };
}

router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(siteSettingsTable);
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  res.json(GetSiteSettingsResponse.parse({
    bookingOpeningDate: settings.booking_opening_date ?? "2026-10-01",
    earlyBookingMode: (settings.early_booking_mode ?? "true") === "true",
  }));
});

router.get("/availability", async (req, res): Promise<void> => {
  const fromParam = typeof req.query.from === "string" ? req.query.from : "";
  const toParam = typeof req.query.to === "string" ? req.query.to : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromParam) || !/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
    res.status(400).json({ error: "Valid from and to dates are required." });
    return;
  }
  const from = fromParam;
  const to = toParam;
  const [blocked, confirmed] = await Promise.all([
    db.select().from(blockedAvailabilityTable).where(and(gte(blockedAvailabilityTable.date, from), lte(blockedAvailabilityTable.date, to))),
    db.select().from(bookingRequestsTable).where(and(eq(bookingRequestsTable.status, "confirmed"), gte(bookingRequestsTable.eventDate, from), lte(bookingRequestsTable.eventDate, to))),
  ]);
  res.json(GetAvailabilityResponse.parse([
    ...blocked.map((item) => ({ date: item.date, startTime: item.startTime?.slice(0, 5) ?? null, endTime: item.endTime?.slice(0, 5) ?? null, reason: "blocked" })),
    ...confirmed.map((item) => ({ date: item.eventDate, startTime: item.startTime.slice(0, 5), endTime: item.endTime?.slice(0, 5) ?? null, reason: "confirmed" })),
  ]));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const recent = (requestTimes.get(ip) ?? []).filter((time) => now - time < 15 * 60_000);
  if (recent.length >= 5) {
    res.status(429).json({ error: "Please wait before submitting another request." });
    return;
  }
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success || parsed.data.website || !parsed.data.consent) {
    res.status(400).json({ error: "Please review the required booking details." });
    return;
  }
  const eventDate = dateString(parsed.data.eventDate);
  if (eventDate < new Date().toISOString().slice(0, 10)) {
    res.status(400).json({ error: "Event date cannot be in the past." });
    return;
  }
  const [sameDate, blocked] = await Promise.all([
    db.select().from(bookingRequestsTable).where(and(eq(bookingRequestsTable.eventDate, eventDate), or(eq(bookingRequestsTable.status, "pending"), eq(bookingRequestsTable.status, "contacted"), eq(bookingRequestsTable.status, "confirmed")))),
    db.select().from(blockedAvailabilityTable).where(eq(blockedAvailabilityTable.date, eventDate)),
  ]);
  const endTime = parsed.data.endTime ?? null;
  const conflict = sameDate.some((item) => overlaps(parsed.data.startTime, endTime, item.startTime, item.endTime)) ||
    blocked.some((item) => overlaps(parsed.data.startTime, endTime, item.startTime, item.endTime));
  const reference = `MEM-${eventDate.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
  const [created] = await db.insert(bookingRequestsTable).values({
    ...parsed.data,
    email: parsed.data.email ?? null,
    eventDate,
    endTime,
    durationHours: parsed.data.durationHours ? Math.round(parsed.data.durationHours) : null,
    guestCount: Math.round(parsed.data.guestCount),
    addOns: parsed.data.addOns ?? [],
    brandedRequirements: parsed.data.brandedRequirements ?? null,
    notes: parsed.data.notes ?? null,
    reference,
    potentialConflict: conflict,
  }).returning();
  requestTimes.set(ip, [...recent, now]);
  res.status(201).json(CreateBookingResponse.parse(created));
});

router.use("/admin", requireAdmin);

router.get("/admin/bookings", async (req, res): Promise<void> => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const filters = [];
  if (parsed.data.status) filters.push(eq(bookingRequestsTable.status, parsed.data.status));
  if (parsed.data.search) {
    const term = `%${parsed.data.search}%`;
    filters.push(or(ilike(bookingRequestsTable.reference, term), ilike(bookingRequestsTable.fullName, term), ilike(bookingRequestsTable.eventType, term)));
  }
  const rows = await db.select().from(bookingRequestsTable).where(filters.length ? and(...filters) : undefined).orderBy(desc(bookingRequestsTable.createdAt));
  const notes = await notesFor(rows.map((row) => row.id));
  res.json(ListBookingsResponse.parse(rows.map((row) => serializeBooking(row, notes.get(row.id)))));
});

router.get("/admin/bookings/:id", async (req, res): Promise<void> => {
  const parsed = GetBookingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.select().from(bookingRequestsTable).where(eq(bookingRequestsTable.id, parsed.data.id));
  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const notes = await notesFor([row.id]);
  res.json(GetBookingResponse.parse(serializeBooking(row, notes.get(row.id))));
});

router.patch("/admin/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  const body = UpdateBookingBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid update" });
    return;
  }
  const [row] = await db.update(bookingRequestsTable).set({ status: body.data.status }).where(eq(bookingRequestsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const notes = await notesFor([row.id]);
  res.json(UpdateBookingResponse.parse(serializeBooking(row, notes.get(row.id))));
});

router.post("/admin/bookings/:id/notes", async (req, res): Promise<void> => {
  const params = AddBookingNoteParams.safeParse(req.params);
  const body = AddBookingNoteBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid note" });
    return;
  }
  const [note] = await db.insert(adminNotesTable).values({ bookingId: params.data.id, note: body.data.note }).returning();
  res.status(201).json({ id: note.id, note: note.note, createdAt: note.createdAt });
});

router.get("/admin/availability", async (_req, res): Promise<void> => {
  const rows = await db.select().from(blockedAvailabilityTable).orderBy(asc(blockedAvailabilityTable.date));
  res.json(ListBlockedAvailabilityResponse.parse(rows.map((row) => ({ ...row, startTime: row.startTime?.slice(0, 5) ?? null, endTime: row.endTime?.slice(0, 5) ?? null }))));
});

router.post("/admin/availability", async (req, res): Promise<void> => {
  const parsed = CreateBlockedAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(blockedAvailabilityTable).values({
    ...parsed.data,
    date: dateString(parsed.data.date),
    startTime: parsed.data.startTime ?? null,
    endTime: parsed.data.endTime ?? null,
  }).returning();
  res.status(201).json(CreateBlockedAvailabilityResponse.parse({ ...row, startTime: row.startTime?.slice(0, 5) ?? null, endTime: row.endTime?.slice(0, 5) ?? null }));
});

router.delete("/admin/availability/:id", async (req, res): Promise<void> => {
  const parsed = DeleteBlockedAvailabilityParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(blockedAvailabilityTable).where(eq(blockedAvailabilityTable.id, parsed.data.id));
  res.sendStatus(204);
});

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const rows = await db.select({ status: bookingRequestsTable.status, count: sql<number>`count(*)::int` }).from(bookingRequestsTable).groupBy(bookingRequestsTable.status);
  const counts = Object.fromEntries(rows.map((row) => [row.status, row.count]));
  const [conflicts] = await db.select({ count: sql<number>`count(*)::int` }).from(bookingRequestsTable).where(eq(bookingRequestsTable.potentialConflict, true));
  const [upcoming] = await db.select({ count: sql<number>`count(*)::int` }).from(bookingRequestsTable).where(and(eq(bookingRequestsTable.status, "confirmed"), gte(bookingRequestsTable.eventDate, new Date().toISOString().slice(0, 10))));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  res.json(GetAdminSummaryResponse.parse({ total, pending: counts.pending ?? 0, contacted: counts.contacted ?? 0, confirmed: counts.confirmed ?? 0, declined: counts.declined ?? 0, cancelled: counts.cancelled ?? 0, potentialConflicts: conflicts.count, upcomingConfirmed: upcoming.count }));
});

router.get("/admin/export.csv", async (_req, res): Promise<void> => {
  const rows = await db.select().from(bookingRequestsTable).orderBy(desc(bookingRequestsTable.createdAt));
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["Reference", "Status", "Name", "Phone", "Email", "Event", "Date", "Start", "Venue", "Location", "Guests", "Conflict"];
  const csv = [header.map(quote).join(","), ...rows.map((row) => [row.reference, row.status, row.fullName, row.phone, row.email, row.eventType, row.eventDate, row.startTime, row.venue, row.location, row.guestCount, row.potentialConflict].map(quote).join(","))].join("\n");
  res.type("text/csv").setHeader("Content-Disposition", "attachment; filename=memento-bookings.csv").send(csv);
});

export default router;