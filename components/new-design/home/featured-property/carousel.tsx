"use client";

import * as React from "react";
import Image from "next/image";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "../../ui/carousel";

interface CarouselImage {
  src: string;
  alt: string;
}

interface FeaturedPropertyCarouselProps {
  images: CarouselImage[];
}

// Limit images to prevent loading 50+ images at once
const MAX_CAROUSEL_IMAGES = 15;
// Preload first N images eagerly, rest lazy load
const EAGER_LOAD_COUNT = 3;

const FeaturedPropertyCarousel: React.FC<FeaturedPropertyCarouselProps> = ({ images }) => {
  const [api, setApi] = React.useState<CarouselApi | undefined>(undefined);
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [loadedIndices, setLoadedIndices] = React.useState<Set<number>>(
    new Set([0, 1, 2]) // Pre-load first 3
  );

  // Limit images to prevent massive DOM
  const limitedImages = React.useMemo(
    () => images.slice(0, MAX_CAROUSEL_IMAGES),
    [images]
  );

  React.useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrent(newIndex + 1);
      
      // Preload adjacent slides for smooth navigation
      setLoadedIndices(prev => {
        const next = new Set(prev);
        // Load current, previous, and next slides
        next.add(newIndex);
        next.add((newIndex - 1 + limitedImages.length) % limitedImages.length);
        next.add((newIndex + 1) % limitedImages.length);
        return next;
      });
    });
  }, [api, limitedImages.length]);

  const handleDotClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {limitedImages.map((image, index) => {
            const shouldLoad = loadedIndices.has(index);
            const isEager = index < EAGER_LOAD_COUNT;
            
            return (
              <CarouselItem key={index}>
                {shouldLoad || isEager ? (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={680}
                    height={510}
                    sizes="(max-width: 640px) 95vw, (max-width: 1024px) 680px, 680px"
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    className="rounded-2xl w-full h-auto max-h-[540px] object-cover"
                  />
                ) : (
                  // Placeholder for unloaded slides
                  <div 
                    className="rounded-2xl w-full bg-slate-200 dark:bg-slate-700 animate-pulse"
                    style={{ aspectRatio: '4/3', maxHeight: '540px' }}
                  />
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      
      {/* Carousel Counter */}
      {count > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 bg-dark/50 rounded-full py-2 px-4 bottom-4 sm:bottom-10 flex items-center gap-3">
          <button
            onClick={() => handleDotClick(current - 2 < 0 ? count - 1 : current - 2)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span className="text-white text-sm font-medium min-w-[45px] text-center">
            {current} / {count}
          </span>
          <button
            onClick={() => handleDotClick(current >= count ? 0 : current)}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedPropertyCarousel;



