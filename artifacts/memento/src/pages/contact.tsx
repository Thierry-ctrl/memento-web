import { Link } from "wouter";
import { business, whatsappUrl } from "@workspace/business";

export default function Contact() {
  return (
    <main className="w-full flex flex-col min-h-screen pt-40 pb-24 paper">
      <section className="px-6 md:px-12 max-w-5xl mx-auto w-full">
        <div className="text-center mb-24">
          <p className="eyebrow text-secondary mb-5">Start a conversation</p>
          <h1 className="font-serif text-6xl md:text-8xl text-primary mb-6">
            Contact <em>us.</em>
          </h1>
          <p className="text-xl font-light text-primary/80 max-w-xl mx-auto">
            We operate by appointment and availability. Reach out to discuss
            your event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          <div className="flex flex-col gap-12 bg-card p-10 md:p-16 border border-primary/10 print-lift">
            <div>
              <h2 className="eyebrow text-primary/70 mb-4">Direct lines</h2>
              <div className="space-y-6">
                {whatsappUrl() && (
                  <a
                    href={whatsappUrl()!}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col items-start"
                  >
                    <span className="font-serif text-3xl text-primary group-hover:text-secondary transition-colors">
                      WhatsApp
                    </span>
                    <span className="text-primary/70 font-light mt-1 text-sm">
                      Message our booking team
                    </span>
                  </a>
                )}

                <a
                  href={`tel:${business.contact.phone}`}
                  className="group flex flex-col items-start"
                >
                  <span className="font-serif text-3xl text-primary group-hover:text-secondary transition-colors">
                    Phone
                  </span>
                  <span className="text-primary/70 font-light mt-1 text-sm">
                    0788 628 735
                  </span>
                </a>

                {business.contact.email && (
                  <a
                    href={`mailto:${business.contact.email}`}
                    className="group flex flex-col items-start"
                  >
                    <span className="font-serif text-3xl text-primary group-hover:text-secondary transition-colors">
                      Email
                    </span>
                    <span className="text-primary/70 font-light mt-1 text-sm break-all">
                      {business.contact.email}
                    </span>
                  </a>
                )}
                <a
                  href={business.contact.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <span className="font-serif text-3xl">Instagram</span>
                  <span className="block text-sm mt-1">@memento_kigali</span>
                </a>
              </div>
            </div>

            <div>
              <h2 className="eyebrow text-primary/70 mb-4">Location</h2>
              <p className="font-serif text-2xl text-primary mb-2">
                Kigali, Rwanda
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h3 className="font-serif text-4xl text-primary mb-6">
              Ready to request a date?
            </h3>
            <p className="text-primary/80 font-light leading-relaxed mb-10">
              For event inquiries, please use our detailed booking form. It
              helps us gather all the necessary details about your venue, guest
              count, and desired setup to provide an accurate quote and confirm
              availability.
            </p>
            <Link href="/book">
              <span className="font-serif text-xl tracking-wide border-b border-primary pb-2 hover:text-secondary hover:border-secondary transition-colors inline-block text-primary">
                Start Booking Request
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
