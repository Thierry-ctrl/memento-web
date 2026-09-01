import studioImg from "@assets/generated_images/memento_kigali_portrait.jpg";
import galleryImg1 from "@assets/generated_images/memento_kigali_candid.jpg";
import stripImg from "@assets/generated_images/memento_kigali_prints.jpg";
import heroImg from "@assets/generated_images/memento_kigali_hero.jpg";

export default function Gallery() {
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
    <main className="w-full flex flex-col min-h-screen pt-32 pb-24 paper">
      <section className="px-6 md:px-12 max-w-[1600px] mx-auto w-full mb-20 text-center">
         <p className="eyebrow text-secondary mb-5">Curated moments</p>
         <h1 className="font-serif text-5xl md:text-7xl text-primary mb-6">The <em>Archive.</em></h1>
      </section>

      <section className="px-4 md:px-12 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 items-start">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-6 md:gap-10">
            {images.filter((_, i) => i % 3 === 0).map((img, i) => (
              <div key={`col1-${i}`} className={`${img.aspect} w-full bg-muted relative overflow-hidden flex items-center justify-center`}>
                 <img
                   src={img.src}
                   alt={img.label}
                   className="absolute inset-0 h-full w-full object-cover filter grayscale-[0.3] hover:grayscale-0 transition-all duration-1000"
                 />
              </div>
            ))}
          </div>

          {/* Column 2 - offset top slightly on desktop */}
          <div className="flex flex-col gap-6 md:gap-10 md:mt-16">
            {images.filter((_, i) => i % 3 === 1).map((img, i) => (
              <div key={`col2-${i}`} className={`${img.aspect} w-full bg-muted relative overflow-hidden flex items-center justify-center`}>
                 <img
                   src={img.src}
                   alt={img.label}
                   className="absolute inset-0 h-full w-full object-cover filter sepia-[0.2] hover:sepia-0 transition-all duration-1000"
                 />
              </div>
            ))}
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-6 md:gap-10 md:mt-8">
            {images.filter((_, i) => i % 3 === 2).map((img, i) => (
              <div key={`col3-${i}`} className={`${img.aspect} w-full bg-muted relative overflow-hidden flex items-center justify-center`}>
                 <img
                   src={img.src}
                   alt={img.label}
                   className="absolute inset-0 h-full w-full object-cover filter grayscale hover:grayscale-0 transition-all duration-1000"
                 />
              </div>
            ))}
          </div>

        </div>
      </section>
    </main>
  );
}
