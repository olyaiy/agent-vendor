/**
 * HeroBanner Component
 * 
 * A visually appealing carousel hero section for the AI Agent Marketplace homepage.
 * Features multiple slides with different value propositions and call-to-action buttons.
 */
"use client";

import { Suspense } from "react";
import { HeroCarousel } from "./hero/hero-carousel";
import { HeroSlide1, HeroSlide2, HeroSlide3 } from "./hero/slides";

export function HeroBanner() {
  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-lg sm:rounded-xl mb-6 sm:mb-8 overflow-hidden">
      <div className="relative h-[600px] sm:h-[550px] md:h-[500px]">
        <Suspense fallback={<HeroBannerSkeleton />}>
          <HeroCarousel
            slides={[
              <HeroSlide1 index={0} key="slide-1" />,
              <HeroSlide2 index={1} key="slide-2" />,
              <HeroSlide3 index={2} key="slide-3" />
            ]}
            autoPlayInterval={8000}
          />
        </Suspense>
      </div>
    </div>
  );
}

function HeroBannerSkeleton() {
  return (
    <div className="animate-pulse w-full h-full">
      <div className="container px-3 sm:px-4 py-5 sm:py-8 h-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-full items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="h-12 bg-slate-800/50 rounded-lg w-4/5"></div>
            <div className="h-8 bg-slate-800/50 rounded-lg w-3/5"></div>
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3">
                <div className="bg-slate-800/50 p-2 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-800/50 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-slate-800/50 rounded w-4/5"></div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-slate-800/50 p-2 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-slate-800/50 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-slate-800/50 rounded w-4/5"></div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-3">
              <div className="h-9 bg-slate-800/50 rounded-md w-32"></div>
              <div className="h-9 bg-slate-800/50 rounded-md w-32"></div>
            </div>
          </div>
          <div className="hidden md:block md:col-span-5 h-64">
            <div className="bg-slate-800/50 rounded-lg w-full h-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}