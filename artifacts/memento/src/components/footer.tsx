import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-24 pb-12 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-24">
        <div className="md:col-span-2">
          <Link href="/" className="inline-block group mb-6">
            <span className="font-serif text-5xl md:text-7xl tracking-tight block">Memento</span>
            <span className="font-sans text-xs tracking-[0.3em] uppercase text-primary-foreground/60">Kigali</span>
          </Link>
          <p className="max-w-md text-primary-foreground/70 font-light text-sm leading-relaxed mb-8">
            Turning fleeting moments into physical memories you can hold, share, and keep. A premium photo experience curated for Kigali's most unforgettable gatherings.
          </p>
          <div className="flex flex-col gap-2">
            <a href="https://wa.me/250788628735" target="_blank" rel="noreferrer" className="text-sm tracking-wider hover:text-secondary transition-colors inline-flex items-center gap-2">
              WhatsApp
            </a>
            <a href="tel:0788628735" className="text-sm tracking-wider hover:text-secondary transition-colors inline-flex items-center gap-2">
              0788 628 735
            </a>
            {import.meta.env.VITE_PUBLIC_CONTACT_EMAIL && (
              <a href={`mailto:${import.meta.env.VITE_PUBLIC_CONTACT_EMAIL}`} className="text-sm tracking-wider hover:text-secondary transition-colors inline-flex items-center gap-2">
                {import.meta.env.VITE_PUBLIC_CONTACT_EMAIL}
              </a>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-serif text-2xl mb-6 text-secondary">Explore</h4>
          <ul className="flex flex-col gap-4 text-sm tracking-wide">
            <li><Link href="/experiences" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Experiences</Link></li>
            <li><Link href="/gallery" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Gallery</Link></li>
            <li><Link href="/about" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">The Story</Link></li>
            <li><Link href="/book" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Book Now</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-serif text-2xl mb-6 text-secondary">Legal</h4>
          <ul className="flex flex-col gap-4 text-sm tracking-wide">
            <li><Link href="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Privacy Notice</Link></li>
            <li><Link href="/contact" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs tracking-widest text-primary-foreground/40 uppercase">
          &copy; {new Date().getFullYear()} Memento Kigali. All rights reserved.
        </p>
        <div className="font-hand text-xl text-primary-foreground/30 rotate-[-2deg]">
          hold onto the moment
        </div>
      </div>
    </footer>
  );
}
