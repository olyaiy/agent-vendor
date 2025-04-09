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
import { createAgent } from "@/db/actions/agent-actions";
import { InfoCircledIcon, ChevronRightIcon, DiscIcon } from '@radix-ui/react-icons';
import { VisibilitySelector } from "@/app/components/visibility-selector";


export interface ModelInfo {
  id: string;
  model: string;
  description: string | null;
}

interface CreateAgentFormProps {
  userId: string | undefined;
  models: ModelInfo[];
}

export function CreateAgentForm({ userId, models }: CreateAgentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [primaryModelId, setPrimaryModelId] = useState<string>("");
  const [visibility, setVisibility] = useState<"public" | "private" | "link">("public");
  
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
        const result = await createAgent(newAgentData);
        
        if (result.success) {
          toast.success("Agent created successfully");
          // Redirect to the agents page
          router.push(`/agent`);
        } else {
          throw new Error(result.error || "Failed to create agent");
        }
      } catch (error) {
        toast.error("Failed to create agent. Please try again.");
        console.error(error);
      }
    });
  };

  // Placeholder for image uploader component
  const AgentImageUploader = ({ imageUrl, setImageUrl }: { imageUrl: string | null, setImageUrl: (url: string | null) => void }) => {
    return (
      <div 
        className="relative flex items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 dark:bg-gray-900 cursor-pointer transition-colors"
        onClick={() => setImageUrl("https://via.placeholder.com/150")}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="Agent" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="text-center p-4">
            <div className="flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Upload Image</p>
          </div>
        )}
      </div>
    );
  };

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
              <AgentImageUploader
                imageUrl={thumbnailUrl}
                setImageUrl={setThumbnailUrl}
              />
              <p className="text-xs text-muted-foreground">
                Upload an image that represents your agent&apos;s personality
              </p>
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
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <div className="pb-2 border-b">
              <h2 className="text-lg font-medium tracking-tight">Intelligence</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the AI model behind your agent
              </p>
            </div>
          </div>
          
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
        </section>
        
        <Separator />
        
        {/* System Prompt Section */}
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
        </section>
      </div>
      
      {/* Footer Actions */}
      <div className="flex justify-between py-5 border-t mt-8">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/agent')}
          className="w-28"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending || !primaryModelId}
          className="w-36 gap-2"
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