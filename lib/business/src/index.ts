export { business } from "./config";
import { business } from "./config";

export function estimatePrice(
  packageId: string,
  durationHours: number,
  addOns: readonly string[] = [],
) {
  const pkg = business.packages.find((p) => p.id === packageId);
  if (!pkg) throw new Error("Choose a valid package.");
  if (
    !Number.isInteger(durationHours) ||
    durationHours < pkg.includedHours ||
    durationHours > business.booking.maxHours
  )
    throw new Error(
      `Choose ${pkg.includedHours}–${business.booking.maxHours} whole hours.`,
    );
  if (
    new Set(addOns).size !== addOns.length ||
    addOns.some((id) => !business.addOns.some((a) => a.id === id))
  )
    throw new Error("Choose valid add-ons.");
  const extraHours = durationHours - pkg.includedHours;
  const totalAmountRwf =
    pkg.basePriceRwf === null
      ? null
      : pkg.basePriceRwf + extraHours * pkg.extraHourRwf;
  const depositPercentage = business.booking.depositPercentage;
  return {
    packageId: pkg.id,
    packageName: pkg.name,
    pricingVersion: business.pricingVersion,
    includedHours: pkg.includedHours,
    basePriceRwf: pkg.basePriceRwf,
    hourlyRateRwf: pkg.extraHourRwf,
    totalAmountRwf,
    depositPercentage,
    depositAmountRwf:
      totalAmountRwf === null || addOns.length > 0 || depositPercentage === null
        ? null
        : Math.round((totalAmountRwf * depositPercentage) / 100),
    quoteRequired: totalAmountRwf === null || addOns.length > 0,
  };
}

export function formatRwf(amount: number | null | undefined) {
  return amount == null
    ? "Quote on request"
    : `RWF ${amount.toLocaleString("en-RW")}`;
}
export function addOnName(id: string) {
  return business.addOns.find((a) => a.id === id)?.name ?? id;
}
export function whatsappUrl(message = "") {
  return business.contact.whatsappNumber
    ? `https://wa.me/${business.contact.whatsappNumber}?text=${encodeURIComponent(message)}`
    : null;
}
export function normalizePhone(value: string) {
  const digits = value.replace(/[\s()-]/g, "").replace(/^00/, "+");
  if (/^0[7]\d{8}$/.test(digits)) return `+250${digits.slice(1)}`;
  if (/^2507\d{8}$/.test(digits)) return `+${digits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(digits))
    throw new Error(
      "Enter a valid phone number, including the country code (for example +250788123456).",
    );
  return digits;
}
export function isDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function kigaliToday(now = new Date()) {
  return new Date(now.getTime() + 2 * 3600000).toISOString().slice(0, 10);
}
export function bookingWindow(date: string, start: string, duration: number) {
  if (
    !isDate(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    throw new Error("Choose a valid event date and time.");
  const startAt = new Date(`${date}T${start}:00+02:00`);
  return { startAt, endAt: new Date(startAt.getTime() + duration * 3600000) };
}
export function windowsOverlap(
  a: { startAt: Date; endAt: Date },
  b: { startAt: Date; endAt: Date },
) {
  return a.startAt < b.endAt && a.endAt > b.startAt;
}
export function validateOpening(
  date: string,
  start: string,
  duration: number,
  now = new Date(),
) {
  const range = bookingWindow(date, start, duration);
  if (range.startAt <= now)
    throw new Error("Choose an event time in the future.");
  if (date < business.booking.earliestEventDate)
    throw new Error(
      `Online requests are for events from ${business.booking.earliestEventDate}. Contact us for earlier dates.`,
    );
  if (
    !business.booking.acceptEarlyRequests &&
    kigaliToday(now) < business.booking.earliestEventDate
  )
    throw new Error(
      `Booking requests open on ${business.booking.earliestEventDate}.`,
    );
  return range;
}
