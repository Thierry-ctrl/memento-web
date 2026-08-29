import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import heroImg from "@assets/generated_images/hero_placeholder.jpg";

export default function About() {
  useScrollReveal();

  return (
    <main className="w-full flex flex-col min-h-screen pt-32 pb-24 paper">
      <section className="px-6 md:px-12 max-w-4xl mx-auto w-full mb-32 fade-up text-center">
         <p className="eyebrow text-secondary mb-5">A small manifesto</p>
         <h1 className="font-serif text-6xl md:text-7xl text-primary mb-8">The <em>Story.</em></h1>
        <p className="text-2xl font-serif text-primary/80 italic leading-relaxed">
          "We take photos as a return ticket to a moment otherwise gone."
        </p>
      </section>

      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-32">
        <div className="aspect-[4/5] w-full bg-muted crop-reveal relative overflow-hidden flex items-center justify-center">
           <span className="placeholder-label">Event ambience / placeholder</span>
          <div className="absolute inset-0 bg-cover bg-center opacity-90 filter grayscale-[0.2]" style={{ backgroundImage: `url(${heroImg})` }} />
        </div>
        <div className="flex flex-col gap-6 text-lg font-light text-primary/80 leading-relaxed fade-up">
          <p>
            Memento was born out of a desire for something better than the standard photo booth. We noticed a pattern at beautiful events in Kigali: stunning decor, incredible fashion, and a photo experience that relied on cheap props, harsh ring lights, and cluttered digital layouts.
          </p>
          <p>
            We believed your memories deserved the same level of care as the rest of your celebration.
          </p>
          <p>
            We stripped away the noise and focused on what matters: beautiful portrait lighting, clean aesthetics, and the undeniable magic of a physical print developing in your hands.
          </p>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-32 px-6 md:px-12">
         <div className="max-w-4xl mx-auto text-center fade-up">
           <p className="eyebrow text-secondary mb-5">Why it matters</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-12">Why Physical Prints Matter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-secondary mb-4">Permanence</h3>
              <p className="font-light text-primary-foreground/70 text-sm leading-relaxed">
                Phones break, clouds get full, and feeds move on. A print exists in the physical world. It demands to be kept, cherished, and revisited.
              </p>
            </div>
            <div>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-secondary mb-4">Presence</h3>
              <p className="font-light text-primary-foreground/70 text-sm leading-relaxed">
                The act of waiting for a photo to print pulls people into the present. It creates a shared moment of anticipation and joy you can't get from a screen.
              </p>
            </div>
            <div>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-secondary mb-4">Quality</h3>
              <p className="font-light text-primary-foreground/70 text-sm leading-relaxed">
                We use dye-sublimation printers—the industry standard for archival quality. The photos emerge dry, waterproof, and guaranteed not to fade for decades.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-32 px-6 text-center max-w-2xl mx-auto fade-up">
        <p className="font-hand text-4xl text-secondary mb-6 rotate-[-2deg]">let's make something beautiful</p>
        <p className="text-primary/70 font-light">
          Whether you're planning an intimate gathering or a grand celebration, we'd love to help you preserve it.
        </p>
      </section>
    </main>
  );
}
