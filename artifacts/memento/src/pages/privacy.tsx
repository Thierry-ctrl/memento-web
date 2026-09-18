import { business } from "@workspace/business";

export default function Privacy() {
  return (
    <main className="w-full flex flex-col min-h-screen pt-40 pb-24 paper">
      <section className="px-6 md:px-12 max-w-3xl mx-auto w-full">
        <p className="eyebrow text-secondary mb-5">The fine print</p>
        <h1 className="font-serif text-5xl text-primary mb-12">
          Privacy <em>Notice.</em>
        </h1>

        <div className="space-y-8 font-light text-primary/80 leading-relaxed">
          <p>
            At Memento Kigali, we respect your privacy and the intimate nature
            of the events we document. This brief notice explains how we handle
            your information and images.
          </p>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">
              Image Rights & Usage
            </h2>
            <p>
              Event photographs are delivered through the arrangements agreed
              with the host. Permission to provide the event service is separate
              from permission to use photographs in our marketing. We seek
              appropriate, separate permission before publishing identifiable
              guest images. The illustrative AI images on this website are not
              photographs of past Memento clients or events.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">
              Booking Information
            </h2>
            <p>
              When you inquire or book with us, we collect your name, contact
              details, and event information to respond to your request, provide
              our service, and maintain booking records. We do not sell your
              information. Trusted service providers process information as
              needed to operate the website, host booking records, authenticate
              administrators and deliver email. These include our hosting
              provider, Clerk for administrator sign-in, and our email provider.
              Access is limited to the purposes of providing these services.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">
              Digital Archives
            </h2>
            <p>
              Gallery delivery and the download period will be agreed with you
              when your booking is confirmed. We recommend downloading your
              photographs when they are delivered. This website does not promise
              a fixed gallery retention period.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">Contact</h2>
            <p>
              For questions, corrections or requests concerning your booking
              information or images, email {business.contact.email} or call{" "}
              {business.contact.phoneLabel}.
            </p>
          </div>
        </div>
        <p className="mt-8 text-sm text-primary/75">
          While completing the form, a temporary draft is stored in your browser
          session to avoid losing your progress. It expires after 24 hours, is
          cleared after a successful request, and is not submitted until you
          choose Submit request.
        </p>
      </section>
    </main>
  );
}
