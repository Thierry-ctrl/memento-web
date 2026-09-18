import birthday from "@assets/quiet_archive/birthday-candid.jpg";
import wedding from "@assets/quiet_archive/wedding-keepsake.jpg";
import gathering from "@assets/quiet_archive/hero-gathering.jpg";
import booth from "@assets/quiet_archive/booth-experience.jpg";
import prints from "@assets/quiet_archive/prints-in-hand.jpg";
import book from "@assets/quiet_archive/memory-book.jpg";
import graduation from "@assets/quiet_archive/graduation.jpg";
import corporate from "@assets/quiet_archive/corporate-gathering.jpg";
import archive from "@assets/quiet_archive/archive-still-life.jpg";

const images = [
  [birthday, "A birthday, kept"],
  [prints, "Beyond the camera roll"],
  [wedding, "For the days that stay"],
  [gathering, "Perfectly unplanned"],
  [book, "A place for every memory"],
  [graduation, "The next chapter"],
  [booth, "Inside the experience"],
  [corporate, "Together, off the clock"],
  [archive, "Something worth keeping"],
];
export default function Gallery() {
  return (
    <main className="min-h-screen pt-32 pb-24 paper">
      <header className="px-6 max-w-3xl mx-auto mb-16 text-center">
        <p className="eyebrow text-olive mb-5">The feeling, imagined</p>
        <h1 className="font-serif text-5xl md:text-7xl mb-6">
          The <em>Archive.</em>
        </h1>
        <p className="leading-relaxed text-primary/80">
          A glimpse of the memories we want to help you keep. These AI-created
          illustrations express Memento’s visual direction; they are not a
          portfolio of past events.
        </p>
      </header>
      <section
        aria-label="Illustrative gallery"
        className="px-6 md:px-12 max-w-7xl mx-auto columns-1 sm:columns-2 lg:columns-3 gap-8"
      >
        {images.map(([src, label]) => (
          <figure key={src} className="break-inside-avoid mb-10">
            <img
              src={src}
              alt={`${label} — AI-created illustration`}
              loading="lazy"
              className="w-full h-auto"
            />
            <figcaption className="annotation text-2xl mt-3">
              {label}
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}
