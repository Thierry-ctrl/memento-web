import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  useCreateBooking,
  useGetAvailability,
  useGetSiteSettings,
  type BookingConfirmation,
} from "@workspace/api-client-react";
import {
  business,
  estimatePrice,
  formatRwf,
  addOnName,
  normalizePhone,
  bookingWindow,
  windowsOverlap,
  kigaliToday,
  validateOpening,
} from "@workspace/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initial = {
  customerType: "individual" as "individual" | "organization",
  organizationName: "",
  fullName: "",
  phone: "",
  email: "",
  preferredContactMethod: "email" as "email" | "phone" | "whatsapp",
  packageId: "birthday",
  eventType: "Birthday",
  eventDate: "",
  startTime: "18:00",
  durationHours: 2,
  venue: "",
  location: "",
  guestCount: 50,
  printFormat: "discuss",
  backdropPreference: "from-selection",
  addOns: [] as string[],
  brandedRequirements: "",
  notes: "",
  consent: false,
  website: "",
};
type Values = typeof initial;
const labels = [
  "Your details",
  "Your gathering",
  "Your experience",
  "A few more details",
  "Review & request",
];
const draftKey = "memento_booking_v2";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
const selectClass =
  "w-full h-12 border-b border-primary/30 bg-transparent text-base outline-offset-4";

