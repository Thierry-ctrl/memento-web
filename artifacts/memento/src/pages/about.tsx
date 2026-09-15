import heroImg from "@assets/generated_images/memento_kigali_hero.jpg";

export default function About() {
  return (
    <main className="w-full flex flex-col min-h-screen pt-32 pb-24 paper">
      <section className="px-6 md:px-12 max-w-4xl mx-auto w-full mb-32 text-center">
         <p className="eyebrow text-secondary mb-5">A small manifesto</p>
         <h1 className="font-serif text-6xl md:text-7xl text-primary mb-8">The <em>Story.</em></h1>
        <p className="text-2xl font-serif text-primary/80 italic leading-relaxed">
          "We take photos as a return ticket to a moment otherwise gone."
        </p>
      </section>

      <section className="px-6 md:px-12 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-32">
        <div className="aspect-[4/5] w-full bg-muted relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-cover bg-center opacity-90 filter grayscale-[0.2]" style={{ backgroundImage: `url(${heroImg})` }} />
        </div>
        <div className="flex flex-col gap-6 text-lg font-light text-primary/80 leading-relaxed">
          <p>
            Memento was born out of a profound appreciation for the physical photograph. In an increasingly digital world, we observed that some of the most beautiful gatherings in Kigali deserved a more permanent record.
          </p>
          <p>
            We believe your memories deserve the same level of care and intention as the rest of your celebration.
          </p>
          <p>
            Our focus is simple: beautiful portrait lighting, considered aesthetics, and the undeniable magic of a tactile print developing in your hands.
          </p>
        </div>
      </section>

      <section className="paper text-primary py-32 px-6 md:px-12 border-y border-primary/10">
         <div className="max-w-4xl mx-auto text-center">
           <p className="eyebrow text-olive mb-5">Why it matters</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-12">Why Physical Prints Matter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-olive mb-4">Permanence</h3>
              <p className="font-light text-primary/80 text-sm leading-relaxed">
                Phones break, clouds get full, and feeds move on. A print exists in the physical world. It demands to be kept, cherished, and revisited.
              </p>
            </div>
            <div>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-olive mb-4">Presence</h3>
              <p className="font-light text-primary/80 text-sm leading-relaxed">
                The act of waiting for a photo to print pulls people into the present. It creates a shared moment of anticipation and joy you can't get from a screen.
              </p>
            </div>
            <div>
              <h3 className="font-sans text-xs tracking-[0.2em] uppercase text-olive mb-4">Quality</h3>
              <p className="font-light text-primary/80 text-sm leading-relaxed">
                We use professional dye-sublimation printers—the industry standard for event photography. The photos emerge dry and ready to be handled, offering a lasting physical archive of your gathering.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-32 px-6 text-center max-w-2xl mx-auto">
        <p className="font-serif italic text-4xl text-secondary mb-6">Let's make something beautiful.</p>
        <p className="text-primary/80 font-light">
          Whether you're planning an intimate gathering or a grand celebration, we'd love to help you preserve it.
        </p>
      </section>
    </main>
  );
}
