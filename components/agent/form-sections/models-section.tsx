"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { ModelSelectorSection, ModelInfo } from "../model-selector-section";

interface ModelsSectionProps {
  models: ModelInfo[];
  primaryModelId: string;
  alternateModelIds: string[];
  onPrimaryModelChange: (id: string) => void;
  onAlternateModelsChange: (ids: string[]) => void;
}

export function ModelsSection({
  models,
  primaryModelId,
  alternateModelIds,
  onPrimaryModelChange,
  onAlternateModelsChange
}: ModelsSectionProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-4">
        <div className="pb-2 border-b">
          <h2 className="text-lg font-medium tracking-tight">Intelligence</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose the AI models behind your agent
          </p>
        </div>
      </div>
      
      <div className="md:col-span-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="primaryModel" className="text-sm font-medium flex items-center gap-1.5">
                AI Models
                <span className="text-red-500">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Select the AI models that will power your agent. The primary model will be used by default, with alternates available as fallbacks.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
              Required
            </Badge>
          </div>
          
          <div className=" rounded-lg ">
            <ModelSelectorSection
              models={models}
              primaryModelId={primaryModelId}
              alternateModelIds={alternateModelIds}
              onPrimaryModelChange={onPrimaryModelChange}
              onAlternateModelsChange={onAlternateModelsChange}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Choose the models that best fit your agent's purpose. Different models have different capabilities.
          </p>
        </div>
      </div>
    </section>
  );
}