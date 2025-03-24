"use client";

import React from "react";
import { ToolGroupSelector, ToolGroupInfo } from "../tool-group-selector";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolGroupsSectionProps {
  toolGroups: ToolGroupInfo[];
  selectedToolGroupIds: string[];
  onChange: (toolGroupIds: string[]) => void;
}

export function ToolGroupsSection({
  toolGroups,
  selectedToolGroupIds,
  onChange
}: ToolGroupsSectionProps) {
  return (
    <section className="space-y-12 pb-10 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Tool Groups</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enable specific tools and capabilities for your agent
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                Tool Selection
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Select which tool groups your agent can access.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-8 space-y-6">
          <ToolGroupSelector
            toolGroups={toolGroups}
            selectedToolGroupIds={selectedToolGroupIds}
            onChange={onChange}
          />
        </div>
      </div>
    </section>
  );
} 