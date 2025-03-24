"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { PromptSuggestionEditor } from "../prompt-suggestion-editor";

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
    <Card className="shadow-sm border-2">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-lg font-semibold">Prompt Suggestions</CardTitle>
        <CardDescription>
          Add example prompts to help users get started with your agent
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <PromptSuggestionEditor
          agentId={agentId}
          onChange={onChange}
          formValues={formValues}
        />
      </CardContent>
    </Card>
  );
} 