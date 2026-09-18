import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import {
  estimatePrice,
  normalizePhone,
  bookingWindow,
  windowsOverlap,
  validateOpening,
  business,
} from "@workspace/business";

const url = new URL(
  process.env.TEST_DATABASE_URL ||
    "postgresql://memento_test:local-test-only@127.0.0.1:55439/memento_test",
);
if (
  !["127.0.0.1", "localhost"].includes(url.hostname) ||
  !url.pathname.endsWith("_test") ||
  url.port !== "55439"
)
  throw new Error("Use an isolated local *_test database on port 55439");
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = "test";
// Tests must never send email or contact an authentication service.
delete process.env.CLERK_SECRET_KEY;
delete process.env.CLERK_PUBLISHABLE_KEY;
delete process.env.SMTP_HOST;
const { pool } = await import("@workspace/db");
const { createRequest, changeStatus, blockDate, unblockDate } =
  await import("../src/lib/booking-service");
const { deliverNext } = await import("../src/lib/notifications");
const { default: app } = await import("../src/app");
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api`;
beforeEach(async () => {
  await pool.query(
    "TRUNCATE notification_outbox, admin_notes, blocked_availability, booking_requests RESTART IDENTITY CASCADE",
  );
});
after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end();
});
const valid = {
  packageId: "birthday",
  customerType: "individual" as const,
  fullName: "Test Customer",
  phone: "0788123456",
  email: "customer@example.test",
  preferredContactMethod: "email",
  eventType: "Birthday",
  eventDate: "2099-10-01",
  startTime: "18:00",
  durationHours: 2,
  venue: "Test Venue",
  location: "Kigali",
  guestCount: 50,
  printFormat: "2x6-strip",
  backdropPreference: "from-selection",
  addOns: [],
  consent: true,
};
test("package prices and separately quoted add-ons", () => {
  assert.equal(estimatePrice("birthday", 2).totalAmountRwf, 200000);
  assert.equal(estimatePrice("birthday", 3).totalAmountRwf, 275000);
  assert.equal(estimatePrice("wedding", 2).totalAmountRwf, 300000);
  assert.equal(estimatePrice("wedding", 4).totalAmountRwf, 600000);
  assert.equal(estimatePrice("other", 3).totalAmountRwf, null);
  assert.equal(estimatePrice("birthday", 2, ["keepsakes"]).quoteRequired, true);
  assert.equal(estimatePrice("wedding", 2).depositAmountRwf, null);
  for (const hours of [0, 1, 2.5, 25, NaN])
    assert.throws(() => estimatePrice("birthday", hours));
  assert.throws(() => estimatePrice("birthday", 2, ["unknown"]));
  assert.throws(() => estimatePrice("birthday", 2, ["keepsakes", "keepsakes"]));
});
test("phone normalization, strict dates and opening date", () => {
  assert.equal(normalizePhone("0788 123 456"), "+250788123456");
  assert.throws(() => normalizePhone("no phone"));
  assert.throws(() => bookingWindow("2099-02-30", "18:00", 2));
  assert.throws(() =>
    validateOpening("2026-09-30", "18:00", 2, new Date("2026-09-01")),
  );
  assert.throws(() =>
    validateOpening("2026-10-01", "18:00", 2, new Date("2026-10-02")),
  );
  assert.equal(
    validateOpening("2099-10-01", "18:00", 2).startAt.toISOString(),
    "2099-10-01T16:00:00.000Z",
  );
});
test("overnight windows overlap; adjacent times do not", () => {
  const late = bookingWindow("2099-10-01", "23:00", 3);
  assert(windowsOverlap(late, bookingWindow("2099-10-02", "01:00", 2)));
  assert(!windowsOverlap(late, bookingWindow("2099-10-02", "02:00", 2)));
});
test("request snapshots authoritative prices and queues two messages atomically", async () => {
  const row = await createRequest({
    ...valid,
    durationHours: 3,
    addOns: ["keepsakes"],
  });
  assert.equal(row.totalAmountRwf, 275000);
  assert.equal(row.pricingVersion, business.pricingVersion);
  assert.equal(row.phone, "+250788123456");
  assert.equal(row.quoteRequired, true);
  assert.equal(row.depositAmountRwf, null);
  assert.equal(
    (await pool.query("SELECT * FROM notification_outbox")).rowCount,
    2,
  );
});
test("invalid required fields, unavailable contact and custom backdrop are rejected", async () => {
  for (const input of [
    { ...valid, email: null },
    { ...valid, consent: false },
    { ...valid, preferredContactMethod: "whatsapp" },
    { ...valid, guestCount: 2.5 },
    { ...valid, backdropPreference: "custom" },
  ])
    await assert.rejects(createRequest(input));
  assert.equal(
    (await pool.query("SELECT * FROM booking_requests")).rowCount,
    0,
  );
});
test("simultaneous overlapping confirmations allow exactly one", async () => {
  const [a, b] = await Promise.all([
    createRequest(valid),
    createRequest(valid),
  ]);
  const results = await Promise.allSettled([
    changeStatus(a.id, "confirmed"),
    changeStatus(b.id, "confirmed"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (
      await pool.query(
        "SELECT * FROM booking_requests WHERE status='confirmed'",
      )
    ).rowCount,
    1,
  );
  await assert.rejects(createRequest(valid), (e: any) => e.status === 409);
});
test("pending conflicts clear on cancellation", async () => {
  const a = await createRequest(valid),
    b = await createRequest(valid);
  assert.equal(
    (
      await pool.query(
        "SELECT * FROM booking_requests WHERE potential_conflict",
      )
    ).rowCount,
    2,
  );
  await changeStatus(b.id, "cancelled");
  assert.equal(
    (
      await pool.query(
        "SELECT potential_conflict FROM booking_requests WHERE id=$1",
        [a.id],
      )
    ).rows[0].potential_conflict,
    false,
  );
});
test("overnight confirmations prevent next-day collision, allow adjacent event", async () => {
  const a = await createRequest({
    ...valid,
    startTime: "23:00",
    durationHours: 3,
  });
  await changeStatus(a.id, "confirmed");
  await assert.rejects(
    createRequest({ ...valid, eventDate: "2099-10-02", startTime: "01:00" }),
  );
  await createRequest({
    ...valid,
    eventDate: "2099-10-02",
    startTime: "02:00",
  });
});
test("full-day and overnight blocks are enforced and removable", async () => {
  const block = await blockDate({
    date: valid.eventDate,
    reason: "Test closure",
  });
  await assert.rejects(createRequest(valid));
  await unblockDate(block.id);
  const pending = await createRequest(valid);
  await blockDate({
    date: valid.eventDate,
    startTime: "17:00",
    endTime: "20:00",
    reason: "Maintenance",
  });
  await assert.rejects(changeStatus(pending.id, "confirmed"));
  await blockDate({
    date: "2099-10-03",
    startTime: "23:00",
    endTime: "02:00",
    reason: "Overnight",
  });
  await assert.rejects(
    createRequest({ ...valid, eventDate: "2099-10-04", startTime: "01:00" }),
  );
});
test("confirmation versus blocking race allows only one", async () => {
  const a = await createRequest(valid);
  const results = await Promise.allSettled([
    changeStatus(a.id, "confirmed"),
    blockDate({ date: valid.eventDate, reason: "Closure" }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
});
test("notification failure persists retry; success marks delivered", async () => {
  await createRequest(valid);
  await deliverNext(async () => {
    throw new Error("Simulated SMTP failure");
  });
  const failed = (
    await pool.query("SELECT * FROM notification_outbox ORDER BY id")
  ).rows[0];
  assert.equal(failed.attempts, 1);
  assert.equal(failed.sent_at, null);
  assert(failed.next_attempt_at > new Date());
  await pool.query(
    "UPDATE notification_outbox SET next_attempt_at=now() WHERE id=$1",
    [failed.id],
  );
  let delivered = 0;
  await deliverNext(async (message) => {
    assert(message.text.includes("not yet confirmed"));
    delivered++;
  });
  assert.equal(delivered, 1);
  assert(
    (
      await pool.query("SELECT sent_at FROM notification_outbox WHERE id=$1", [
        failed.id,
      ])
    ).rows[0].sent_at,
  );
});
test("HTTP contracts, safe pricing, availability and protected administration", async () => {
  let response = await fetch(base + "/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...valid,
      pricingVersion: business.pricingVersion,
      totalAmountRwf: 1,
    }),
  });
  assert.equal(response.status, 201);
  const saved = await response.json();
  assert.equal(saved.totalAmountRwf, 200000);
  assert.equal(saved.depositAmountRwf, null);
  response = await fetch(base + "/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...valid, pricingVersion: "old" }),
  });
  assert.equal(response.status, 409);
  response = await fetch(base + "/availability?from=bad&to=2099-10-01");
  assert.equal(response.status, 400);
  const a = (await pool.query("SELECT id FROM booking_requests")).rows[0];
  await changeStatus(a.id, "confirmed");
  response = await fetch(base + "/availability?from=2099-10-01&to=2099-10-02");
  const windows = await response.json();
  assert.equal(windows[0].startsAt, "2099-10-01T16:00:00.000Z");
  assert(!JSON.stringify(windows).includes("Test Customer"));
  response = await fetch(base + "/admin/bookings");
  assert.equal(response.status, 503); // Fail closed when Clerk is unconfigured.
});
