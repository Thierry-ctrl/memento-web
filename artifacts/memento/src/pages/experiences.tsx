import { Link } from "wouter";
import { business, formatRwf } from "@workspace/business";
import birthday from "@assets/quiet_archive/birthday-candid.jpg";
import wedding from "@assets/quiet_archive/wedding-keepsake.jpg";
import corporate from "@assets/quiet_archive/corporate-gathering.jpg";
import booth from "@assets/quiet_archive/booth-experience.jpg";

export default function Experiences() {
  return (
    <main className="min-h-screen pt-32 pb-24 paper">
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-20">
        <p className="eyebrow text-olive mb-5">The offering</p>
        <h1 className="font-serif text-6xl md:text-8xl mb-8">
          Make it <em>physical.</em>
        </h1>
        <p className="text-xl font-light max-w-2xl leading-relaxed">
          For birthdays, weddings, graduations, corporate events and everything
          worth remembering. Choose your occasion; we’ll help shape the details.
        </p>
      </section>
      <section
        aria-label="Packages"
        className="px-6 md:px-12 max-w-7xl mx-auto grid md:grid-cols-3 gap-8"
      >
        {business.packages.map((pkg, i) => (
          <article
            key={pkg.id}
            className="border border-primary/15 bg-card flex flex-col"
          >
            <img
              src={[birthday, wedding, corporate][i]}
              alt={
                [
                  "Friends celebrating a birthday — AI illustration",
                  "A couple sharing a wedding keepsake — AI illustration",
                  "Colleagues sharing a print — AI illustration",
                ][i]
              }
              className="w-full aspect-[4/5] object-cover"
              loading="lazy"
            />
            <div className="p-6 flex flex-col flex-1">
              <h2 className="font-serif text-3xl mb-4">{pkg.name}</h2>
              <p className="text-xl mb-2">{formatRwf(pkg.basePriceRwf)}</p>
              <p className="text-sm mb-6">
                {pkg.basePriceRwf === null
                  ? "A tailored quote for your event."
                  : `${pkg.includedHours} hours included · ${formatRwf(pkg.extraHourRwf)} per additional hour`}
              </p>
              <Link
                href={`/book?package=${pkg.id}`}
                className="mt-auto border border-primary px-5 py-3 text-center text-sm hover:bg-primary hover:text-background transition-colors"
              >
                Request this experience ↗
              </Link>
            </div>
          </article>
        ))}
      </section>
      <section className="px-6 md:px-12 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 mt-24 items-center">
        <img
          src={booth}
          alt="Friends posing at an open-air booth — illustrative AI concept, equipment may vary"
          className="w-full aspect-[3/2] object-cover"
          loading="lazy"
        />
        <div>
          <p className="eyebrow text-olive mb-4">Every package</p>
          <h2 className="font-serif text-4xl mb-6">The details, considered.</h2>
          <ul className="space-y-3">
            {business.inclusions.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
          <p className="text-sm text-primary/80 mt-6">
            Layouts are adapted to your event. Online album access and delivery
            details will be agreed with your booking.
          </p>
        </div>
      </section>
      <section className="mt-24 px-6 md:px-12 py-16 bg-card border-y border-primary/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-4xl mb-3">
            A little more, if you wish.
          </h2>
          <p className="mb-10">
            Choose these in the booking form. Add-ons are optional and quoted
            separately.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            {business.addOns.map((item) => (
              <div key={item.id}>
                <h3 className="font-serif text-2xl mb-3">{item.name}</h3>
                <p className="text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <p className="max-w-7xl mx-auto px-6 md:px-12 mt-8 text-xs text-primary/70">
        Images are AI-created illustrations of our visual direction, not past
        client events or exact equipment specifications. Requests are subject to
        availability; no payment is collected on this website.
      </p>
    </main>
  );
}
