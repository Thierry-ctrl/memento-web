import { and, eq, inArray, lt, gt, ne, sql } from "drizzle-orm";
import {
  db,
  bookingRequestsTable as bookings,
  blockedAvailabilityTable as blocks,
} from "@workspace/db";
import {
  bookingWindow,
  windowsOverlap,
  estimatePrice,
  business,
  validateOpening,
  normalizePhone,
  isDate,
  kigaliToday,
} from "@workspace/business";
import { queueBookingEmails } from "./notifications";

export class BookingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
// All creation, confirmation and blocking paths take this same transaction lock.
// The desk has one shared capacity until the owner defines multiple independent booths.
export async function lockSchedule(tx: Transaction) {
  await tx.execute(sql`select pg_advisory_xact_lock(62534601)`);
}

export function blockedWindow(row: {
  date: string;
  startTime: string | null;
  endTime: string | null;
}) {
  const startAt = bookingWindow(
    row.date,
    row.startTime?.slice(0, 5) || "00:00",
    24,
  ).startAt;
  let endAt = row.endTime
    ? bookingWindow(row.date, row.endTime.slice(0, 5), 1).startAt
    : bookingWindow(row.date, "00:00", 24).endAt;
  if (endAt <= startAt) endAt = new Date(endAt.getTime() + 86400000);
  return { startAt, endAt };
}

async function assertAvailable(
  tx: Transaction,
  range: { startAt: Date; endAt: Date },
  excludeId?: number,
) {
  const confirmed = await tx
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        lt(bookings.startsAt, range.endAt),
        gt(bookings.endsAt, range.startAt),
        excludeId ? ne(bookings.id, excludeId) : undefined,
      ),
    );
  const blocked = await tx.select().from(blocks);
  if (
    confirmed.length ||
    blocked.some((b) => windowsOverlap(range, blockedWindow(b)))
  )
    throw new BookingError(
      "That time is unavailable. Please choose another date or time.",
      409,
    );
}

async function refreshConflicts(tx: Transaction) {
  // Recalculate both sides, clearing stale flags after cancellation/decline.
  await tx.execute(sql`UPDATE booking_requests b SET potential_conflict =
    (b.status IN ('pending', 'contacted') AND (
      EXISTS (SELECT 1 FROM booking_requests other WHERE other.id <> b.id
        AND other.status IN ('pending', 'contacted', 'confirmed')
        AND other.starts_at < b.ends_at AND other.ends_at > b.starts_at)
      OR EXISTS (SELECT 1 FROM blocked_availability a WHERE
        ((a.date + COALESCE(a.start_time, '00:00'::time)) AT TIME ZONE 'Africa/Kigali') < b.ends_at
        AND ((a.date + COALESCE(a.end_time, '00:00'::time)
          + CASE WHEN a.end_time IS NULL OR a.end_time <= COALESCE(a.start_time, '00:00'::time) THEN INTERVAL '1 day' ELSE INTERVAL '0 day' END)
          AT TIME ZONE 'Africa/Kigali') > b.starts_at)
    ))`);
}

export type RequestInput = {
  packageId?: string | null;
  customerType: "individual" | "organization";
  organizationName?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  preferredContactMethod: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  durationHours: number;
  venue: string;
  location: string;
  guestCount: number;
  printFormat: string;
  backdropPreference: string;
  addOns?: string[];
  brandedRequirements?: string | null;
  notes?: string | null;
  consent: boolean;
};

