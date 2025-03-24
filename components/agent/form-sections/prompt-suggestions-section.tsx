"use client";

import React from "react";
import { PromptSuggestionEditor } from "../prompt-suggestion-editor";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PromptSuggestionsSectionProps {
  agentId?: string;
  onChange: (prompts: string[]) => void;
  formValues: {
    title: string;
    description: string;
    systemPrompt: string;
  };
}

export function PromptSuggestionsSection({
  agentId,
  onChange,
  formValues
}: PromptSuggestionsSectionProps) {
  return (
    <section className="space-y-12 pb-10 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Prompt Suggestions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add example prompts to help users get started with your agent
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                User Prompts
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p>Suggested prompts appear as clickable buttons at the start of a conversation.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-8 space-y-6">
          <PromptSuggestionEditor
            agentId={agentId}
            onChange={onChange}
            formValues={formValues}
          />
        </div>
      </div>
    </section>
  );
} 