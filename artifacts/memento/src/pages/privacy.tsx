export default function Privacy() {
  return (
    <main className="w-full flex flex-col min-h-screen pt-40 pb-24 bg-background">
      <section className="px-6 md:px-12 max-w-3xl mx-auto w-full">
        <h1 className="font-serif text-5xl text-primary mb-12">Privacy Notice</h1>
        
        <div className="space-y-8 font-light text-primary/80 leading-relaxed">
          <p>
            At Memento Kigali, we respect your privacy and the intimate nature of the events we document. This brief notice explains how we handle your information and images.
          </p>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">Image Rights & Usage</h2>
            <p>
              We act as a service provider to the event host. All photographs captured during an event are provided to the host via a digital gallery. We do not use client or guest photos for our marketing, social media, or portfolio without explicit, separate consent from the individuals pictured or the event host.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">Booking Information</h2>
            <p>
              When you inquire or book with us, we collect your name, contact details, and event information. This data is used solely to provide our service, communicate regarding your booking, and maintain administrative records. We do not sell or share your contact information with third parties.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">Digital Archives</h2>
            <p>
              Digital galleries are hosted securely and kept online for a minimum of 90 days after delivery. Following this period, galleries may be archived or deleted. We recommend hosts download all files upon receipt.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-2xl text-primary mb-3">Contact</h2>
            <p>
              If you have any questions about how we handle your data or images, please contact us at 0788 628 735 or via WhatsApp.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
