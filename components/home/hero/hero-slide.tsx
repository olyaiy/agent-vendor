/**
 * HeroSlide Interface Component
 * 
 * Defines the props interface and provides a base wrapper for hero banner slides.
 */

import { ReactNode } from "react";

export interface HeroSlideProps {
  isActive?: boolean;
  index: number;
}

export function HeroSlide({ 
  children, 
  isActive = false
}: HeroSlideProps & { children: ReactNode }) {
  return (
    <div className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
    }`}>
      {children}
    </div>
  );
} 