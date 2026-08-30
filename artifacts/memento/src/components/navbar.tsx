import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAuth, useClerk } from "@clerk/react";
import { Button } from "./ui/button";

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { label: "Experiences", href: "/experiences" },
    { label: "Gallery", href: "/gallery" },
    { label: "The Story", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const NavContent = () => (
    <>
      {navLinks.map((link) => (
        <Link 
          key={link.href} 
          href={link.href}
          className={cn(
            "eyebrow transition-colors hover:text-secondary",
            location === link.href ? "text-primary font-bold" : "text-primary/65"
          )}
          aria-current={location === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
      <Link href="/book" className="ml-4 hidden md:block">
        <Button variant="outline" className="rounded-none tracking-widest uppercase text-[10px] h-10 px-5 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all duration-500">
          Request a date
        </Button>
      </Link>
    </>
  );

  return (
    <header 
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-in-out px-5 md:px-12 py-4 flex items-center justify-between",
        isScrolled ? "bg-background/92 backdrop-blur-md py-4 border-b border-primary/10" : "bg-background/70 backdrop-blur-[2px] py-6 md:py-8"
      )}
    >
      <Link href="/" className="group z-50 flex items-start gap-2" aria-label="Memento Kigali home">
        <span className="mt-1 block h-2 w-2 rounded-full bg-secondary" aria-hidden="true" />
        <span className="flex flex-col">
          <span className="font-serif text-3xl md:text-4xl tracking-tight text-primary leading-none transition-opacity group-hover:opacity-80">Memento</span>
          <span className="eyebrow text-primary/55 mt-1">Kigali / Photo experiences</span>
        </span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <NavContent />
        {isSignedIn && (
          <div className="flex items-center gap-4 ml-4 border-l border-primary/10 pl-6">
            <Link href="/admin" className="eyebrow text-primary/65 hover:text-primary">Admin</Link>
            <button onClick={() => signOut()} className="eyebrow text-primary/65 hover:text-primary">Sign out</button>
          </div>
        )}
      </nav>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden z-50 text-primary"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
         aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
         aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
      </button>

      {/* Mobile Nav */}
      <div className={cn(
        "fixed inset-0 bg-background z-40 flex flex-col items-center justify-center gap-8 transition-all duration-500 ease-in-out md:hidden",
        mobileMenuOpen ? "visible translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-4 opacity-0"
      )}>
        {navLinks.map((link) => (
          <Link 
            key={link.href} 
            href={link.href}
            className={cn(
              "font-serif text-4xl",
              location === link.href ? "text-primary" : "text-primary/70"
            )}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/book" className="mt-4">
            <Button variant="outline" className="rounded-none tracking-widest uppercase text-xs h-12 px-8 border-primary/30">
             Request a date
          </Button>
        </Link>
        {isSignedIn && (
          <div className="flex flex-col items-center gap-6 mt-8 pt-8 border-t border-primary/10 w-32">
            <Link href="/admin" className="font-serif text-2xl text-primary/70">Admin</Link>
            <button onClick={() => signOut()} className="font-serif text-2xl text-primary/70">Sign Out</button>
          </div>
        )}
      </div>
    </header>
  );
}
