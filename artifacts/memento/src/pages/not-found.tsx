export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <h1 className="font-serif text-8xl text-primary mb-4">404</h1>
      <p className="text-primary/70 font-light mb-8">This page could not be found.</p>
      <a href="/" className="font-sans uppercase tracking-widest text-xs border border-primary px-8 py-3 hover:bg-primary hover:text-primary-foreground transition-colors">
        Return Home
      </a>
    </div>
  );
}
