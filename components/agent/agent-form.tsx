"use client";

import React, { useTransition, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAgent, createAgent, deleteAgent, upsertSuggestedPrompts, createKnowledgeItem, updateKnowledgeItem, deleteKnowledgeItem } from "@/app/(agents)/actions";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  Loader2, 
  X, 
  Check, 
  ChevronsUpDown, 
  PlusCircle 
} from "lucide-react";
import { ToolGroupSelector, ToolGroupInfo } from "./tool-group-selector";
import { ModelSelectorSection, ModelInfo } from "./model-selector-section";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { InfoIcon } from "@/components/icons/info-icon";
import { getDefaultColorScheme } from "@/lib/colors";
import { OverviewEditor } from "./customization-editor";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { AgentImageUploader } from "./agent-image-uploader";
import { PromptSuggestionEditor } from "./prompt-suggestion-editor";
import { KnowledgeEditor } from "./knowledge-editor";

// Tag interface for dropdown selection
interface TagInfo {
  id: string;
  name: string;
}

// Knowledge item interface for typed props
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

interface AgentFormProps {
  mode: "create" | "edit";
  userId?: string;
  models: ModelInfo[];
  toolGroups: ToolGroupInfo[];
  tags: TagInfo[];
  knowledgeItems?: KnowledgeItem[];
  initialData?: {
    id: string;
    agentDisplayName: string;
    systemPrompt: string;
    description?: string;
    modelId: string;
    visibility: "public" | "private" | "link";
    thumbnailUrl?: string | null;
    alternateModelIds?: string[]; // Field for alternate models
    toolGroupIds?: string[]; // Field for tool groups
    tagIds?: string[]; // Field for tags
    customization?: {
      overview: {
        title: string;
        content: string;
        showPoints: boolean;
        points: string[];
      };
      style: {
        colorSchemeId: string;
      };
    };
  };
}

