"use client";

import React, { RefObject } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "@/components/icons/info-icon";

interface SystemPromptSectionProps {
  mode: "create" | "edit";
  initialData?: {
    systemPrompt: string;
  };
  systemPromptRef: React.RefObject<HTMLTextAreaElement> | { current: HTMLTextAreaElement | null };
  adjustSystemPromptHeight: () => void;
  handleFormValueChange: (field: "title" | "description" | "systemPrompt", value: string) => void;
}

export function SystemPromptSection({
  mode,
  initialData,
  systemPromptRef,
  adjustSystemPromptHeight,
  handleFormValueChange
}: SystemPromptSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="systemPrompt" className="text-sm font-medium">
          Instructions for your agent
        </Label>
      </div>
      <div className="relative">
        <Textarea
          id="systemPrompt"
          name="systemPrompt"
          placeholder={mode === "create" 
            ? "e.g. You are a friendly assistant! Keep your responses concise and helpful." 
            : "Enter system prompt"}
          className="min-h-[180px] max-h-[75vh] overflow-y-auto font-mono text-sm leading-relaxed pr-4"
          required
          defaultValue={initialData?.systemPrompt}
          ref={systemPromptRef}
          onInput={() => adjustSystemPromptHeight()}
          onChange={(e) => handleFormValueChange('systemPrompt', e.target.value)}
        />
        <div className="absolute bottom-3 right-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  <AlertCircle className="size-4 text-gray-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[300px]">
                <p className="font-medium mb-1">Tips for effective system prompts:</p>
                <ul className="text-xs space-y-1 list-disc pl-4">
                  <li>Define the agent&apos;s role clearly (e.g., &quot;You are a math tutor&quot;)</li>
                  <li>Specify tone and style (formal, casual, technical)</li>
                  <li>Set response length preferences (concise, detailed)</li>
                  <li>Include any domain-specific knowledge</li>
                  <li>Define how to handle uncertain questions</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
        <span className="flex items-center gap-1">
          <InfoIcon className="size-3.5" />
          This prompt is invisible to users but guides how your agent responds
        </span>
      </div>
    </div>
  );
} 