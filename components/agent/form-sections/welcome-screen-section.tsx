"use client";

import React from "react";
import { OverviewEditor } from "../customization-editor";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WelcomeScreenSectionProps {
  overview: {
    title: string;
    content: string;
    showPoints: boolean;
    points: string[];
  };
  onChange: (overview: {
    title: string;
    content: string;
    showPoints: boolean;
    points: string[];
  }) => void;
}

export function WelcomeScreenSection({ overview, onChange }: WelcomeScreenSectionProps) {
  return (
    <section className="space-y-12 pb-10 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Welcome Screen</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Personalize what users see when they first interact with your agent
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Customize Content
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Set the title, description, and key points for your agent's welcome screen.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-8 space-y-6">
          <OverviewEditor 
            overview={overview} 
            onChange={onChange} 
          />
        </div>
      </div>
    </section>
  );
} 