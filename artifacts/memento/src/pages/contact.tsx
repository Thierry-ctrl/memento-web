import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Link } from "wouter";

export default function Contact() {
  useScrollReveal();

  return (
    <main className="w-full flex flex-col min-h-screen pt-40 pb-24 paper">
      <section className="px-6 md:px-12 max-w-5xl mx-auto w-full fade-up">
        <div className="text-center mb-24">
           <p className="eyebrow text-secondary mb-5">Start a conversation</p>
           <h1 className="font-serif text-6xl md:text-8xl text-primary mb-6">Contact <em>us.</em></h1>
          <p className="text-xl font-light text-primary/60 max-w-xl mx-auto">
            We operate by appointment and availability. Reach out to discuss your event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
           <div className="flex flex-col gap-12 bg-card p-10 md:p-16 border border-primary/10 print-lift">
            <div>
               <h2 className="eyebrow text-primary/50 mb-4">Direct lines</h2>
              <div className="space-y-6">
                <a 
                  href="https://wa.me/250788628735" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group flex flex-col items-start"
                >
                  <span className="font-serif text-3xl text-primary group-hover:text-secondary transition-colors">WhatsApp</span>
                  <span className="text-primary/60 font-light mt-1 text-sm">+250 788 628 735</span>
                </a>
                
                <a 
                  href="tel:0788628735" 
                  className="group flex flex-col items-start"
                >
                  <span className="font-serif text-3xl text-primary group-hover:text-secondary transition-colors">Phone</span>
                  <span className="text-primary/60 font-light mt-1 text-sm">0788 628 735</span>
                </a>

                {import.meta.env.VITE_PUBLIC_CONTACT_EMAIL && (
                  <a 
                    href={`mailto:${import.meta.env.VITE_PUBLIC_CONTACT_EMAIL}`}
                    className="group flex flex-col items-start"
                  >
                    <span className="font-serif text-3xl text-primary group-hover:text-secondary transition-colors">Email</span>
                    <span className="text-primary/60 font-light mt-1 text-sm">{import.meta.env.VITE_PUBLIC_CONTACT_EMAIL}</span>
                  </a>
                )}
              </div>
            </div>
            
            <div>
               <h2 className="eyebrow text-primary/50 mb-4">Location</h2>
              <p className="font-serif text-2xl text-primary mb-2">Kigali, Rwanda</p>
              <p className="text-primary/60 font-light text-sm">Available for travel nationwide upon request.</p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h3 className="font-serif text-4xl text-primary mb-6">Ready to reserve?</h3>
            <p className="text-primary/70 font-light leading-relaxed mb-10">
              For event inquiries, please use our detailed booking form. It helps us gather all the necessary details about your venue, guest count, and desired setup to provide an accurate quote and confirm availability.
            </p>
            <Link href="/book">
              <span className="font-serif text-xl tracking-wide border-b border-primary pb-2 hover:text-secondary hover:border-secondary transition-colors inline-block">
                Start Booking Request
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
