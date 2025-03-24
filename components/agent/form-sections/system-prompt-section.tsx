"use client";

import React, { RefObject } from "react";
import { Textarea } from "@/components/ui/textarea";
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
    <>
      <Textarea
        id="systemPrompt"
        name="systemPrompt"
        placeholder={mode === "create" 
          ? "e.g. You are a friendly assistant! Keep your responses concise and helpful." 
          : "Enter system prompt"}
        className="min-h-[180px] max-h-[600px] font-mono text-sm leading-relaxed bg-background border-0 focus-visible:ring-1 focus-visible:ring-offset-0 resize-none"
        required
        defaultValue={initialData?.systemPrompt}
        ref={systemPromptRef}
        onInput={() => adjustSystemPromptHeight()}
        onChange={(e) => handleFormValueChange('systemPrompt', e.target.value)}
      />
      <div className="mt-2 flex items-center text-xs text-muted-foreground">
        <InfoIcon className="size-3.5 mr-1" />
        This prompt is invisible to users but guides how your agent responds
      </div>
    </>
  );
} 