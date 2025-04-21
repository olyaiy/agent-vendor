"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ModelSelect } from "@/components/model-select"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MultipleSelector, { Option } from "@/components/ui/multiselect"; 
import {
  updateAgentAction,
  addKnowledgeItemAction,
  updateKnowledgeItemAction,
  deleteKnowledgeItemAction,
  updateAgentTagsAction, 
  uploadAgentImageAction, 
  removeAgentImageAction, 
} from "@/db/actions/agent-actions";
import { InfoCircledIcon, ChevronRightIcon, DiscIcon, ChatBubbleIcon } from '@radix-ui/react-icons';
import { VisibilitySelector } from "@/components/visibility-selector";
import { AgentImage } from "@/components/agent-image";
import { AgentAvatar } from "@/components/agent-avatar"; 
import { FormSection } from "@/components/form-section";
import { KnowledgeSection } from "@/components/knowledge-section"; 
import { Agent, Knowledge } from "@/db/schema/agent";
import { FullscreenIcon } from "@/components/utils/icons";

export interface ModelInfo {
  id: string;
  model: string;
  description: string | null;
}

interface EditAgentFormProps {
  agent: Agent; // Accept agent data
  models: ModelInfo[];
  knowledge: Knowledge[];
  allTags: Option[]; // Add prop for all available tags
  currentTags: Option[]; // Add prop for currently selected tags
}

