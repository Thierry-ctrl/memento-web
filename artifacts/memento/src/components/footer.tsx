import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="paper text-primary border-t border-primary/15 pt-20 pb-10 px-6 md:px-12 mt-auto relative overflow-hidden">
      <div className="absolute right-6 top-8 hidden md:block annotation text-olive text-2xl rotate-[-4deg]" aria-hidden="true">
        Kigali — est. 2026
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-24">
        <div className="md:col-span-2">
          <Link href="/" className="inline-block group mb-6">
            <span className="font-serif text-5xl md:text-7xl tracking-tight block">Memento</span>
            <span className="eyebrow text-primary/75">Kigali / Photo experiences</span>
          </Link>
          <p className="max-w-md text-primary/70 font-light text-sm leading-relaxed mb-8">
             A considered photo experience for gatherings in Kigali. Printed, shared, and made to keep.
          </p>
          <div className="flex flex-col gap-2">
            <a href="https://wa.me/250788628735" target="_blank" rel="noreferrer" className="text-sm tracking-wider hover:text-olive transition-colors inline-flex items-center gap-2">
              WhatsApp
            </a>
            <a href="tel:0788628735" className="text-sm tracking-wider hover:text-olive transition-colors inline-flex items-center gap-2">
              0788 628 735
            </a>
            {import.meta.env.VITE_PUBLIC_CONTACT_EMAIL && (
              <a href={`mailto:${import.meta.env.VITE_PUBLIC_CONTACT_EMAIL}`} className="text-sm tracking-wider hover:text-olive transition-colors inline-flex items-center gap-2">
                {import.meta.env.VITE_PUBLIC_CONTACT_EMAIL}
              </a>
            )}
          </div>
        </div>
        
        <div>
           <h4 className="eyebrow mb-6 text-olive">Explore</h4>
          <ul className="flex flex-col gap-4 text-sm tracking-wide">
            <li><Link href="/experiences" className="text-primary/70 hover:text-primary transition-colors">Experiences</Link></li>
            <li><Link href="/gallery" className="text-primary/70 hover:text-primary transition-colors">Gallery</Link></li>
            <li><Link href="/about" className="text-primary/70 hover:text-primary transition-colors">The Story</Link></li>
            <li><Link href="/book" className="text-primary/70 hover:text-primary transition-colors">Book Now</Link></li>
          </ul>
        </div>
        
        <div>
           <h4 className="eyebrow mb-6 text-olive">Details</h4>
          <ul className="flex flex-col gap-4 text-sm tracking-wide">
            <li><Link href="/privacy" className="text-primary/70 hover:text-primary transition-colors">Privacy Notice</Link></li>
            <li><Link href="/contact" className="text-primary/70 hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-primary/15 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
         <p className="eyebrow text-primary/70">
          &copy; {new Date().getFullYear()} Memento Kigali. All rights reserved.
        </p>
         <div className="annotation text-olive text-xl rotate-[-2deg]">
          Moment No. 001 — 09.26
        </div>
      </div>
    </footer>
  );
}
