"use client";

import { FormSection } from '@/components/form-section'
import React from 'react'
import { Knowledge } from '@/db/schema/agent'
import { KnowledgeEditor } from '@/components/knowledge-editor'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { addKnowledgeItemAction, updateKnowledgeItemAction, deleteKnowledgeItemAction } from '@/db/actions/knowledge.actions'

interface AgentKnowledgeFormProps {
  knowledgeItems: Knowledge[]
  agentId: string
}

const AgentKnowledgeForm = ({ knowledgeItems, agentId }: AgentKnowledgeFormProps) => {
  const handleAddItem = async (item: { title: string; content: string; sourceUrl?: string }) => {
    const result = await addKnowledgeItemAction({
      agentId,
      title: item.title,
      content: item.content,
      sourceUrl: item.sourceUrl
    });
    
    if (!result.success) {
      console.error("Failed to add knowledge item:", result.error);
      throw new Error(result.error || "Failed to add knowledge item");
    }
    
    return result.data!;
  };

  const handleUpdateItem = async (item: { id: string; title?: string; content?: string; sourceUrl?: string }) => {
    const result = await updateKnowledgeItemAction(item.id, {
      title: item.title,
      content: item.content,
      sourceUrl: item.sourceUrl
    });
    
    if (!result.success) {
      console.error("Failed to update knowledge item:", result.error);
      throw new Error(result.error || "Failed to update knowledge item");
    }
    
    return result.data!;
  };

  const handleDeleteItem = async (id: string) => {
    const result = await deleteKnowledgeItemAction(id);
    
    if (!result.success) {
      console.error("Failed to delete knowledge item:", result.error);
      throw new Error(result.error || "Failed to delete knowledge item");
    }
    
    return { success: true };
  };

  return (
    <FormSection title="Knowledge Base" description="Add knowledge items that your agent can reference during conversations.">
      <section className="flex flex-col gap-8">
        <div className="md:col-span-4 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                Knowledge Items
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px] p-4 rounded-xl">
                    <p className="text-sm leading-relaxed">Upload files (.txt, .pdf) or add text content for your agent to reference.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-8">
          <KnowledgeEditor
            knowledgeItems={knowledgeItems}
            agentId={agentId}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      </section>
    </FormSection>
  )
}

export default AgentKnowledgeForm
