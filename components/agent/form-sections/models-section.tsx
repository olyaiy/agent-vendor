"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-lg font-semibold">AI Models</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="size-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>Select the AI models that will power your agent. The primary model will be used by default, with alternates available as fallbacks.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
            Required
          </Badge>
        </div>
        <CardDescription>
          Choose the primary model and optional alternate models for your agent
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ModelSelectorSection
          models={models}
          primaryModelId={primaryModelId}
          alternateModelIds={alternateModelIds}
          onPrimaryModelChange={onPrimaryModelChange}
          onAlternateModelsChange={onAlternateModelsChange}
        />
      </CardContent>
    </Card>
  );
} 