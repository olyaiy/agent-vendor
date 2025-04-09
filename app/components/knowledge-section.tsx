"use client";

import React from "react";
import { KnowledgeEditor } from "./knowledge-editor"; // Adjusted import path
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label"; // Adjusted import path
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Adjusted import path
import { Knowledge } from "@/db/schema/agent"; // Import the actual schema type

// Use the Knowledge type from the schema directly or extend it if needed
// For now, let's assume the props will pass the Knowledge type directly
// interface KnowledgeItem extends Knowledge {} // Example if extension is needed

interface KnowledgeSectionProps {
  knowledgeItems: Knowledge[]; // Use the schema type
  agentId?: string; // Keep agentId if needed for context or future use
  // Adjust prop function signatures to align with schema and planned actions
  onAddItem: (item: { title: string; content: string; sourceUrl?: string }) => Promise<Knowledge>;
  onUpdateItem: (item: { id: string; title?: string; content?: string; sourceUrl?: string }) => Promise<Knowledge>;
  onDeleteItem: (id: string) => Promise<{ success: boolean }>; // Keep as is for now
}

export function KnowledgeSection({
  knowledgeItems,
  agentId,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: KnowledgeSectionProps) {
  return (
    // Using the layout structure from edit-agent-form.tsx (FormSection pattern)
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-4 space-y-4">
        <div className="pb-2 border-b">
          <h2 className="text-lg font-medium tracking-tight">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add knowledge items that your agent can reference during conversations.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              Knowledge Items
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px]">
                  <p>Upload files (.txt, .pdf) or add text content for your agent to reference.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* You could add more descriptive text or links here if needed */}
        </div>
      </div>

      <div className="md:col-span-8 space-y-6">
        <KnowledgeEditor
          knowledgeItems={knowledgeItems}
          agentId={agentId}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
        />
      </div>
    </section>
  );
}
