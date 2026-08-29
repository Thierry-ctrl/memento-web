import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

// We use relative imports for assets generated
import heroImg from "@assets/generated_images/hero_placeholder.jpg";
import studioImg from "@assets/generated_images/studio_portrait.jpg";
import galleryImg1 from "@assets/generated_images/gallery_1.jpg";
import stripImg from "@assets/generated_images/photo_strip.jpg";

export default function Home() {
  useScrollReveal();

  return (
    <main className="w-full flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] w-full flex items-center overflow-hidden border-b border-primary/10">
        {/* Editorial Placeholder Image */}
        <div className="absolute inset-0 z-0 bg-muted flex items-center justify-center">
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply filter grayscale" style={{ backgroundImage: `url(${heroImg})` }} />
          <span className="placeholder-label left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">Editorial visual / placeholder</span>
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/45 to-background/20 z-0" />
          <div className="absolute inset-5 md:inset-10 border border-primary/20 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col items-start px-10 md:px-20 lg:px-28 max-w-4xl pt-20 fade-up">
          <p className="eyebrow text-primary/70 mb-8">
            A photo experience / Kigali, Rwanda
          </p>
          <h1 className="font-serif text-7xl md:text-9xl text-primary leading-[0.82] mb-8">
            Keep the<br /><em>moment.</em>
          </h1>
          <p className="font-serif italic text-3xl md:text-5xl text-secondary mb-8">Printed. Shared. Remembered.</p>
          <p className="text-base md:text-lg text-primary/70 max-w-md mb-12 font-light leading-relaxed">
            Photo experiences for gatherings that deserve more than a camera roll.
          </p>
          <Link href="/book">
            <Button variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs h-12 px-10 transition-all duration-700">
              Request a date <span aria-hidden="true" className="ml-4">↗</span>
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-12 right-12 hidden md:block annotation text-3xl rotate-[-8deg]">made to keep</div>
      </section>

      {/* The Tactile Difference */}
      <section className="py-32 px-6 md:px-12 bg-background relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative fade-up">
            <div className="aspect-[3/4] w-full max-w-md mx-auto bg-muted overflow-hidden crop-reveal relative flex items-center justify-center">
              <span className="placeholder-label">Portrait visual / placeholder</span>
              <div className="absolute inset-0 bg-cover bg-center opacity-80 filter sepia-[0.3]" style={{ backgroundImage: `url(${studioImg})` }} />
            </div>
            {/* Annotation */}
            <div className="absolute -bottom-8 -right-4 md:-right-12 annotation text-3xl rotate-[-6deg] bg-background/80 backdrop-blur-sm px-4 py-2 z-20">
              for the archive.
            </div>
          </div>
          
          <div className="order-1 lg:order-2 flex flex-col items-start fade-up">
            <h2 className="font-serif text-5xl md:text-6xl text-primary mb-8 leading-tight">
              More than a photo.<br/>
              <span className="text-primary/60">An artifact.</span>
            </h2>
            <div className="space-y-6 text-primary/80 font-light leading-relaxed text-lg max-w-xl">
              <p>
                In a world overflowing with digital noise, a physical print holds weight. It's not swiped past or lost in the cloud; it's tucked into a wallet, pinned to a mirror, framed on a mantle.
              </p>
              <p>
                Memento brings an editorial eye and timeless restraint to event photography. We discard the props and chaos for beautiful lighting, elegant backdrops, and portraiture that endures.
              </p>
            </div>
            <Link href="/experiences" className="mt-12 group">
              <span className="font-serif text-xl tracking-wide border-b border-primary/30 group-hover:border-primary pb-1 transition-colors">Explore our experiences</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Triple Image Strip */}
      <section className="py-24 bg-card w-full overflow-hidden flex flex-col items-center">
        <p className="font-sans text-xs tracking-[0.2em] uppercase text-primary/50 mb-16 fade-up">A Glimpse of the Archive</p>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full max-w-[1400px] px-4 md:px-12 justify-center items-center">
          <div className="aspect-[4/5] w-full max-w-[400px] bg-muted relative crop-reveal group overflow-hidden flex items-center justify-center">
              <span className="placeholder-label">Event visual / placeholder</span>
             <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 filter grayscale-[0.2] contrast-[0.9]" style={{ backgroundImage: `url(${galleryImg1})` }} />
          </div>
          <div className="aspect-[4/5] w-full max-w-[400px] bg-muted relative crop-reveal md:-translate-y-12 group overflow-hidden flex items-center justify-center">
              <span className="placeholder-label">Strip visual / placeholder</span>
             <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 filter sepia-[0.2]" style={{ backgroundImage: `url(${stripImg})` }} />
          </div>
          <div className="aspect-[4/5] w-full max-w-[400px] bg-muted relative crop-reveal group overflow-hidden flex items-center justify-center">
              <span className="placeholder-label">Portrait visual / placeholder</span>
             <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 filter grayscale-[0.5]" style={{ backgroundImage: `url(${studioImg})` }} />
          </div>
        </div>
        <div className="mt-24 fade-up">
            <Link href="/gallery" className="group">
              <span className="font-serif text-xl tracking-wide border-b border-primary/30 group-hover:border-primary pb-1 transition-colors">View the full gallery</span>
            </Link>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="py-40 px-6 text-center relative overflow-hidden bg-primary text-primary-foreground">
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center fade-up">
          <p className="eyebrow text-secondary mb-6">For the days worth keeping</p>
          <h2 className="font-serif text-5xl md:text-7xl mb-8 leading-tight">
            Give it a place<br /><em>in the archive.</em>
          </h2>
          <p className="font-light text-primary-foreground/70 text-lg mb-12 max-w-lg">
            Our calendar fills quietly but quickly. Connect with us to curate a bespoke print experience for your upcoming gathering.
          </p>
          <Link href="/book">
            <Button variant="outline" className="rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary tracking-widest uppercase text-xs h-14 px-12 transition-all duration-700 bg-transparent">
              Inquire Now
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
