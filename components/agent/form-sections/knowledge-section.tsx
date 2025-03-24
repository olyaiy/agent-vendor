"use client";

import React from "react";
import { KnowledgeEditor } from "../knowledge-editor";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KnowledgeItem {
  id: string;
  title: string;
  content: any;
  type: string;
  description: string | null;
  agentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface KnowledgeSectionProps {
  knowledgeItems: KnowledgeItem[];
  agentId?: string;
  onAddItem: (item: { title: string; content: any; description?: string; type?: string }) => Promise<any>;
  onUpdateItem: (item: { id: string; title?: string; content?: any; description?: string }) => Promise<any>;
  onDeleteItem: (id: string) => Promise<any>;
}

export function KnowledgeSection({
  knowledgeItems,
  agentId,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: KnowledgeSectionProps) {
  return (
    <section className="space-y-12 pb-10 pt-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Knowledge Base</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add knowledge items that your agent can reference during conversations
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
                    <p>Upload files or add text content for your agent to reference.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
      </div>
    </section>
  );
} 