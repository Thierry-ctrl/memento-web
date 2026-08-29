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
            "text-sm tracking-widest uppercase transition-colors hover:text-primary/70",
            location === link.href ? "text-primary font-medium" : "text-primary/80"
          )}
        >
          {link.label}
        </Link>
      ))}
      <Link href="/book" className="ml-4 hidden md:block">
        <Button variant="outline" className="rounded-none tracking-widest uppercase text-xs h-9 px-6 border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-500">
          Book Memento
        </Button>
      </Link>
    </>
  );

  return (
    <header 
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-in-out px-6 md:px-12 py-4 flex items-center justify-between",
        isScrolled ? "bg-background/90 backdrop-blur-md py-4 border-b border-primary/5" : "bg-transparent py-8"
      )}
    >
      <Link href="/" className="group z-50 flex flex-col">
        <span className="font-serif text-3xl md:text-4xl tracking-tight text-primary transition-opacity group-hover:opacity-80">Memento</span>
        <span className="font-sans text-[0.6rem] tracking-[0.2em] uppercase text-primary/60 mt-0.5">Kigali</span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <NavContent />
        {isSignedIn && (
          <div className="flex items-center gap-4 ml-4 border-l border-primary/10 pl-6">
            <Link href="/admin" className="text-sm tracking-widest uppercase text-primary/80 hover:text-primary">Admin</Link>
            <button onClick={() => signOut()} className="text-sm tracking-widest uppercase text-primary/80 hover:text-primary">Sign Out</button>
          </div>
        )}
      </nav>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden z-50 text-primary"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
      </button>

      {/* Mobile Nav */}
      <div className={cn(
        "fixed inset-0 bg-background z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-500 ease-in-out md:hidden",
        mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
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
          <Button variant="outline" className="rounded-none tracking-widest uppercase text-sm h-12 px-8 border-primary/20">
            Book Memento
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
