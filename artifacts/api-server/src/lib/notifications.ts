import nodemailer from "nodemailer";
import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import {
  db,
  notificationOutboxTable as outbox,
  type BookingRequest,
} from "@workspace/db";
import { business, formatRwf, addOnName } from "@workspace/business";
import { logger } from "./logger";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export function mailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM,
  );
}

export function bookingMessages(booking: BookingRequest) {
  const summary = [
    `Reference: ${booking.reference}`,
    `Name: ${booking.fullName}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email || "Not supplied"}`,
    `Preferred contact: ${booking.preferredContactMethod}`,
    `Organization: ${booking.organizationName || "Individual"}`,
    `Event: ${booking.eventType}`,
    `Package: ${booking.packageName || "Legacy request"}`,
    `Date: ${booking.eventDate} at ${booking.startTime.slice(0, 5)} (Africa/Kigali)`,
    `Duration: ${booking.durationHours} hours`,
    `Venue: ${booking.venue}, ${booking.location}`,
    `Guests: ${booking.guestCount}`,
    `Print format: ${booking.printFormat}`,
    `Backdrop: ${booking.backdropPreference}`,
    `Add-ons: ${booking.addOns.map(addOnName).join(", ") || "None"}`,
    `Package estimate: ${formatRwf(booking.totalAmountRwf)}${booking.quoteRequired ? "; final quote required (add-ons priced separately)" : ""}`,
    `Custom details: ${booking.brandedRequirements || "None"}`,
    `Notes: ${booking.notes || "None"}`,
  ].join("\n");
  const messages = [
    {
      bookingId: booking.id,
      recipient: business.contact.email,
      subject: `New Memento request — ${booking.reference}`,
      body: `A new request needs your review.\n\n${summary}\n\nOpen the Memento booking desk to review availability and contact the customer. This request is not yet confirmed.`,
    },
  ];
  const customerMessages = booking.email
    ? [
        {
          bookingId: booking.id,
          recipient: booking.email,
          subject: `Your Memento request — ${booking.reference}`,
          body: `Hi ${booking.fullName},\n\nThank you for choosing Memento. We have received your request.\n\n${summary}\n\nWe will review availability and reply personally. Your booking is not confirmed yet, and no payment is due now. Add-ons and payment terms will be confirmed with your quote.\n\nQuestions? Reply to ${business.contact.email}.\n\nMemento\nPrinted. Shared. Remembered.`,
        },
      ]
    : [];
  return [...messages, ...customerMessages];
}

export async function queueBookingEmails(
  tx: Transaction,
  booking: BookingRequest,
) {
  await tx.insert(outbox).values(bookingMessages(booking));
}

export async function notificationStates(ids: number[]) {
  const map = new Map<
    number,
    "sent" | "pending" | "retrying" | "not_configured" | "none"
  >();
  if (!ids.length) return map;
  const rows = await db
    .select()
    .from(outbox)
    .where(inArray(outbox.bookingId, ids));
  for (const id of ids) {
    const messages = rows.filter((row) => row.bookingId === id);
    const unsent = messages.filter((row) => !row.sentAt);
    map.set(
      id,
      !messages.length
        ? "none"
        : !unsent.length
          ? "sent"
          : !mailConfigured()
            ? "not_configured"
            : unsent.some((row) => row.attempts > 0)
              ? "retrying"
              : "pending",
    );
  }
  return map;
}

export type MailSender = (message: {
  to: string;
  subject: string;
  text: string;
  messageId: string;
}) => Promise<unknown>;
export async function deliverNext(send: MailSender) {
  return db.transaction(async (tx) => {
    const [message] = await tx
      .select()
      .from(outbox)
      .where(and(isNull(outbox.sentAt), lte(outbox.nextAttemptAt, new Date())))
      .orderBy(outbox.id)
      .limit(1)
      .for("update", { skipLocked: true });
    if (!message) return false;
    try {
      await send({
        to: message.recipient,
        subject: message.subject,
        text: message.body,
        messageId: `<memento-request-${message.id}@memento.local>`,
      });
      await tx
        .update(outbox)
        .set({
          sentAt: new Date(),
          attempts: message.attempts + 1,
          lastError: null,
        })
        .where(eq(outbox.id, message.id));
    } catch {
      // Persist retries without logging customer content or SMTP credentials.
      const delay = Math.min(
        3600000,
        30000 * 2 ** Math.min(message.attempts, 7),
      );
      await tx
        .update(outbox)
        .set({
          attempts: message.attempts + 1,
          nextAttemptAt: new Date(Date.now() + delay),
          lastError: "Email delivery failed; retry scheduled",
        })
        .where(eq(outbox.id, message.id));
      logger.warn(
        { notificationId: message.id },
        "Email delivery failed; retry scheduled",
      );
    }
    return true;
  });
}

export function startNotificationWorker() {
  if (!mailConfigured()) {
    logger.warn(
      "Email delivery is unconfigured; booking notifications will remain queued",
    );
    return () => {};
  }
  const transport = nodemailer.createTransport({
    requireTLS: true,
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_PORT || "465") === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    socketTimeout: 15000,
    greetingTimeout: 10000,
  });
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      for (let i = 0; i < 10; i++) {
        if (
          !(await deliverNext((message) =>
            transport.sendMail({
              ...message,
              from: process.env.SMTP_FROM,
              replyTo: business.contact.email,
            }),
          ))
        )
          break;
      }
    } catch {
      logger.error(
        "Notification worker could not access its queue; will retry",
      );
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void tick(), 15000);
  timer.unref();
  void tick();
  return () => {
    clearInterval(timer);
    transport.close();
  };
}
