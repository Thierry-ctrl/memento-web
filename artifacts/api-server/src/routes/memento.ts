import { Router, type IRouter, type RequestHandler } from "express";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
  lt,
  gt,
} from "drizzle-orm";
import { clerkClient, getAuth } from "@clerk/express";
import {
  AddBookingNoteBody,
  CreateBlockedAvailabilityBody,
  CreateBookingBody,
  CreateBookingResponse,
  GetBookingResponse,
  ListBookingsQueryParams,
  ListBookingsResponse,
  UpdateBookingBody,
  UpdateBookingResponse,
} from "@workspace/api-zod";
import {
  adminNotesTable,
  blockedAvailabilityTable,
  bookingRequestsTable,
  db,
} from "@workspace/db";
import { business, isDate, kigaliToday } from "@workspace/business";
import {
  BookingError,
  createRequest,
  changeStatus,
  blockDate,
  unblockDate,
  blockedWindow,
} from "../lib/booking-service";
import { notificationStates } from "../lib/notifications";

const router: IRouter = Router();
const requestTimes = new Map<string, number[]>();
const cleanup = setInterval(() => {
  for (const [ip, times] of requestTimes)
    if (!times.some((t) => Date.now() - t < 900000)) requestTimes.delete(ip);
}, 60000);
cleanup.unref();
const requireAdmin: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Please sign in." });
    return;
  }
  const allowlisted = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!allowlisted) {
    res.status(503).json({ error: "Administrator access is not configured." });
    return;
  }
  // Default Clerk sessions do not include email; use the verified account identity.
  const user = await clerkClient.users.getUser(auth.userId);
  if (
    !user.emailAddresses.some(
      (e) =>
        e.emailAddress.toLowerCase() === allowlisted &&
        e.verification?.status === "verified",
    )
  ) {
    res
      .status(403)
      .json({ error: "This account does not have administrator access." });
    return;
  }
  next();
};
function idParam(value: string | string[]) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new BookingError("Invalid identifier.");
  return id;
}
async function serializeBookings(
  rows: Array<typeof bookingRequestsTable.$inferSelect>,
) {
  const ids = rows.map((row) => row.id);
  const notes = ids.length
    ? await db
        .select()
        .from(adminNotesTable)
        .where(inArray(adminNotesTable.bookingId, ids))
        .orderBy(asc(adminNotesTable.createdAt))
    : [];
  const notifications = await notificationStates(ids);
  return rows.map((row) => ({
    ...row,
    startTime: row.startTime.slice(0, 5),
    endTime: row.endTime?.slice(0, 5) ?? null,
    adminNotes: notes.filter((note) => note.bookingId === row.id),
    notificationStatus: notifications.get(row.id) || "none",
  }));
}
router.get("/settings", (_req, res) => {
  res.json({
    bookingOpeningDate: business.booking.earliestEventDate,
    earlyBookingMode: business.booking.acceptEarlyRequests,
    pricingVersion: business.pricingVersion,
  });
});
router.get("/availability", async (req, res) => {
  const from = String(req.query.from || ""),
    to = String(req.query.to || "");
  if (
    !isDate(from) ||
    !isDate(to) ||
    from > to ||
    Date.parse(to) - Date.parse(from) > 366 * 86400000
  )
    throw new BookingError("Choose a valid date range of up to one year.");
  const rangeStart = new Date(`${from}T00:00:00+02:00`);
  const rangeEnd = new Date(
    new Date(`${to}T00:00:00+02:00`).getTime() + 86400000,
  );
  const [blocked, confirmed] = await Promise.all([
    db.select().from(blockedAvailabilityTable),
    db
      .select()
      .from(bookingRequestsTable)
      .where(
        and(
          eq(bookingRequestsTable.status, "confirmed"),
          lt(bookingRequestsTable.startsAt, rangeEnd),
          gt(bookingRequestsTable.endsAt, rangeStart),
        ),
      ),
  ]);
  res.json([
    ...blocked
      .map((row) => ({ row, range: blockedWindow(row) }))
      .filter(
        ({ range }) => range.startAt < rangeEnd && range.endAt > rangeStart,
      )
      .map(({ row, range }) => ({
        date: row.date,
        startTime: row.startTime?.slice(0, 5) ?? null,
        endTime: row.endTime?.slice(0, 5) ?? null,
        reason: "blocked",
        startsAt: range.startAt,
        endsAt: range.endAt,
      })),
    ...confirmed.map((row) => ({
      date: row.eventDate,
      startTime: row.startTime.slice(0, 5),
      endTime: row.endTime?.slice(0, 5) ?? null,
      reason: "confirmed",
      startsAt: row.startsAt,
      endsAt: row.endsAt,
    })),
  ]);
});
router.post("/bookings", async (req, res) => {
  const ip = req.ip || "unknown",
    now = Date.now();
  const recent = (requestTimes.get(ip) || []).filter((t) => now - t < 900000);
  if (recent.length >= 10) {
    res.setHeader("Retry-After", "900");
    throw new BookingError(
      "Please wait before submitting another request.",
      429,
    );
  }
  requestTimes.set(ip, [...recent, now]);
  const parsed = CreateBookingBody.safeParse(req.body);
  if (
    !parsed.success ||
    parsed.data.website ||
    !parsed.data.consent ||
    typeof req.body.eventDate !== "string" ||
    !isDate(req.body.eventDate)
  )
    throw new BookingError("Please review the required booking details.");
  if (req.body.pricingVersion !== business.pricingVersion)
    throw new BookingError(
      "Our package details have changed. Refresh this page and review the current estimate before submitting.",
      409,
    );
  const row = await createRequest({
    ...parsed.data,
    eventDate: req.body.eventDate,
  });
  res.status(201).json(CreateBookingResponse.parse(row));
});
router.use("/admin", requireAdmin);
router.get("/admin/bookings", async (req, res) => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) throw new BookingError("Invalid filters.");
  const filters = [];
  if (parsed.data.status)
    filters.push(eq(bookingRequestsTable.status, parsed.data.status));
  if (parsed.data.search) {
    const term = `%${parsed.data.search}%`;
    filters.push(
      or(
        ilike(bookingRequestsTable.reference, term),
        ilike(bookingRequestsTable.fullName, term),
        ilike(bookingRequestsTable.eventType, term),
      ),
    );
  }
  const rows = await db
    .select()
    .from(bookingRequestsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(bookingRequestsTable.createdAt));
  res.json(ListBookingsResponse.parse(await serializeBookings(rows)));
});
router.get("/admin/bookings/:id", async (req, res) => {
  const [row] = await db
    .select()
    .from(bookingRequestsTable)
    .where(eq(bookingRequestsTable.id, idParam(req.params.id)));
  if (!row) throw new BookingError("Booking not found.", 404);
  res.json(GetBookingResponse.parse((await serializeBookings([row]))[0]));
});
router.patch("/admin/bookings/:id", async (req, res) => {
  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) throw new BookingError("Invalid update.");
  const row = await changeStatus(idParam(req.params.id), parsed.data.status);
  res.json(UpdateBookingResponse.parse((await serializeBookings([row]))[0]));
});
router.post("/admin/bookings/:id/notes", async (req, res) => {
  const id = idParam(req.params.id),
    body = AddBookingNoteBody.safeParse(req.body);
  if (!body.success || !body.data.note.trim())
    throw new BookingError("Enter a note.");
  const [booking] = await db
    .select({ id: bookingRequestsTable.id })
    .from(bookingRequestsTable)
    .where(eq(bookingRequestsTable.id, id));
  if (!booking) throw new BookingError("Booking not found.", 404);
  const [note] = await db
    .insert(adminNotesTable)
    .values({ bookingId: id, note: body.data.note.trim() })
    .returning();
  res.status(201).json(note);
});
router.get("/admin/availability", async (_req, res) => {
  res.json(
    await db
      .select()
      .from(blockedAvailabilityTable)
      .orderBy(asc(blockedAvailabilityTable.date)),
  );
});
router.post("/admin/availability", async (req, res) => {
  const parsed = CreateBlockedAvailabilityBody.safeParse(req.body);
  if (!parsed.success || !isDate(req.body.date))
    throw new BookingError("Check the date and reason.");
  res
    .status(201)
    .json(await blockDate({ ...parsed.data, date: req.body.date }));
});
router.delete("/admin/availability/:id", async (req, res) => {
  await unblockDate(idParam(req.params.id));
  res.sendStatus(204);
});
router.get("/admin/summary", async (_req, res) => {
  const rows = await db
    .select({
      status: bookingRequestsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(bookingRequestsTable)
    .groupBy(bookingRequestsTable.status);
  const counts = Object.fromEntries(rows.map((row) => [row.status, row.count]));
  const [conflicts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingRequestsTable)
    .where(eq(bookingRequestsTable.potentialConflict, true));
  const [upcoming] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingRequestsTable)
    .where(
      and(
        eq(bookingRequestsTable.status, "confirmed"),
        gte(bookingRequestsTable.eventDate, kigaliToday()),
      ),
    );
  res.json({
    total: rows.reduce((sum, row) => sum + row.count, 0),
    pending: counts.pending || 0,
    contacted: counts.contacted || 0,
    confirmed: counts.confirmed || 0,
    declined: counts.declined || 0,
    cancelled: counts.cancelled || 0,
    potentialConflicts: conflicts.count,
    upcomingConfirmed: upcoming.count,
  });
});
router.get("/admin/export.csv", async (_req, res) => {
  const rows = await db
    .select()
    .from(bookingRequestsTable)
    .orderBy(desc(bookingRequestsTable.createdAt));
  const quote = (value: unknown) => {
    let s = String(value ?? "");
    if (/^[=+\-@\t\r\n]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const header = [
    "Reference",
    "Status",
    "Customer",
    "Organization",
    "Name",
    "Phone",
    "Email",
    "Event",
    "Date",
    "Start",
    "Hours",
    "Venue",
    "Location",
    "Guests",
    "Package",
    "Package estimate RWF",
    "Add-ons",
    "Quote required",
    "Pricing version",
    "Conflict",
  ];
  const csv = [
    header.map(quote).join(","),
    ...rows.map((row) =>
      [
        row.reference,
        row.status,
        row.customerType,
        row.organizationName,
        row.fullName,
        row.phone,
        row.email,
        row.eventType,
        row.eventDate,
        row.startTime,
        row.durationHours,
        row.venue,
        row.location,
        row.guestCount,
        row.packageName,
        row.totalAmountRwf,
        row.addOns.join("; "),
        row.quoteRequired,
        row.pricingVersion,
        row.potentialConflict,
      ]
        .map(quote)
        .join(","),
    ),
  ].join("\n");
  res
    .type("text/csv")
    .setHeader(
      "Content-Disposition",
      "attachment; filename=memento-bookings.csv",
    )
    .send(csv);
});
export default router;
