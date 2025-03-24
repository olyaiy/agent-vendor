"use client";

import React, { RefObject } from "react";
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
import { SystemPromptSection } from "./system-prompt-section";

interface SystemPromptCardSectionProps {
  mode: "create" | "edit";
  initialData?: {
    systemPrompt: string;
  };
  systemPromptRef: React.RefObject<HTMLTextAreaElement> | { current: HTMLTextAreaElement | null };
  adjustSystemPromptHeight: () => void;
  handleFormValueChange: (field: "title" | "description" | "systemPrompt", value: string) => void;
}

export function SystemPromptCardSection({
  mode,
  initialData,
  systemPromptRef,
  adjustSystemPromptHeight,
  handleFormValueChange
}: SystemPromptCardSectionProps) {
  return (
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-lg font-semibold">System Prompt</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="size-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p>The system prompt defines how your agent behaves. Be specific about its role, knowledge, and preferred response style.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
            Required
          </Badge>
        </div>
        <CardDescription>
          Define how your agent should behave and respond
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <SystemPromptSection 
          mode={mode}
          initialData={initialData}
          systemPromptRef={systemPromptRef}
          adjustSystemPromptHeight={adjustSystemPromptHeight}
          handleFormValueChange={handleFormValueChange}
        />
      </CardContent>
    </Card>
  );
} 