function ExitFullscreenIcon({ size = 16 }: { size?: number }) {
  return (
    <svg height={size} width={size} viewBox="0 0 16 16" style={{ color: 'currentcolor' }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 10.75V13.5H5.25V15H2C1.44772 15 1 14.5523 1 14V10.75H2.5ZM13.5 10.75V13.5H10.75V15H14C14.5523 15 15 14.5523 15 14V10.75H13.5ZM2.5 5.25V2.5H5.25V1H2C1.44772 1 1 1.44772 1 2V5.25H2.5ZM13.5 5.25V2.5H10.75V1H14C14.5523 1 15 1.44772 15 2V5.25H13.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EditAgentForm({ agent, models, knowledge: initialKnowledge, allTags, currentTags }: EditAgentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isKnowledgeSubmitting, startKnowledgeTransition] = useTransition(); // Separate transition for knowledge actions

  // Form state initialized with agent data
  // Form state
  // Form state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(agent.thumbnailUrl); // TODO: Implement image upload
  const [avatarUrl, setAvatarUrl] = useState<string | null>(agent.avatarUrl); // Added avatarUrl state // TODO: Implement image upload
  const [primaryModelId, setPrimaryModelId] = useState<string>(agent.primaryModelId);
  const [visibility, setVisibility] = useState<"public" | "private" | "link">(agent.visibility as "public" | "private" | "link");
  const [knowledgeItems, setKnowledgeItems] = useState<Knowledge[]>(initialKnowledge);
  const [selectedTags, setSelectedTags] = useState<Option[]>(currentTags); // State for selected tags
  const [imageType, setImageType] = useState<'thumbnail' | 'avatar'>('thumbnail'); // State for tabs
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isRemovingThumbnail, setIsRemovingThumbnail] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Add expand/collapse state for system prompt textarea
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);
  const [showExpandToggle, setShowExpandToggle] = useState(false);

  // Refs
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
    if (systemPromptRef.current) {
      const text = systemPromptRef.current.value || '';
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 500) {
        setShowExpandToggle(true);
      }
    }
  }, [agent.systemPrompt]);

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
      let agentUpdateSuccess = false;
      let tagUpdateSuccess = false;

      try {
        // --- Prepare Agent Data ---
        const updatedAgentData = {
          name: formData.get("agentDisplayName") as string,
          description: (formData.get("description") as string) || null,
          systemPrompt: (formData.get("systemPrompt") as string) || null,
          thumbnailUrl: thumbnailUrl, // Use state value
          avatarUrl: avatarUrl, // Use state value
          visibility: visibility,
          primaryModelId: primaryModelId,
        };

        // --- Prepare Tag Data ---
        const tagIdsToUpdate = selectedTags.map(tag => tag.value);

        // --- Execute Updates Concurrently ---
        const [agentUpdateResult, tagUpdateResult] = await Promise.all([
          updateAgentAction(agent.id, updatedAgentData),
          updateAgentTagsAction(agent.id, tagIdsToUpdate)
        ]);

        // --- Handle Results ---
        if (agentUpdateResult.success) {
          agentUpdateSuccess = true;
        } else {
          console.error("Agent update failed:", agentUpdateResult.error);
          // Throw or handle specific agent update error if needed immediately
        }

        if (tagUpdateResult.success) {
          tagUpdateSuccess = true;
        } else {
          console.error("Tag update failed:", tagUpdateResult.error);
          // Handle tag update error - maybe just log or show a specific warning
        }

        // --- Show Toasts Based on Success ---
        if (agentUpdateSuccess && tagUpdateSuccess) {
          toast.success("Agent and tags updated successfully.");
        } else if (agentUpdateSuccess) {
          toast.warning("Agent details saved, but failed to update tags. Please try saving again.");
        } else if (tagUpdateSuccess) {
          // This case is less likely if agent update fails first, but handle it
          toast.warning("Agent tags updated, but failed to save other agent details.");
        } else {
          // Both failed
          toast.error("Failed to update agent details and tags.");
          // Optionally throw an error here if you want the catch block to handle it
          // throw new Error("Agent and tag updates failed.");
        }

        // Refresh data if at least one update was successful
        if (agentUpdateSuccess || tagUpdateSuccess) {
          router.refresh();
        }

      } catch (error) {
        // Catch errors from Promise.all or explicitly thrown errors
        toast.error(`An unexpected error occurred: ${(error as Error).message}`);
        console.error("Agent update process failed:", error);
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
            throw new Error(!result.success && result.error ? result.error : "Failed to add knowledge item");
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
            throw new Error(!result.success && result.error ? result.error : "Failed to update knowledge item");
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


  // --- Image Handlers ---
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'thumbnail' | 'avatar'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Only JPG, PNG, and WEBP are allowed.");
      event.target.value = ''; // Reset input
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
       event.target.value = ''; // Reset input
      return;
    }

    const setLoading = imageType === 'thumbnail' ? setIsUploadingThumbnail : setIsUploadingAvatar;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadAgentImageAction(agent.id, formData, imageType);
      if (result.success && result.data.url) {
        if (imageType === 'thumbnail') {
          setThumbnailUrl(result.data.url);
        } else {
          setAvatarUrl(result.data.url);
        }
        toast.success(`${imageType === 'thumbnail' ? 'Thumbnail' : 'Avatar'} uploaded successfully.`);
      } else {
        throw new Error(!result.success && result.error ? result.error : `Failed to upload ${imageType}`);
      }
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error);
      toast.error(`Failed to upload ${imageType}: ${(error as Error).message}`);
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input value regardless of success/failure
    }
  };

  const handleRemoveImage = async (imageType: 'thumbnail' | 'avatar') => {
    const setLoading = imageType === 'thumbnail' ? setIsRemovingThumbnail : setIsRemovingAvatar;
    setLoading(true);

    try {
      const result = await removeAgentImageAction(agent.id, imageType);
      if (result.success) {
        if (imageType === 'thumbnail') {
          setThumbnailUrl(null);
        } else {
          setAvatarUrl(null);
        }
        toast.success(`${imageType === 'thumbnail' ? 'Thumbnail' : 'Avatar'} removed successfully.`);
      } else {
        throw new Error(result.error || `Failed to remove ${imageType}`);
      }
    } catch (error) {
      console.error(`Error removing ${imageType}:`, error);
      toast.error(`Failed to remove ${imageType}: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };


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
              {/* Hidden file inputs */}
               <input
                  type="file"
                  ref={thumbnailInputRef}
                  onChange={(e) => handleFileChange(e, 'thumbnail')}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />
              <Tabs value={imageType} onValueChange={(value: string) => setImageType(value as 'thumbnail' | 'avatar')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9 mb-2">
                  <TabsTrigger value="thumbnail" className="text-xs h-7">Thumbnail</TabsTrigger>
                  <TabsTrigger value="avatar" className="text-xs h-7">Avatar</TabsTrigger>
                </TabsList>
                <TabsContent value="thumbnail">
                  <div className="relative size-full aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                    <AgentImage
                      thumbnailUrl={thumbnailUrl} // Use state value
                      agentId={agent.id} // Use actual agentId
                    />
                    {/* Add upload hint if needed */}
                  </div>
                  {/* Buttons for Thumbnail */}
                  <div className="mt-2 flex flex-col gap-2">
                    {thumbnailUrl ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="flex-1 text-xs h-7 gap-1"
                          onClick={() => handleRemoveImage('thumbnail')}
                          disabled={isRemovingThumbnail || isUploadingThumbnail}
                        >
                          {isRemovingThumbnail ? <Loader2 className="size-3 animate-spin" /> : null}
                          Remove Thumbnail
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-7 gap-1"
                          onClick={() => thumbnailInputRef.current?.click()}
                          disabled={isUploadingThumbnail || isRemovingThumbnail}
                        >
                           {isUploadingThumbnail ? <Loader2 className="size-3 animate-spin" /> : null}
                          Change Thumbnail
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 gap-1"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={isUploadingThumbnail || isRemovingThumbnail}
                      >
                        {isUploadingThumbnail ? <Loader2 className="size-3 animate-spin" /> : null}
                        Upload New Thumbnail
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="avatar">
                  <div className="relative size-full aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                    {/* Display AgentAvatar centered, assuming it handles its own size */}
                    <AgentAvatar
                      avatarUrl={avatarUrl} // Use state value
                      agentId={agent.id}
                      size={100} // Example size, adjust as needed
                    />
                    {/* Add upload hint if needed */}
                  </div>
                   {/* Buttons for Avatar */}
                   <div className="mt-2 flex flex-col gap-2">
                    {avatarUrl ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="flex-1 text-xs h-7 gap-1"
                          onClick={() => handleRemoveImage('avatar')}
                          disabled={isRemovingAvatar || isUploadingAvatar}
                        >
                          {isRemovingAvatar ? <Loader2 className="size-3 animate-spin" /> : null}
                          Remove Avatar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-7 gap-1"
                          onClick={() => avatarInputRef.current?.click()}
                          disabled={isUploadingAvatar || isRemovingAvatar}
                        >
                          {isUploadingAvatar ? <Loader2 className="size-3 animate-spin" /> : null}
                          Change Avatar
                        </Button>
                      </div>
                    ) : (
                       <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 gap-1"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar || isRemovingAvatar}
                      >
                        {isUploadingAvatar ? <Loader2 className="size-3 animate-spin" /> : null}
                        Upload New Avatar
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
                    defaultOptions={allTags} // Provide all tags as options
                    placeholder="Select tags..."
                    emptyIndicator={
                        <p className="text-center text-sm leading-10 text-muted-foreground">
                            No tags found. Create tags in the Admin panel.
                        </p>
                    }
                    // Optional: Add maxSelected or other props if needed
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
              {/* Replace standard Select with ModelSelect */}
              <ModelSelect
                models={models}
                defaultValue={primaryModelId} // Use state value for default
                onValueChange={setPrimaryModelId} // Use state setter for changes
              />
              {/* The trigger styling is now handled within ModelSelect */}
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
              <div className="bg-secondary/50 border rounded-lg p-0.5 relative">
                {showExpandToggle && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 text-xs h-7 px-2 flex items-center gap-1"
                    onClick={() => setIsSystemPromptExpanded(prev => !prev)}
                    aria-label={isSystemPromptExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isSystemPromptExpanded ? (
                      <ExitFullscreenIcon size={16} />
                    ) : (
                      <FullscreenIcon size={16} />
                    )}
                    {isSystemPromptExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                )}
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  placeholder="e.g. You are a friendly assistant! Keep your responses concise and helpful."
                  className={`min-h-[180px] font-mono text-sm leading-relaxed bg-background border-0 focus-visible:ring-1 focus-visible:ring-offset-0 resize-none ${showExpandToggle && !isSystemPromptExpanded ? 'max-h-[300px] overflow-auto' : ''}`}
                  required
                  ref={systemPromptRef}
                  onInput={adjustSystemPromptHeight}
                  defaultValue={agent.systemPrompt || ""}
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
            onClick={() => router.push(`/${agent.id}`)} // Navigate back to agent page
            className="w-28 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary" // Use secondary variant
            onClick={() => router.push(`/${agent.id}`)} // Navigate to agent chat page
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
    </form>
  );
}
