"use client";

import React, { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, ChevronRight } from "lucide-react";
import { SystemPromptSection } from "./system-prompt-section";
import { Label } from "@/components/ui/label";

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
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-4">
        <div className="pb-2 border-b">
          <h2 className="text-lg font-medium tracking-tight">Behavior</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set your agent&apos;s personality and instructions
          </p>
        </div>
      </div>
      
      <div className="md:col-span-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-start gap-1.5">
              <Label htmlFor="systemPrompt" className="text-sm font-medium flex items-center gap-1.5">
                System Prompt
                <span className="text-red-500">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>The system prompt defines how your agent behaves. Be specific about its role, knowledge, and preferred response style.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
              Required
            </Badge>
          </div>
          
          <div className="bg-secondary/50 border rounded-lg p-0.5">
            <SystemPromptSection 
              mode={mode}
              initialData={initialData}
              systemPromptRef={systemPromptRef}
              adjustSystemPromptHeight={adjustSystemPromptHeight}
              handleFormValueChange={handleFormValueChange}
            />
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border text-sm">
            <h3 className="font-medium mb-2 text-primary flex items-center gap-2">
              <ChevronRight className="size-4" />
              Tips for effective system prompts:
            </h3>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-muted-foreground">
              <li>Define the agent&apos;s role clearly (e.g., &quot;You are a math tutor&quot;)</li>
              <li>Specify tone and style (formal, casual, technical)</li>
              <li>Set response length preferences (concise, detailed)</li>
              <li>Include any domain-specific knowledge</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
} 