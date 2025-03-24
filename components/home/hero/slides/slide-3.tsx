/**
 * HeroSlide3 Component
 * 
 * Developer-focused slide highlighting code capabilities and API integration.
 * Features code sample and developer tools.
 */
"use client";

import { Button } from "@/components/ui/button";
import { Code, Braces, ArrowRight } from "lucide-react";
import Link from "next/link";
import { HeroSlideProps } from "../hero-slide";

export function HeroSlide3({ isActive = false }: HeroSlideProps) {
  return (
    <div className="w-full h-full">
      <div className="container px-3 sm:px-4 py-5 sm:py-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
          {/* Left content section */}
          <div className="md:col-span-7 space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              For <span className="text-blue-400">Developers</span>,
              <span className="text-purple-400 block sm:inline"> By </span> 
              <span className="text-green-400">Developers</span>
              <span className="block mt-2 text-2xl sm:text-2xl font-medium text-slate-200">
                API-first architecture with powerful tools
              </span>
            </h1>
            
            <p className="text-slate-300 text-base">
              Build custom AI agent experiences with our developer-friendly tools and comprehensive API:
            </p>
            
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-blue-500/20 p-2 rounded-full flex-shrink-0 mt-0.5">
                  <Code className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-300">TypeScript SDK</h3>
                  <p className="text-slate-300 text-sm">Fully typed client and server libraries with React hooks</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-purple-500/20 p-2 rounded-full flex-shrink-0 mt-0.5">
                  <Braces className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-purple-300">Webhooks & Events</h3>
                  <p className="text-slate-300 text-sm">Integrate with your backend systems for advanced workflows</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-green-500/20 p-2 rounded-full flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-400">
                    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                    <path d="M7 7h.01"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-green-300">Custom Tools & Plugins</h3>
                  <p className="text-slate-300 text-sm">Extend agent capabilities with your own custom tools</p>
                </div>
              </div>
            </div>
            
            <div className="pt-3">
              <Button asChild className="group h-10 sm:h-9 w-full sm:w-auto" size="sm">
                <Link href="/docs/api">
                  View API Documentation
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right section - code example */}
          <div className="md:col-span-5 hidden md:block">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg blur opacity-75"></div>
              <div className="relative bg-slate-950 p-4 rounded-lg overflow-hidden font-mono text-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="h-4 w-4 text-blue-400" />
                  <div className="text-xs text-slate-400">agent.config.ts</div>
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div><span className="text-purple-400">import</span> <span className="text-blue-300">{'{'} createAgent {'}'}</span> <span className="text-purple-400">from</span> <span className="text-green-400">'agent-vendor'</span>;</div>
                  
                  <div className="h-2"></div>
                  
                  <div><span className="text-purple-400">const</span> <span className="text-blue-300">myAgent</span> = <span className="text-blue-400">createAgent</span>{'({'}</div>
                  <div>&nbsp;&nbsp;<span className="text-blue-300">name:</span> <span className="text-green-400">'CodeAssistant'</span>,</div>
                  <div>&nbsp;&nbsp;<span className="text-blue-300">model:</span> <span className="text-green-400">'gpt-4'</span>,</div>
                  <div>&nbsp;&nbsp;<span className="text-blue-300">tools:</span> [</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-400">'github'</span>,</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-400">'vscode'</span>,</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;{'{'}  <span className="text-blue-300">name:</span> <span className="text-green-400">'customTool'</span>,</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">endpoint:</span> <span className="text-green-400">'/api/my-tool'</span> {'}'}</div>
                  <div>&nbsp;&nbsp;],</div>
                  <div>&nbsp;&nbsp;<span className="text-blue-300">schema:</span> {'{'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">params:</span> {'{'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">repo:</span> {'{'} <span className="text-blue-300">type:</span> <span className="text-green-400">'string'</span> {'}'},</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">branch:</span> {'{'} <span className="text-blue-300">type:</span> <span className="text-green-400">'string'</span> {'}'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;{'}'}</div>
                  <div>&nbsp;&nbsp;{'}'}</div>
                  <div>{'}'});</div>
                </div>
                
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <div className="text-xs text-slate-400">// Try it with our SDK</div>
                  <div className="bg-slate-900 rounded px-2 py-1 mt-1 text-blue-300 text-xs overflow-x-auto whitespace-nowrap">
                    <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> agent.run{`({ repo: `}<span className="text-green-400">"user/repo"</span> {`})`};
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 