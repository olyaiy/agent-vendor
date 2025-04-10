"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  updateAgentAction,
  addKnowledgeItemAction,    // Added
  updateKnowledgeItemAction, // Added
  deleteKnowledgeItemAction  // Added
} from "@/db/actions/agent-actions";
import { generateAgentSlug } from "@/lib/utils";
import { InfoCircledIcon, ChevronRightIcon, DiscIcon, ChatBubbleIcon } from '@radix-ui/react-icons'; // Added ChatBubbleIcon
import { VisibilitySelector } from "@/app/components/visibility-selector";
import { AgentImage } from "@/components/agent-image";
import { FormSection } from "@/app/components/form-section";
import { KnowledgeSection } from "@/app/components/knowledge-section"; // Added
import { Agent, Knowledge } from "@/db/schema/agent"; // Import Agent type

export interface ModelInfo {
  id: string;
  model: string;
  description: string | null;
}

interface EditAgentFormProps {
  agent: Agent; // Accept agent data
  models: ModelInfo[];
  knowledge: Knowledge[]; // Keep existing knowledge prop
}

export function EditAgentForm({ agent, models, knowledge: initialKnowledge }: EditAgentFormProps) { // Renamed prop for clarity
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isKnowledgeSubmitting, startKnowledgeTransition] = useTransition(); // Separate transition for knowledge actions

  // Form state initialized with agent data
  // Form state
  const [thumbnailUrl] = useState<string | null>(agent.thumbnailUrl); // TODO: Implement image upload
  const [primaryModelId, setPrimaryModelId] = useState<string>(agent.primaryModelId);
  const [visibility, setVisibility] = useState<"public" | "private" | "link">(agent.visibility as "public" | "private" | "link");
  const [knowledgeItems, setKnowledgeItems] = useState<Knowledge[]>(initialKnowledge); // State for knowledge items

  // Refs
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);

  // Adjust system prompt height
  const adjustSystemPromptHeight = () => {
    const textarea = systemPromptRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Adjust height on initial render and when agent data changes
  useEffect(() => {
    adjustSystemPromptHeight();
  }, [agent.systemPrompt]); // Dependency on agent.systemPrompt

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Make sure primaryModelId is selected
    if (!primaryModelId) {
      toast.error("Please select an AI model");
      return;
    }

    startTransition(async () => {
      try {
        // Create agent update data object
        const updatedAgentData = {
          name: formData.get("agentDisplayName") as string,
          description: (formData.get("description") as string) || null,
          systemPrompt: (formData.get("systemPrompt") as string) || null,
          thumbnailUrl: thumbnailUrl, // Use state value
          visibility: visibility, // Use state value
          primaryModelId: primaryModelId, // Use state value
          // avatarUrl and welcomeMessage could be added here if editable
        };

        // Use the server action to update the agent
        const result = await updateAgentAction(agent.id, updatedAgentData);

        if (result.success && result.data) {
          toast.success("Agent updated successfully");
          // Optionally, refresh data or navigate
          // router.refresh(); // Refresh server components on the page
          // Consider if navigation is needed, maybe stay on settings?
        } else {
          throw new Error(result.error || "Failed to update agent");
        }
      } catch (error) {
        toast.error("Failed to update agent. Please try again.");
        console.error(error);
      }
    });
  };

  // --- Knowledge Handlers ---
  const handleAddItem = async (item: { title: string; content: string; sourceUrl?: string }): Promise<Knowledge> => {
    return new Promise((resolve, reject) => {
      startKnowledgeTransition(async () => {
        try {
          const result = await addKnowledgeItemAction({ ...item, agentId: agent.id });
          if (result.success && result.data) {
            setKnowledgeItems(prev => [...prev, result.data!]);
            resolve(result.data); // Resolve with the new item
          } else {
            throw new Error(result.error || "Failed to add knowledge item");
          }
        } catch (error) {
          console.error("Error adding knowledge item:", error);
          toast.error("Failed to add knowledge item.");
          reject(error); // Reject the promise on error
        }
      });
    });
  };

  const handleUpdateItem = async (item: { id: string; title?: string; content?: string; sourceUrl?: string }): Promise<Knowledge> => {
     return new Promise((resolve, reject) => {
      startKnowledgeTransition(async () => {
        try {
          const result = await updateKnowledgeItemAction(item.id, {
            title: item.title,
            content: item.content,
            sourceUrl: item.sourceUrl
          });
          if (result.success && result.data) {
            setKnowledgeItems(prev => prev.map(k => k.id === item.id ? result.data! : k));
            resolve(result.data); // Resolve with the updated item
          } else {
            throw new Error(result.error || "Failed to update knowledge item");
          }
        } catch (error) {
          console.error("Error updating knowledge item:", error);
          toast.error("Failed to update knowledge item.");
          reject(error); // Reject the promise on error
        }
      });
    });
  };

  const handleDeleteItem = async (id: string): Promise<{ success: boolean }> => {
    return new Promise((resolve, reject) => {
      startKnowledgeTransition(async () => {
        try {
          const result = await deleteKnowledgeItemAction(id);
          if (result.success) {
            setKnowledgeItems(prev => prev.filter(k => k.id !== id));
            resolve({ success: true }); // Resolve on success
          } else {
            throw new Error(result.error || "Failed to delete knowledge item");
          }
        } catch (error) {
          console.error("Error deleting knowledge item:", error);
          toast.error("Failed to delete knowledge item.");
          reject(error); // Reject the promise on error
        }
      });
    });
  };

  // TODO: Implement actual image upload functionality using the setThumbnailUrl state setter.
  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto ">
      {/* Main Form Container */}
      <div className="space-y-12 pb-10 pt-8">
        {/* Image and Basic Info Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-4">
            <div className="pb-2 border-b">
              <h2 className="text-lg font-medium tracking-tight">Agent Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Update your agent&apos;s identity
              </p>
            </div>

            <div className="space-y-3">
              {/* Container for AgentImage, styled to indicate clickability for upload */}
              {/* TODO: Add onClick handler here to trigger file input/upload modal */}
              <div className="relative size-full aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                <AgentImage
                  thumbnailUrl={thumbnailUrl} // Use state value
                  agentId={agent.id} // Use actual agentId
                />
                {/* Optional: Add an overlay hint on hover to guide the user */}
                 {!thumbnailUrl && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <p className="mt-1 text-xs text-white font-medium">Set Image</p>
                   </div>
                 )}
              </div>

            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-start gap-1.5">
                  <Label htmlFor="agentDisplayName" className="text-sm font-medium flex items-center gap-1.5">
                    Agent Name
                    <span className="text-red-500">*</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p>The name of your agent as displayed to users.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                  Required
                </Badge>
              </div>
              <Input
                id="agentDisplayName"
                name="agentDisplayName"
                required
                placeholder="Enter a name for your agent"
                className="h-11"
                defaultValue={agent.name} // Set default value
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-1.5 mb-1.5">
                <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5">
                  Description
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[250px]">
                      <p>A brief description of what your agent does.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what your agent does and how it can help users"
                className="min-h-24 resize-none"
                defaultValue={agent.description || ""} // Set default value
              />
            </div>

            <VisibilitySelector
              value={visibility} // Use state value
              onValueChange={setVisibility}
            />
          </div>
        </section>

        <Separator />

        {/* AI Model Section */}
        <FormSection
          title="Intelligence"
          description="Choose the AI model behind your agent"
        >
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-start gap-1.5">
                  <Label htmlFor="primaryModel" className="text-sm font-medium flex items-center gap-1.5">
                    AI Model
                    <span className="text-red-500">*</span>
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p>Select the AI model that will power your agent.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                  Required
                </Badge>
              </div>
              <div className="bg-secondary/50 border rounded-lg p-0.5">
                <Select
                  value={primaryModelId} // Use state value
                  onValueChange={setPrimaryModelId}
                >
                  <SelectTrigger className="h-11 bg-background border-0 focus-visible:ring-1 focus-visible:ring-offset-0">
                    <SelectValue placeholder="Select an AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Choose the model that best fits your agent&apos;s purpose. Different models have different capabilities.
              </p>
            </div>
          </div>
        </FormSection>

        <Separator />

        {/* System Prompt Section */}
        <FormSection
          title="Behavior"
          description="Set your agent's personality and instructions"
        >
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
                        <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[250px]">
                        <p>Instructions that define how your agent behaves.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                  Required
                </Badge>
              </div>
              <div className="bg-secondary/50 border rounded-lg p-0.5">
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  placeholder="e.g. You are a friendly assistant! Keep your responses concise and helpful."
                  className="min-h-[180px] font-mono text-sm leading-relaxed bg-background border-0 focus-visible:ring-1 focus-visible:ring-offset-0 resize-none"
                  required
                  ref={systemPromptRef}
                  onInput={adjustSystemPromptHeight}
                  defaultValue={agent.systemPrompt || ""} // Set default value
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border text-sm">
                <h3 className="font-medium mb-2 text-primary flex items-center gap-2">
                  <ChevronRightIcon className="size-4" />
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
        </FormSection>

        <Separator />

        {/* Knowledge Section */}
        {/* Pass state and handlers to KnowledgeSection */}
        <KnowledgeSection
          knowledgeItems={knowledgeItems}
          agentId={agent.id}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
        />
        {/* Add a subtle loading indicator for knowledge actions */}
        {isKnowledgeSubmitting && (
          <div className="flex justify-center items-center text-sm text-muted-foreground gap-2 py-2">
            <Loader2 className="size-4 animate-spin" />
            <span>Updating knowledge...</span>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center py-5 border-t mt-8">
        <div className="flex gap-2"> {/* Group Cancel and Chat buttons */}
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${generateAgentSlug(agent.name, agent.id)}`)} // Navigate back to agent page
            className="w-28 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary" // Use secondary variant
            onClick={() => router.push(`/${generateAgentSlug(agent.name, agent.id)}`)} // Navigate to agent chat page
            className="gap-2 cursor-pointer" // Add gap for icon
          >
            <ChatBubbleIcon className="size-4" />
            Chat with Agent
          </Button>
        </div>
        <Button
          type="submit"
          disabled={isPending || !primaryModelId}
          className="w-36 gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <DiscIcon className="size-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
      {/* Removed hidden userId input */}
    </form>
  );
}