export default function AgentForm({ mode, userId, models, toolGroups, tags, knowledgeItems, initialData }: AgentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [thumbnailUrl, setthumbnailUrl] = useState<string | null>(initialData?.thumbnailUrl || null);
  const [primaryModelId, setPrimaryModelId] = useState<string>(initialData?.modelId || "");
  const [alternateModelIds, setAlternateModelIds] = useState<string[]>(initialData?.alternateModelIds || []);
  const [selectedToolGroupIds, setSelectedToolGroupIds] = useState<string[]>(
    initialData?.toolGroupIds || []
  );
  const [selectedTags, setSelectedTags] = useState<TagInfo[]>(
    initialData?.tagIds 
      ? initialData.tagIds.map(id => {
          const tag = tags.find(t => t.id === id);
          return tag ? tag : { id, name: "Unknown Tag" };
        })
      : []
  );
  // Add state for temporary knowledge items in create mode
  const [tempKnowledgeItems, setTempKnowledgeItems] = useState<Array<{
    id?: string;
    title: string;
    content: any;
    description?: string;
    type?: string;
  }>>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [colorSchemeId, setColorSchemeId] = useState<string>(
    initialData?.customization?.style?.colorSchemeId || getDefaultColorScheme().id
  );
  const [overviewCustomization, setOverviewCustomization] = useState({
    title: initialData?.customization?.overview?.title || "Welcome to your AI assistant!",
    content: initialData?.customization?.overview?.content || "I'm here to help answer your questions and provide information. Feel free to ask me anything.",
    showPoints: initialData?.customization?.overview?.showPoints || false,
    points: initialData?.customization?.overview?.points || []
  });
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const router = useRouter();
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const agentNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // Add state to track form values for prompt generation
  const [formValues, setFormValues] = useState({
    title: initialData?.agentDisplayName || '',
    description: initialData?.description || '',
    systemPrompt: initialData?.systemPrompt || ''
  });

  // Update form values when inputs change
  const handleFormValueChange = (field: keyof typeof formValues, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        // Basic agent data
        const baseData = {
          agentDisplayName: formData.get("agentDisplayName") as string,
          systemPrompt: formData.get("systemPrompt") as string,
          description: formData.get("description") as string || undefined,
          modelId: primaryModelId, // Use the primary model ID
          visibility: formData.get("visibility") as "public" | "private" | "link",
          creatorId: formData.get("userId") as string,
          thumbnailUrl: thumbnailUrl,
          alternateModelIds: alternateModelIds, // Include alternate models
          toolGroupIds: selectedToolGroupIds, // Include tool groups
          tagIds: selectedTags.map(tag => tag.id), // Include tag IDs
          customization: {
            overview: overviewCustomization,
            style: {
              colorSchemeId: colorSchemeId,
            }
          },
          suggestedPrompts: suggestedPrompts.filter(p => p.trim() !== "") // Include filtered suggested prompts
        };

        if (mode === "edit") {
          await updateAgent({ ...baseData, id: initialData!.id });
          
          // If we have an id, also save the suggested prompts
          if (initialData?.id) {
            await upsertSuggestedPrompts(initialData.id, suggestedPrompts.filter(p => p.trim() !== ""));
          }
          
          toast.success("Agent updated successfully");
        } else {
          const result = await createAgent(baseData);
          
          // If we have a new agent id, save the suggested prompts
          if (result?.id) {
            await upsertSuggestedPrompts(result.id, suggestedPrompts.filter(p => p.trim() !== ""));
            
            // Create any temporary knowledge items
            if (tempKnowledgeItems.length > 0) {
              const knowledgePromises = tempKnowledgeItems.map(item => 
                createKnowledgeItem({
                  ...item,
                  agentId: result.id
                })
              );
              
              await Promise.all(knowledgePromises);
            }
          }
          
          toast.success("Agent created successfully");
          router.push("/");
        }
      } catch (error) {
        const action = mode === "create" ? "create" : "update";
        toast.error(`Failed to ${action} agent. Please try again.`);
      }
    });
  };

  const adjustSystemPromptHeight = () => {
    if (systemPromptRef.current) {
      systemPromptRef.current.style.height = 'auto';
      systemPromptRef.current.style.height = `${systemPromptRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (systemPromptRef.current && initialData?.systemPrompt) {
      adjustSystemPromptHeight();
    }
  }, [initialData?.systemPrompt]);

  // Add this useEffect to log the avatar URL status
  useEffect(() => {
    if (thumbnailUrl) {
      console.log('Avatar URL exists:', thumbnailUrl);
    } else {
      console.log('No avatar URL exists');
    }
  }, [thumbnailUrl]);

  // Tag input change handler
  const handleTagInputChange = (value: string) => {
    setNewTagInput(value);
  };

  // Add a new tag (client-side only - will be created on server during form submission)
  const handleAddNewTag = () => {
    if (newTagInput.trim() === "") return;
    
    // Check if tag already exists in the list
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === newTagInput.trim().toLowerCase()
    );
    
    if (existingTag) {
      // If it exists but not selected, select it
      if (!selectedTags.some(tag => tag.id === existingTag.id)) {
        setSelectedTags([...selectedTags, existingTag]);
      }
    } else {
      // Create a temporary ID for new tag (will be replaced with actual ID on form submission)
      const tempId = `new-${Date.now()}`;
      setSelectedTags([...selectedTags, { id: tempId, name: newTagInput.trim() }]);
    }
    
    setNewTagInput("");
    setTagPopoverOpen(false);
  };

  // Remove a tag from selection
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  // Select an existing tag
  const handleSelectTag = (tag: TagInfo) => {
    if (!selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagPopoverOpen(false);
    setNewTagInput("");
  };

  // Update handlers for knowledge items
  const handleAddKnowledgeItem = async (item: { title: string; content: any; description?: string; type?: string }) => {
    if (mode === "edit" && initialData?.id) {
      return createKnowledgeItem({
        ...item,
        agentId: initialData.id
      });
    } else if (mode === "create") {
      // In create mode, store the item in state temporarily
      const tempId = `temp-${Date.now()}`;
      const newItem = {
        ...item,
        id: tempId, // Add id to the item
        agentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: item.type || 'text'
      };
      
      setTempKnowledgeItems(prev => [...prev, {...item, id: tempId}]);
      
      // Return a promise that resolves with a temporary item for UI consistency
      return Promise.resolve({
        id: newItem.id,
        title: newItem.title,
        content: newItem.content,
        type: newItem.type,
        description: newItem.description || null,
        agentId: null,
        createdAt: newItem.createdAt,
        updatedAt: newItem.updatedAt
      });
    }
    
    return Promise.reject("Cannot add knowledge item - missing agent ID");
  };

  const handleUpdateKnowledgeItem = async (item: { id: string; title?: string; content?: any; description?: string }) => {
    if (mode === "edit") {
      return updateKnowledgeItem(item);
    } else if (mode === "create") {
      // For items not yet saved to database, update in local state
      if (item.id.startsWith('temp-')) {
        setTempKnowledgeItems(prev => prev.map(tempItem => {
          if (tempItem.id === item.id) {
            return { ...tempItem, ...item };
          }
          return tempItem;
        }));
        
        // Return a promise that resolves with the updated item for UI consistency
        const updatedItem: KnowledgeItem = {
          id: item.id,
          title: item.title || '', // Use empty string as fallback
          content: item.content || '',
          type: 'text', // Default type
          description: item.description || null,
          agentId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return Promise.resolve(updatedItem);
      }
    }
    
    return Promise.reject("Cannot update knowledge item");
  };

  const handleDeleteKnowledgeItem = async (id: string) => {
    if (mode === "edit") {
      return deleteKnowledgeItem(id);
    } else if (mode === "create") {
      // For items not yet saved to database, remove from local state
      if (id.startsWith('temp-')) {
        setTempKnowledgeItems(prev => prev.filter(item => item.id !== id));
        return Promise.resolve({ success: true });
      }
    }
    
    return Promise.reject("Cannot delete knowledge item");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 mx-auto overflow-hidden">
      {/* Main Card - Basic Info */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-4 sm:gap-0">
          <div>
            <CardTitle className="text-2xl font-bold">
              {mode === 'create' ? 'Create New Agent' : 'Edit Agent'}
            </CardTitle>
            <CardDescription>
              {mode === 'create' ? 'Configure your new AI agent' : 'Update your AI agent settings'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {mode === 'edit' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      disabled={isPending}
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
                          startTransition(async () => {
                            try {
                              if (initialData?.id) {
                                await deleteAgent(initialData.id);
                                toast.success('Agent deleted successfully');
                                router.push('/');
                              }
                            } catch (error) {
                              toast.error('Failed to delete agent. Please try again.');
                            }
                          });
                        }
                      }}
                    >
                      {isPending ? 'Deleting...' : 'Delete Agent'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Permanently delete this agent</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button 
              type="submit" 
              size="sm"
              className="px-6"
              disabled={isPending || !primaryModelId}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>{mode === 'create' ? 'Create' : 'Update'} Agent</>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
            {/* Image Upload Area with 4:3 aspect ratio - Now using child component */}
            <div className="col-span-1 md:col-span-2">
              <AgentImageUploader
                imageUrl={thumbnailUrl}
                setImageUrl={setthumbnailUrl}
                agentId={initialData?.id}
              />
            </div>

            {/* Right Column - Basic Information - Improved layout */}
            <div className="col-span-1 md:col-span-4 space-y-6">
              {/* Basic Agent Details */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <Label htmlFor="agentDisplayName" className="text-sm font-medium flex items-center gap-1.5">
                      Agent Name
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="size-3.5 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[250px]">
                            <p>The name of your agent as displayed to users.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      id="agentDisplayName"
                      name="agentDisplayName"
                      required
                      placeholder="Enter a name for your agent"
                      defaultValue={initialData?.agentDisplayName || ""}
                      className="mt-2"
                      ref={agentNameRef}
                      onChange={(e) => handleFormValueChange('title', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5">
                      Description
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="size-3.5 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[250px]">
                            <p>A brief description of what your agent does.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe what your agent does"
                      defaultValue={initialData?.description || ""}
                      className="mt-2 min-h-24"
                      ref={descriptionRef}
                      onChange={(e) => handleFormValueChange('description', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Appearance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="visibility" className="text-sm font-medium flex items-center gap-1.5">
                      Visibility
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="size-3.5 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[250px]">
                            <p>Controls who can see and use your agent.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Select name="visibility" defaultValue={initialData?.visibility || "public"}>
                      <SelectTrigger id="visibility" className="mt-2">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public (Everyone can see)</SelectItem>
                        <SelectItem value="private">Private (Only you can see)</SelectItem>
                        <SelectItem value="link">Link sharing (Anyone with the link)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Models Section */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-lg font-semibold">AI Models</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>Select the AI models that will power your agent. The primary model will be used by default, with alternates available as fallbacks.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
              Required
            </Badge>
          </div>
          <CardDescription>
            Choose the primary model and optional alternate models for your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ModelSelectorSection
            models={models}
            primaryModelId={primaryModelId}
            alternateModelIds={alternateModelIds}
            onPrimaryModelChange={setPrimaryModelId}
            onAlternateModelsChange={setAlternateModelIds}
          />
        </CardContent>
      </Card>

      {/* Tool Groups Section */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Tool Groups</CardTitle>
          <CardDescription>
            Enable specific tools and capabilities for your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ToolGroupSelector
            toolGroups={toolGroups}
            selectedToolGroupIds={selectedToolGroupIds}
            onChange={setSelectedToolGroupIds}
          />
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Tags</CardTitle>
          <CardDescription>
            Add tags to help users discover your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedTags.map(tag => (
              <Badge 
                key={tag.id} 
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1.5 text-sm"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 rounded-full outline-none hover:text-red-500 focus:ring-2 focus:ring-primary"
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
          <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                type="button"
                aria-expanded={tagPopoverOpen}
                className="justify-between w-full bg-background"
              >
                <span>Add tags...</span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search or create tags..." 
                  value={newTagInput}
                  onValueChange={handleTagInputChange}
                />
                <CommandList>
                  <CommandEmpty>
                    {newTagInput.trim() !== "" && (
                      <CommandItem
                        value={`create-${newTagInput}`}
                        className="flex items-center gap-2 cursor-pointer"
                        onSelect={handleAddNewTag}
                      >
                        <PlusCircle className="size-4" />
                        <span>Create &quot;{newTagInput}&quot;</span>
                      </CommandItem>
                    )}
                    {newTagInput.trim() === "" && (
                      <p className="py-3 px-4 text-sm text-muted-foreground">
                        No tags found. Type to create a new tag.
                      </p>
                    )}
                  </CommandEmpty>
                  <CommandGroup heading="Available Tags">
                    {tags
                      .filter(tag => 
                        tag.name.toLowerCase().includes(newTagInput.toLowerCase()) &&
                        !selectedTags.some(selected => selected.id === tag.id)
                      )
                      .map(tag => (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleSelectTag(tag)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <span>{tag.name}</span>
                          <Check
                            className={`size-4 ${
                              selectedTags.some(selected => selected.id === tag.id)
                                ? "opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground mt-3">
            Tags help users find your agent. You can add existing tags or create new ones.
          </p>
        </CardContent>
      </Card>

      {/* System Prompt Section */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-lg font-semibold">System Prompt</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>The system prompt defines how your agent behaves. Be specific about its role, knowledge, and preferred response style.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900">
              Required
            </Badge>
          </div>
          <CardDescription>
            Define how your agent should behave and respond
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
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
        </CardContent>
      </Card>

      {/* Welcome Screen Customization */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Customize Welcome Screen</CardTitle>
          <CardDescription>
            Personalize what users see when they first interact with your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <OverviewEditor 
            overview={overviewCustomization} 
            onChange={setOverviewCustomization} 
          />
        </CardContent>
      </Card>

      {/* Prompt Suggestions */}
      <Card className="shadow-sm border-2">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-lg font-semibold">Prompt Suggestions</CardTitle>
          <CardDescription>
            Add example prompts to help users get started with your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <PromptSuggestionEditor
            agentId={initialData?.id}
            onChange={setSuggestedPrompts}
            formValues={formValues}
          />
        </CardContent>
      </Card>

      {/* Knowledge Base Section - Only show in edit mode since we need an agent ID */}

        <Card className="shadow-sm border-2">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg font-semibold">Knowledge Base</CardTitle>
            <CardDescription>
              Add knowledge items that your agent can reference during conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <KnowledgeEditor
              knowledgeItems={mode === "edit" ? (knowledgeItems || []) : tempKnowledgeItems.map((item, index) => ({
                id: item.id || `temp-${index}`,
                title: item.title,
                content: item.content,
                type: item.type || 'text',
                description: item.description || null,
                agentId: null,
                createdAt: new Date(),
                updatedAt: new Date()
              }))}
              agentId={initialData?.id}
              onAddItem={handleAddKnowledgeItem}
              onUpdateItem={handleUpdateKnowledgeItem}
              onDeleteItem={handleDeleteKnowledgeItem}
            />
          </CardContent>
        </Card>

      {/* Form Footer */}
      <div className="flex justify-between bg-slate-50 dark:bg-slate-900/40 p-5 rounded-lg border">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push('/')}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isPending || !primaryModelId}
          className="min-w-[120px]"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>{mode === 'create' ? 'Create' : 'Update'} Agent</>
          )}
        </Button>
      </div>
      <input type="hidden" name="userId" value={userId || ''} />
    </form>
  );
} 