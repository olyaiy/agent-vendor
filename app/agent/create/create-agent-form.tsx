"use client";

import React, { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2  } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MultipleSelector, { Option } from "@/components/ui/multiselect"; // Import MultipleSelector and Option type
import { createAgent, updateAgentTagsAction } from "@/db/actions/agent-actions"; // Import actions
import { InfoCircledIcon, ChevronRightIcon, DiscIcon } from '@radix-ui/react-icons';
import { VisibilitySelector } from "@/components/visibility-selector";
import { AgentImage } from "@/components/agent-image";
import { FormSection } from "@/components/form-section";

export interface ModelInfo {
  id: string;
  model: string;
  description: string | null;
}

interface CreateAgentFormProps {
  userId: string | undefined;
  models: ModelInfo[];
  allTags: Option[]; // Add prop for all available tags
}

export function CreateAgentForm({ userId, models, allTags }: CreateAgentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [thumbnailUrl] = useState<string | null>(null); // TODO: Implement image upload and use setThumbnailUrl
  const [primaryModelId, setPrimaryModelId] = useState<string>("");
  const [visibility, setVisibility] = useState<"public" | "private" | "link">("public");
  const [selectedTags, setSelectedTags] = useState<Option[]>([]); // State for selected tags
  
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

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Make sure userId is defined
    if (!userId) {
      toast.error("User ID is required to create an agent");
      return;
    }

    // Make sure primaryModelId is selected
    if (!primaryModelId) {
      toast.error("Please select an AI model");
      return;
    }

    startTransition(async () => {
      try {
        // Create agent data object based on schema requirements
        const newAgentData = {
          name: formData.get("agentDisplayName") as string,
          description: (formData.get("description") as string) || null,
          systemPrompt: (formData.get("systemPrompt") as string) || null,
          thumbnailUrl: thumbnailUrl,
          visibility: visibility,
          primaryModelId: primaryModelId,
          creatorId: userId,
          welcomeMessage: null,
          avatarUrl: null
        };

        // Use the server action to create the agent
        const agentCreateResult = await createAgent(newAgentData);
        
        if (agentCreateResult.success && agentCreateResult.data && agentCreateResult.data[0]) {
          const newAgent = agentCreateResult.data[0];
          toast.success("Agent created successfully. Assigning tags...");

          // If tags were selected, try to assign them
          if (selectedTags.length > 0) {
            const tagUpdateResult = await updateAgentTagsAction(newAgent.id, selectedTags.map(tag => tag.value));
            if (!tagUpdateResult.success) {
              // Agent created, but tags failed. Inform user but still redirect.
              toast.warning(`Agent created, but failed to assign tags: ${tagUpdateResult.error}. You can add them later in settings.`);
            } else {
              toast.success("Tags assigned successfully.");
            }
          }

          // Redirect to the new agent's page regardless of tag success
          router.push(`/${newAgent.id}`);

        } else {
          // Agent creation failed
          throw new Error(agentCreateResult.error || "Failed to create agent");
        }
      } catch (error) {
        toast.error(`Failed to create agent: ${(error as Error).message}`);
        console.error(error);
      }
    });
  };

  // TODO: Implement actual image upload functionality using the setThumbnailUrl state setter.
  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Main Form Container */}
      <div className="space-y-12 pb-10 pt-8">
        {/* Image and Basic Info Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-4">
            <div className="pb-2 border-b">
              <h2 className="text-lg font-medium tracking-tight">Agent Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Define your agent&apos;s identity
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Container for AgentImage, styled to indicate clickability for upload */}
              {/* TODO: Add onClick handler here to trigger file input/upload modal */}
              <div className="relative size-full aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                <AgentImage
                  thumbnailUrl={thumbnailUrl}
                  // Use a placeholder ID for gradient generation when no image is set.
                  // The actual agentId isn't available until after creation.
                  agentId="new-agent-placeholder"
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
              />
            </div>
            
            {/* Tags Section - Moved here right after agent name */}
            <div className="space-y-4">
                <div className="flex items-start gap-1.5 mb-1.5">
                    <Label htmlFor="tags" className="text-sm font-medium flex items-center gap-1.5">
                        Tags
                    </Label>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[250px]">
                                <p>Categorize your agent with relevant tags to improve discoverability.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <MultipleSelector
                    value={selectedTags}
                    onChange={setSelectedTags}
                    defaultOptions={allTags} // Provide all tags fetched from server
                    placeholder="Select tags..."
                    emptyIndicator={
                        <p className="text-center text-sm leading-10 text-muted-foreground">
                            No tags found. Create tags in the Admin panel.
                        </p>
                    }
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
              />
            </div>
            
            <VisibilitySelector 
              value={visibility}
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
                  value={primaryModelId} 
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
      </div>
      
      {/* Footer Actions */}
      <div className="flex justify-between py-5 border-t mt-8">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/agent')}
          className="w-28 cursor-pointer"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending || !primaryModelId}
          className="w-36 gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <DiscIcon className="size-4" />
              Create Agent
            </>
          )}
        </Button>
      </div>
      <input type="hidden" name="userId" value={userId || ''} />
    </form>
  );
}