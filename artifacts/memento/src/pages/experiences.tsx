import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

// Assets
import studioImg from "@assets/generated_images/studio_portrait.jpg";
import stripImg from "@assets/generated_images/photo_strip.jpg";

export default function Experiences() {
  useScrollReveal();

  const experiences = [
    {
      title: "The Memento Experience",
      description: "A tailored photo experience for your gathering. The layout, print format and backdrop can adapt to the event—there is no single fixed photo-strip design.",
      features: [
        "Custom photo layout",
        "Unlimited instant prints",
        "Choice of preferred print format",
        "Online album",
        "iPad sharing station",
        "Choice of backdrop from the Memento selection",
        "Professional on-site attendant"
      ],
      ideal: "Birthdays, Weddings, Graduations",
      image: studioImg,
      label: "Memento Experience Placeholder"
    },
    {
      title: "For Brands & Gatherings",
      description: "A considered experience for corporate events and brand activations, with adaptable layouts and optional branded requirements handled as part of the request.",
      features: [
        "Custom photo layout",
        "Flexible print formats",
        "Online album and sharing station",
        "Backdrop from the Memento selection",
        "Professional on-site attendant",
        "Optional branded experience requirements"
      ],
      ideal: "Corporate events, Brand activations, Everything worth remembering",
      image: stripImg,
      label: "Photo Strip Placeholder"
    }
  ];

  return (
    <main className="w-full flex flex-col min-h-screen pt-32 pb-24 paper">
      {/* Header */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-24 fade-up">
        <p className="eyebrow text-secondary mb-5">The offering / 01—02</p>
        <h1 className="font-serif text-6xl md:text-8xl text-primary mb-8">Make it <em>physical.</em></h1>
        <p className="text-xl font-light text-primary/70 max-w-2xl leading-relaxed">
          Every event requires a distinct touch. We offer two core setups, each designed to capture the atmosphere with restraint and elegance.
        </p>
      </section>

      {/* Experience Blocks */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto w-full flex flex-col gap-32">
        {experiences.map((exp, idx) => (
          <div key={idx} className={`grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${idx % 2 === 1 ? 'lg:rtl' : ''}`}>
            
            <div className={`aspect-[4/5] w-full bg-muted crop-reveal relative overflow-hidden flex items-center justify-center ${idx % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
              <span className="placeholder-label">{exp.label.replace(" Placeholder", " / placeholder")}</span>
              <div 
                className="absolute inset-0 bg-cover bg-center filter grayscale-[0.4]"
                style={{ backgroundImage: `url(${exp.image})` }}
              />
            </div>
            
            <div className={`flex flex-col items-start fade-up ${idx % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
              <h2 className="font-serif text-4xl md:text-5xl text-primary mb-6">{exp.title}</h2>
              <p className="text-primary/70 text-lg font-light leading-relaxed mb-10">
                {exp.description}
              </p>
              
              <div className="w-full border-t border-primary/10 pt-8 mb-8">
                <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-primary/60 mb-6">Included</h3>
                <ul className="space-y-3">
                  {exp.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start text-primary/80">
                      <span className="mr-3 text-secondary">—</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card px-6 py-4 border border-primary/5 w-full mb-10">
                <span className="font-sans text-[10px] tracking-[0.2em] uppercase text-primary/50 block mb-1">Ideal For</span>
                <span className="font-serif text-xl text-primary/90">{exp.ideal}</span>
              </div>

              <Link href="/book">
                <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs h-12 px-8">
                  Inquire
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Add-ons */}
      <section className="mt-32 px-6 md:px-12 py-24 bg-card w-full fade-up">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="md:col-span-1">
            <h2 className="font-serif text-4xl text-primary mb-6">Additions</h2>
            <p className="text-primary/70 font-light">Enhance your experience with tactile upgrades and custom touches designed specifically for your event.</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-12">
            <div>
              <h4 className="font-serif text-2xl text-primary mb-3">Guestbook Archive</h4>
              <p className="text-primary/70 text-sm leading-relaxed font-light">A linen-bound album managed by our attendant. Guests paste a copy of their print and write a note, creating an instant heirloom.</p>
            </div>
            <div>
              <h4 className="font-serif text-2xl text-primary mb-3">Custom Backdrops</h4>
              <p className="text-primary/70 text-sm leading-relaxed font-light">Beyond our signature seamless papers, we can source or build bespoke floral, fabric, or architectural sets to match your aesthetic.</p>
            </div>
            <div>
              <h4 className="font-serif text-2xl text-primary mb-3">Extended Hours</h4>
              <p className="text-primary/70 text-sm leading-relaxed font-light">Keep the studio running into the early hours. Additional time can be booked in advance or requested seamlessly on the night.</p>
            </div>
            <div>
              <h4 className="font-serif text-2xl text-primary mb-3">Bespoke Folios</h4>
              <p className="text-primary/70 text-sm leading-relaxed font-light">Custom stamped presentation folios for guests to safely carry their 4x6 prints home in style.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