export default function Book() {
  const [values, setValues] = useState<Values>(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "package",
    );
    const pkg = business.packages.find((p) => p.id === requested);
    const defaults = pkg
      ? {
          ...initial,
          packageId: pkg.id,
          eventType: pkg.id === "other" ? "" : pkg.name,
        }
      : initial;
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      return !pkg &&
        saved &&
        saved.expires > Date.now() &&
        Array.isArray(saved.values?.addOns)
        ? {
            ...initial,
            ...saved.values,
            addOns: saved.values.addOns.filter((id: unknown) =>
              business.addOns.some((addOn) => addOn.id === id),
            ),
            consent: false,
          }
        : defaults;
    } catch {
      return defaults;
    }
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(
    null,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const create = useCreateBooking();
  const settings = useGetSiteSettings();
  const nextDate =
    values.eventDate &&
    Number.isFinite(Date.parse(`${values.eventDate}T00:00:00Z`))
      ? new Date(Date.parse(`${values.eventDate}T00:00:00Z`) + 86400000)
          .toISOString()
          .slice(0, 10)
      : "";
  const availability = useGetAvailability(
    { from: values.eventDate, to: nextDate },
    {
      query: {
        queryKey: ["availability", values.eventDate],
        enabled: Boolean(values.eventDate),
        staleTime: 0,
        refetchOnWindowFocus: true,
      },
    },
  );
  let estimate: ReturnType<typeof estimatePrice> | null = null;
  try {
    estimate = estimatePrice(
      values.packageId,
      Number(values.durationHours),
      values.addOns,
    );
  } catch {
    /* Validation shown before advancing. */
  }
  let unavailable = false;
  try {
    const range = bookingWindow(
      values.eventDate,
      values.startTime,
      Number(values.durationHours),
    );
    unavailable = Boolean(
      availability.data?.some(
        (w) =>
          w.startsAt &&
          w.endsAt &&
          windowsOverlap(range, {
            startAt: new Date(w.startsAt),
            endAt: new Date(w.endsAt),
          }),
      ),
    );
  } catch {
    /* Date not chosen yet. */
  }
  const update = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((old) => ({ ...old, [key]: value }));
    setError("");
  };
  useEffect(() => {
    if (!confirmation) {
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({
            expires: Date.now() + 86400000,
            values: { ...values, consent: false },
          }),
        );
      } catch {
        /* Draft storage is optional. */
      }
    }
  }, [values, confirmation]);
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step, confirmation]);

  const validate = (at: number) => {
    if (at === 0) {
      if (values.fullName.trim().length < 2)
        return "Please enter your full name.";
      if (
        values.customerType === "organization" &&
        !values.organizationName.trim()
      )
        return "Please enter the organization name.";
      try {
        normalizePhone(values.phone);
      } catch (e) {
        return (e as Error).message;
      }
      if (
        (values.email || values.preferredContactMethod === "email") &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
      )
        return "Please enter a valid email address, or choose phone as your contact method.";
    }
    if (at === 1) {
      if (!settings.data)
        return "We could not load booking information. Please retry or contact us by email.";
      if (settings.data.pricingVersion !== business.pricingVersion)
        return "Our package details have changed. Refresh this page before continuing.";
      if (
        values.eventType.trim().length < 2 ||
        values.venue.trim().length < 2 ||
        values.location.trim().length < 2
      )
        return "Please complete the event type, venue and location.";
      if (
        !Number.isInteger(Number(values.guestCount)) ||
        values.guestCount < 1 ||
        values.guestCount > 10000
      )
        return "Enter a whole guest count between 1 and 10,000.";
      try {
        estimatePrice(
          values.packageId,
          Number(values.durationHours),
          values.addOns,
        );
        validateOpening(
          values.eventDate,
          values.startTime,
          Number(values.durationHours),
        );
      } catch (e) {
        return (e as Error).message;
      }
      if (availability.isFetching)
        return "Please wait while we check the selected time.";
      if (availability.isError)
        return "We could not check availability. Please retry the check below.";
      if (unavailable)
        return "That time is unavailable. Please choose another date or time.";
    }
    if (at === 4 && !values.consent)
      return "Please acknowledge the booking request terms.";
    return "";
  };
  const next = () => {
    const message = validate(step);
    if (message) setError(message);
    else {
      setError("");
      setStep((s) => s + 1);
    }
  };
  const submit = () => {
    for (let i = 0; i <= 4; i++) {
      const message = validate(i);
      if (message) {
        setStep(i);
        setError(message);
        return;
      }
    }
    if (values.website) return;
    create.mutate(
      {
        data: {
          ...values,
          pricingVersion: business.pricingVersion,
          phone: normalizePhone(values.phone),
          email: values.email.trim() || null,
          durationHours: Number(values.durationHours),
          guestCount: Number(values.guestCount),
        },
      },
      {
        onSuccess: (result) => {
          setConfirmation(result);
          try {
            sessionStorage.removeItem(draftKey);
          } catch {
            /* Storage can be disabled. */
          }
        },
        onError: (e: unknown) => {
          const err = e as { status?: number; data?: { error?: string } };
          setError(
            err.data?.error ||
              "Your request could not be submitted. Please try again or email us.",
          );
          if (err.status === 409) {
            setStep(1);
            void availability.refetch();
          }
        },
      },
    );
  };
  const emailLink = `mailto:${business.contact.email}`;
  if (confirmation)
    return (
      <main className="paper min-h-screen pt-40 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="eyebrow text-olive mb-6">Request received</p>
          <h1 ref={heading} tabIndex={-1} className="font-serif text-6xl mb-8">
            Thank <em>you.</em>
          </h1>
          <p className="leading-relaxed mb-6">
            Your reference is <strong>{confirmation.reference}</strong>. We will
            review availability and contact you personally. Your booking is not
            confirmed yet.
          </p>
          <div className="border border-primary/20 bg-card p-6 mb-8 text-left">
            <p>{confirmation.packageName}</p>
            <p className="font-serif text-3xl mt-2">
              {formatRwf(confirmation.totalAmountRwf)}
            </p>
            <p className="text-sm mt-3">
              {confirmation.quoteRequired
                ? "Add-ons and any tailored requirements will be priced in your final quote. "
                : ""}
              No payment is due now. Payment terms will be confirmed with your
              quote.
            </p>
          </div>
          <p className="text-sm mb-8">
            {values.email
              ? "A receipt will be emailed to you. If it does not arrive, check spam or contact us with your reference."
              : "Keep your reference for follow-up. We will contact you using your phone number."}
          </p>
          <a
            className="underline underline-offset-4"
            href={`${emailLink}?subject=${encodeURIComponent(`Booking ${confirmation.reference}`)}`}
          >
            Email Memento
          </a>
          <Link href="/" className="block mt-8 underline">
            Return home
          </Link>
        </div>
      </main>
    );

  return (
    <main className="paper min-h-screen pt-36 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="eyebrow text-olive mb-4">Make a request / Kigali time</p>
        <h1 className="font-serif text-5xl md:text-6xl mb-5">
          A date worth <em>keeping.</em>
        </h1>
        <p className="text-primary/75 mb-8">
          Requests are open for events from {business.booking.earliestEventDate}
          . For an earlier date,{" "}
          <a href={emailLink} className="underline">
            contact us directly
          </a>
          . We confirm each booking personally.
        </p>
        <div className="flex justify-between text-sm mb-3">
          <span>Step {step + 1} of 5</span>
          <span>{labels[step]}</span>
        </div>
        <div className="h-px bg-primary/20 mb-10">
          <div
            className="h-px bg-primary"
            style={{ width: `${(step + 1) * 20}%` }}
          />
        </div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-serif text-4xl mb-8 outline-none"
        >
          {labels[step]}
        </h2>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            step === 4 ? submit() : next();
          }}
          className="space-y-7"
        >
          {error && (
            <div
              role="alert"
              className="border-l-2 border-ink p-4 bg-rose-tint"
            >
              {error}
            </div>
          )}
          {step === 0 && (
            <>
              <Field label="Booking for">
                <select
                  className={selectClass}
                  value={values.customerType}
                  onChange={(e) =>
                    update(
                      "customerType",
                      e.target.value as Values["customerType"],
                    )
                  }
                >
                  <option value="individual">An individual</option>
                  <option value="organization">An organization</option>
                </select>
              </Field>
              {values.customerType === "organization" && (
                <Field label="Organization name">
                  <Input
                    maxLength={160}
                    value={values.organizationName}
                    onChange={(e) => update("organizationName", e.target.value)}
                  />
                </Field>
              )}
              <Field label="Your full name">
                <Input
                  autoComplete="name"
                  maxLength={120}
                  value={values.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  type="tel"
                  autoComplete="tel"
                  placeholder="0788 123 456 or +250788123456"
                  maxLength={30}
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
              <Field label="Email address (for your request receipt)">
                <Input
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Preferred contact method">
                <select
                  className={selectClass}
                  value={values.preferredContactMethod}
                  onChange={(e) =>
                    update(
                      "preferredContactMethod",
                      e.target.value as Values["preferredContactMethod"],
                    )
                  }
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone call</option>
                  {business.contact.whatsappNumber && (
                    <option value="whatsapp">WhatsApp</option>
                  )}
                </select>
              </Field>
            </>
          )}
          {step === 1 && (
            <>
              <Field label="Package">
                <select
                  className={selectClass}
                  value={values.packageId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setValues((v) => ({
                      ...v,
                      packageId: id,
                      eventType:
                        id === "other"
                          ? ""
                          : business.packages.find((p) => p.id === id)!.name,
                    }));
                  }}
                >
                  {business.packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatRwf(p.basePriceRwf)}
                      {p.basePriceRwf != null
                        ? ` / ${p.includedHours} hours`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Event type">
                <Input
                  maxLength={80}
                  placeholder="Birthday, wedding, graduation, corporate event…"
                  value={values.eventType}
                  onChange={(e) => update("eventType", e.target.value)}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Event date">
                  <Input
                    type="date"
                    min={[business.booking.earliestEventDate, kigaliToday()]
                      .sort()
                      .at(-1)}
                    value={values.eventDate}
                    onChange={(e) => update("eventDate", e.target.value)}
                  />
                </Field>
                <Field label="Start time (Kigali / CAT)">
                  <Input
                    type="time"
                    value={values.startTime}
                    onChange={(e) => update("startTime", e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Total hours">
                <Input
                  type="number"
                  min={2}
                  max={business.booking.maxHours}
                  step={1}
                  value={values.durationHours}
                  onChange={(e) =>
                    update("durationHours", Number(e.target.value))
                  }
                />
              </Field>
              <div
                aria-live="polite"
                className="border border-primary/20 p-5 bg-card"
              >
                <p className="eyebrow mb-3">Package estimate</p>
                <p className="font-serif text-3xl">
                  {formatRwf(estimate?.totalAmountRwf)}
                </p>
                {estimate?.basePriceRwf != null && (
                  <p className="text-sm mt-2">
                    {formatRwf(estimate.basePriceRwf)} includes{" "}
                    {estimate.includedHours} hours;{" "}
                    {formatRwf(estimate.hourlyRateRwf)} per extra hour.
                  </p>
                )}
                <p className="text-sm mt-3">
                  Unlimited prints and digital copies included. Add-ons are
                  quoted separately. Payment terms follow with your quote.
                </p>
              </div>
              {values.eventDate && (
                <div
                  aria-live="polite"
                  className="border-l-2 border-olive pl-4 text-sm"
                >
                  {availability.isFetching ? (
                    "Checking availability…"
                  ) : availability.isError ? (
                    <>
                      Availability could not be loaded.{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void availability.refetch()}
                      >
                        Retry check
                      </button>
                    </>
                  ) : unavailable ? (
                    "This time overlaps an unavailable period. Choose another time or date."
                  ) : (
                    "No confirmed conflict found for this time. Final availability is confirmed personally."
                  )}
                  {Boolean(availability.data?.length) && (
                    <ul className="mt-3 space-y-1">
                      {availability.data!.map((w, i) => (
                        <li key={i}>
                          Unavailable:{" "}
                          {w.startsAt
                            ? new Date(w.startsAt).toLocaleString("en-GB", {
                                timeZone: "Africa/Kigali",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : w.date}{" "}
                          –{" "}
                          {w.endsAt
                            ? new Date(w.endsAt).toLocaleString("en-GB", {
                                timeZone: "Africa/Kigali",
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "all day"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {settings.isError && (
                <p role="alert">
                  Booking information unavailable.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void settings.refetch()}
                  >
                    Retry
                  </button>
                </p>
              )}
              <Field label="Venue name">
                <Input
                  maxLength={160}
                  value={values.venue}
                  onChange={(e) => update("venue", e.target.value)}
                />
              </Field>
              <Field label="Neighborhood / location">
                <Input
                  maxLength={120}
                  value={values.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </Field>
              <Field label="Estimated guest count">
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  step={1}
                  value={values.guestCount}
                  onChange={(e) => update("guestCount", Number(e.target.value))}
                />
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <Field label="Print format">
                <select
                  className={selectClass}
                  value={values.printFormat}
                  onChange={(e) => update("printFormat", e.target.value)}
                >
                  <option value="discuss">Help me choose</option>
                  <option value="4x6">4×6 inch print</option>
                  <option value="2x6-strip">2×6 inch photo strip</option>
                </select>
              </Field>
              <Field label="Backdrop preference">
                <select
                  className={selectClass}
                  value={values.backdropPreference}
                  onChange={(e) => {
                    const value = e.target.value;
                    setValues((v) => ({
                      ...v,
                      backdropPreference: value,
                      addOns:
                        value === "custom"
                          ? Array.from(
                              new Set([...v.addOns, "custom-backdrop"]),
                            )
                          : v.addOns,
                    }));
                  }}
                >
                  <option value="from-selection">
                    Choose from the Memento selection
                  </option>
                  <option value="custom">
                    Custom backdrop (quoted add-on)
                  </option>
                  <option value="discuss">Discuss with Memento</option>
                </select>
              </Field>
              <fieldset className="space-y-4">
                <legend className="font-serif text-3xl mb-4">
                  Optional additions
                </legend>
                <p className="text-sm text-primary/75">
                  Select anything you would like us to include in your quote.
                  These prices are not included in the package estimate.
                </p>
                {business.addOns.map((a) => (
                  <label
                    key={a.id}
                    className="flex gap-4 border border-primary/20 p-5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-5 w-5 mt-1 accent-ink"
                      checked={values.addOns.includes(a.id)}
                      onChange={(e) => {
                        const selected = e.target.checked;
                        setValues((v) => ({
                          ...v,
                          addOns: selected
                            ? [...v.addOns, a.id]
                            : v.addOns.filter((id) => id !== a.id),
                          backdropPreference:
                            a.id === "custom-backdrop" &&
                            !selected &&
                            v.backdropPreference === "custom"
                              ? "from-selection"
                              : v.backdropPreference,
                        }));
                      }}
                    />
                    <span>
                      <span className="font-medium">{a.name}</span>
                      <span className="block text-sm text-primary/75 mt-1">
                        {a.description}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </>
          )}
          {step === 3 && (
            <>
              <div className="border border-primary/20 bg-card p-5">
                <p className="font-medium">
                  Your branded experience is included
                </p>
                <p className="text-sm text-primary/75 mt-1">
                  Every package includes a custom photo layout made for your
                  event, at no extra cost.
                </p>
              </div>
              <Field label="Branding or customization details (optional)">
                <Textarea
                  maxLength={2000}
                  value={values.brandedRequirements}
                  onChange={(e) =>
                    update("brandedRequirements", e.target.value)
                  }
                  placeholder="Names, dates, brand details or print-layout preferences…"
                />
              </Field>
              <Field label="Anything else (optional)">
                <Textarea
                  maxLength={2000}
                  value={values.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Venue access, schedule or special requests…"
                />
              </Field>
            </>
          )}
          {step === 4 && (
            <>
              <dl className="bg-card border border-primary/20 p-6 grid grid-cols-[minmax(100px,1fr)_2fr] gap-4 text-sm">
                {Object.entries({
                  Name: values.fullName,
                  Email: values.email || "Not supplied",
                  Phone: values.phone,
                  Contact: values.preferredContactMethod,
                  Organization: values.organizationName || "Individual",
                  Package: estimate?.packageName,
                  Event: values.eventType,
                  When: `${values.eventDate}, ${values.startTime} CAT, ${values.durationHours} hours`,
                  Where: `${values.venue}, ${values.location}`,
                  Guests: values.guestCount,
                  Prints:
                    values.printFormat === "discuss"
                      ? "Help me choose"
                      : values.printFormat,
                  Backdrop: values.backdropPreference.replaceAll("-", " "),
                  "Add-ons": values.addOns.map(addOnName).join(", ") || "None",
                  "Package estimate": formatRwf(estimate?.totalAmountRwf),
                  Notes:
                    [values.brandedRequirements, values.notes]
                      .filter(Boolean)
                      .join(" / ") || "None",
                }).map(([label, value]) => (
                  <div className="contents" key={label}>
                    <dt className="text-primary/70">{label}</dt>
                    <dd className="break-words min-w-0">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-sm">
                Add-ons are quoted separately. No payment is due when you
                submit. We will confirm availability and payment terms
                personally.
              </p>
              <label className="flex items-start gap-3 border border-primary/20 p-4">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-ink"
                  checked={values.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                />
                <span className="text-sm">
                  I understand this is a booking request and have read the{" "}
                  <Link href="/privacy" className="underline">
                    privacy notice
                  </Link>
                  .
                </span>
              </label>
            </>
          )}
          <div className="hidden" aria-hidden="true">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => update("website", e.target.value)}
              name="website"
            />
          </div>
          <div className="flex justify-between border-t border-primary/20 pt-6">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || create.isPending}
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
            >
              Back
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending
                ? "Sending…"
                : step === 4
                  ? "Submit request"
                  : "Continue"}
            </Button>
          </div>
          <p className="text-sm text-primary/70">
            Prefer to speak to us?{" "}
            <a href={emailLink} className="underline">
              {business.contact.email}
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
