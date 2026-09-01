import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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

  const mobileMenu = mobileMenuOpen
    ? createPortal(
        <div
          className="fixed inset-0 z-40 overflow-y-auto px-6 md:hidden"
          style={{ backgroundColor: "hsl(38 31% 93%)" }}
        >
          <nav className="flex min-h-full flex-col items-center justify-center gap-7 pb-12 pt-28" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "font-serif text-4xl py-2",
                  location === link.href ? "text-primary" : "text-primary/70"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/book" className="mt-5">
              <Button variant="outline" className="rounded-none tracking-widest uppercase text-sm h-14 px-10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
                Request a date
              </Button>
            </Link>
            {isSignedIn && (
              <div className="flex flex-col items-center gap-4 mt-5 pt-6 border-t border-primary/10 w-48">
                <Link href="/admin" className="font-serif text-3xl text-primary/70 py-2">Admin</Link>
                <button onClick={() => signOut()} className="font-serif text-3xl text-primary/70 py-2">Sign Out</button>
              </div>
            )}
          </nav>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
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
        className="md:hidden z-50 text-primary p-2 -mr-2"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
         aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
         aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={32} strokeWidth={1} /> : <Menu size={32} strokeWidth={1} />}
      </button>

      {/* Mobile Nav */}
    </header>
    {mobileMenu}
    </>
  );
}
