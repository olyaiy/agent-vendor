/**
 * HeroSlide2 Component
 * 
 * Focuses on the agent builder and monetization features.
 * Shows analytics mockup and emphasizes business potential.
 */
"use client";

import { Button } from "@/components/ui/button";
import { BarChart2, ArrowRight, Wallet } from "lucide-react";
import Link from "next/link";
import { HeroSlideProps } from "../hero-slide";

export function HeroSlide2({ isActive = false }: HeroSlideProps) {
  return (
    <div className="w-full h-full">
      <div className="container px-3 sm:px-4 py-5 sm:py-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
          {/* Left section - Analytics mockup on desktop */}
          <div className="md:col-span-5 order-2 md:order-1">
            <div className="relative mx-auto max-w-[320px] md:max-w-full">
              <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-700">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900/50 to-blue-900/20"></div>
                <div className="absolute inset-0 p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <div className="text-xs text-blue-400 font-medium">Agent Analytics</div>
                    </div>
                    <div className="bg-purple-500/20 backdrop-blur-sm p-1 rounded-full">
                      <BarChart2 className="h-4 w-4 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="rounded-lg bg-slate-800/70 backdrop-blur-sm w-full max-w-[240px] mx-auto p-4">
                      <div className="text-center mb-3 text-sm text-slate-300">Monthly Revenue</div>
                      
                      <div className="relative h-32">
                        {/* Revenue chart bars */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end h-24">
                          {[15, 25, 20, 35, 40, 60, 65].map((height, i) => (
                            <div 
                              key={i} 
                              className="w-6 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm" 
                              style={{ height: `${height}%` }}
                            ></div>
                          ))}
                        </div>
                        
                        {/* Chart labels */}
                        <div className="absolute -bottom-6 left-0 right-0 flex justify-between">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={i} className="text-[10px] text-slate-400">{day}</div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-700">
                        <div className="text-xs text-slate-400">Total Earnings</div>
                        <div className="text-sm font-medium text-green-400">$842.50</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right content section */}
          <div className="md:col-span-7 space-y-3 sm:space-y-4 order-1 md:order-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Build <span className="text-blue-400">Once</span>,
              <span className="text-purple-400 block sm:inline"> Earn </span> 
              <span className="text-green-400">Forever</span>
              <span className="block mt-2 text-2xl sm:text-2xl font-medium text-slate-200">
                Launch your AI agent business in minutes
              </span>
            </h1>
            
            <p className="text-slate-300 text-base">
              Turn your expertise into a scalable business with our complete platform for building, deploying, and monetizing AI agents.
            </p>
            
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Wallet className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-300">Multiple Revenue Models</h3>
                  <p className="text-slate-300 text-sm">Choose from subscriptions, pay-per-use, or freemium models</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                <div className="bg-blue-500/20 p-2 rounded-full">
                  <BarChart2 className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-300">Real-time Analytics</h3>
                  <p className="text-slate-300 text-sm">Track usage, revenue, and customer engagement</p>
                </div>
              </div>
            </div>
            
            <div className="pt-3">
              <Button asChild className="group h-10 sm:h-9 w-full sm:w-auto" size="sm">
                <Link href="/agents/create">
                  Start Building Now
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 