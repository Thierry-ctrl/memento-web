import { useScrollReveal } from "@/hooks/use-scroll-reveal";

import studioImg from "@assets/generated_images/studio_portrait.jpg";
import galleryImg1 from "@assets/generated_images/gallery_1.jpg";
import stripImg from "@assets/generated_images/photo_strip.jpg";
import heroImg from "@assets/generated_images/hero_placeholder.jpg";

export default function Gallery() {
  useScrollReveal();

  const images = [
    { src: galleryImg1, aspect: "aspect-[3/4]", label: "Gala Portrait" },
    { src: heroImg, aspect: "aspect-square", label: "Timeless Event" },
    { src: studioImg, aspect: "aspect-[4/3]", label: "Studio Session" },
    { src: galleryImg1, aspect: "aspect-[3/4]", label: "Candid Moment" },
    { src: stripImg, aspect: "aspect-[3/4]", label: "The Noir Strip" },
    { src: heroImg, aspect: "aspect-video", label: "Editorial Scene" },
    { src: stripImg, aspect: "aspect-[2/5]", label: "Archive Strip" }, 
    { src: galleryImg1, aspect: "aspect-[3/4]", label: "Gala Evening" },
    { src: studioImg, aspect: "aspect-square", label: "Classic Portrait" },
  ];

  return (
    <main className="w-full flex flex-col min-h-screen pt-32 pb-24 bg-background">
      <section className="px-6 md:px-12 max-w-[1600px] mx-auto w-full mb-20 fade-up text-center">
        <h1 className="font-serif text-5xl md:text-7xl text-primary mb-6">The Archive</h1>
        <p className="text-lg font-light text-primary/60 max-w-xl mx-auto">
          A selection of moments preserved. Real people, authentic joy, timeless restraint.
        </p>
      </section>

      <section className="px-4 md:px-12 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-start">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-6 md:gap-10">
            {images.filter((_, i) => i % 3 === 0).map((img, i) => (
              <div key={`col1-${i}`} className={`${img.aspect} w-full bg-muted crop-reveal relative overflow-hidden flex items-center justify-center`}>
                <span className="font-sans text-[10px] tracking-widest uppercase text-primary/30 relative z-10 text-center px-4">{img.label}</span>
                <div 
                  className="absolute inset-0 bg-cover bg-center filter grayscale-[0.3] hover:grayscale-0 transition-all duration-1000"
                  style={{ backgroundImage: `url(${img.src})` }}
                />
              </div>
            ))}
          </div>

          {/* Column 2 - offset top slightly on desktop */}
          <div className="flex flex-col gap-6 md:gap-10 md:mt-16">
            {images.filter((_, i) => i % 3 === 1).map((img, i) => (
              <div key={`col2-${i}`} className={`${img.aspect} w-full bg-muted crop-reveal relative overflow-hidden flex items-center justify-center`}>
                <span className="font-sans text-[10px] tracking-widest uppercase text-primary/30 relative z-10 text-center px-4">{img.label}</span>
                <div 
                  className="absolute inset-0 bg-cover bg-center filter sepia-[0.2] hover:sepia-0 transition-all duration-1000"
                  style={{ backgroundImage: `url(${img.src})` }}
                />
              </div>
            ))}
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-6 md:gap-10 md:mt-8">
            {images.filter((_, i) => i % 3 === 2).map((img, i) => (
              <div key={`col3-${i}`} className={`${img.aspect} w-full bg-muted crop-reveal relative overflow-hidden flex items-center justify-center`}>
                <span className="font-sans text-[10px] tracking-widest uppercase text-primary/30 relative z-10 text-center px-4">{img.label}</span>
                <div 
                  className="absolute inset-0 bg-cover bg-center filter grayscale hover:grayscale-0 transition-all duration-1000"
                  style={{ backgroundImage: `url(${img.src})` }}
                />
              </div>
            ))}
          </div>

        </div>
      </section>
      
      <div className="mt-32 text-center fade-up">
        <p className="font-hand text-3xl text-secondary mb-4">more memories await</p>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="font-sans text-xs tracking-[0.2em] uppercase text-primary/70 hover:text-primary transition-colors">
          Follow us on Instagram
        </a>
      </div>
    </main>
  );
}
