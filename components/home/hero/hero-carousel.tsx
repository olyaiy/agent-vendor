/**
 * HeroCarousel Component
 * 
 * Manages the display and navigation of hero slides with auto-advance functionality.
 * Provides dot indicators and arrow navigation on desktop.
 */
"use client";

import { useState, useEffect, useCallback, ReactNode, ReactElement, cloneElement } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSlideProps } from "./hero-slide";

interface HeroCarouselProps {
  slides: ReactElement<HeroSlideProps>[];
  autoPlayInterval?: number;
}

export function HeroCarousel({ 
  slides, 
  autoPlayInterval = 7000 
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Function to advance to the next slide
  const nextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);
  
  // Function to go back to the previous slide
  const prevSlide = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);
  
  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextSlide, autoPlayInterval, isPaused]);
  
  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides container */}
      <div className="relative w-full h-full overflow-hidden">
        {slides.map((slide, index) => 
          cloneElement(slide, { 
            key: `slide-${index}`,
            isActive: index === activeIndex,
            index
          })
        )}
      </div>
      
      {/* Navigation dots */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((_, index) => (
          <button
            key={`dot-${index}`}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex 
                ? 'bg-white w-6' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Arrow controls (hidden on mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm rounded-full hidden sm:flex z-20 h-9 w-9 text-white/90 hover:text-white hover:bg-black/30"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm rounded-full hidden sm:flex z-20 h-9 w-9 text-white/90 hover:text-white hover:bg-black/30"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
} 