export async function createRequest(input: RequestInput) {
  if (!input.consent)
    throw new BookingError("Please acknowledge the booking request terms.");
  if (
    ![
      "email",
      "phone",
      ...(business.contact.whatsappNumber ? ["whatsapp"] : []),
    ].includes(input.preferredContactMethod)
  )
    throw new BookingError("Choose an available contact method.");
  let pricing, range, phone;
  try {
    pricing = estimatePrice(
      input.packageId || "",
      input.durationHours,
      input.addOns || [],
    );
    range = validateOpening(
      input.eventDate,
      input.startTime,
      input.durationHours,
    );
    phone = normalizePhone(input.phone);
  } catch (error) {
    throw new BookingError((error as Error).message);
  }
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new BookingError("Enter a valid email address.");
  if (input.preferredContactMethod === "email" && !email)
    throw new BookingError(
      "An email address is required when email is your preferred contact method.",
    );
  if (input.customerType === "organization" && !input.organizationName?.trim())
    throw new BookingError("Organization name is required.");
  if (
    !Number.isInteger(input.guestCount) ||
    input.guestCount < 1 ||
    input.guestCount > 10000
  )
    throw new BookingError(
      "Guest count must be a whole number between 1 and 10,000.",
    );
  if (
    !["4x6", "2x6-strip", "discuss"].includes(input.printFormat) ||
    !["from-selection", "custom", "discuss"].includes(input.backdropPreference)
  )
    throw new BookingError("Choose a valid print format and backdrop.");
  if (
    input.backdropPreference === "custom" &&
    !input.addOns?.includes("custom-backdrop")
  )
    throw new BookingError(
      "Select the Custom Backdrops add-on for a custom backdrop.",
    );
  for (const field of [
    input.fullName,
    input.eventType,
    input.venue,
    input.location,
  ])
    if (field.trim().length < 2)
      throw new BookingError("Complete all required event details.");
  return db.transaction(async (tx) => {
    await lockSchedule(tx);
    await assertAvailable(tx, range);
    const [created] = await tx
      .insert(bookings)
      .values({
        customerType: input.customerType,
        organizationName:
          input.customerType === "organization"
            ? input.organizationName?.trim()
            : null,
        fullName: input.fullName.trim(),
        phone,
        email,
        preferredContactMethod: input.preferredContactMethod,
        eventType: input.eventType.trim(),
        eventDate: input.eventDate,
        startTime: input.startTime,
        endTime: new Date(range.endAt.getTime() + 7200000)
          .toISOString()
          .slice(11, 16),
        startsAt: range.startAt,
        endsAt: range.endAt,
        durationHours: input.durationHours,
        venue: input.venue.trim(),
        location: input.location.trim(),
        guestCount: input.guestCount,
        printFormat: input.printFormat,
        backdropPreference: input.backdropPreference,
        addOns: input.addOns || [],
        brandedRequirements: input.brandedRequirements || null,
        notes: input.notes || null,
        consent: input.consent,
        earlyRequest: kigaliToday() < business.booking.earliestEventDate,
        reference: `MEM-${input.eventDate.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        ...pricing,
        paymentStatus: "not_due",
        paymentMethod: null,
      })
      .returning();
    await refreshConflicts(tx);
    await queueBookingEmails(tx, created);
    const [fresh] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, created.id));
    return fresh;
  });
}

export async function changeStatus(
  id: number,
  status: typeof bookings.$inferSelect.status,
) {
  return db.transaction(async (tx) => {
    await lockSchedule(tx);
    const [old] = await tx.select().from(bookings).where(eq(bookings.id, id));
    if (!old) throw new BookingError("Booking not found", 404);
    if (status === "confirmed")
      await assertAvailable(
        tx,
        { startAt: old.startsAt, endAt: old.endsAt },
        id,
      );
    const [row] = await tx
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    await refreshConflicts(tx);
    const [fresh] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, row.id));
    return fresh;
  });
}

export async function blockDate(input: {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  reason: string;
}) {
  if (
    !isDate(input.date) ||
    Boolean(input.startTime) !== Boolean(input.endTime)
  )
    throw new BookingError(
      "Choose a valid date and supply both times, or neither for a full day.",
    );
  if (
    input.startTime &&
    (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime!) ||
      input.startTime === input.endTime)
  )
    throw new BookingError("Choose a valid start and end time.");
  return db.transaction(async (tx) => {
    await lockSchedule(tx);
    await assertAvailable(
      tx,
      blockedWindow({
        date: input.date,
        startTime: input.startTime || null,
        endTime: input.endTime || null,
      }),
    );
    const [row] = await tx.insert(blocks).values(input).returning();
    await refreshConflicts(tx);
    return row;
  });
}
export async function unblockDate(id: number) {
  return db.transaction(async (tx) => {
    await lockSchedule(tx);
    await tx.delete(blocks).where(eq(blocks.id, id));
    await refreshConflicts(tx);
  });
}
