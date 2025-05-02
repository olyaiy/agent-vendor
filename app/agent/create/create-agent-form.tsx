"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
// Removed Select imports, will use ModelSelect
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModelSelect } from "@/components/model-select"; // Import ModelSelect
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Added Tabs
import { Loader2  } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MultipleSelector, { Option } from "@/components/ui/multiselect"; // Import MultipleSelector and Option type
import {
  createAgent,

  uploadAgentImageAction, // Added
  // removeAgentImageAction, // Add if implementing remove before save
} from "@/db/actions/agent.actions";
import { InfoCircledIcon, ChevronRightIcon, DiscIcon } from '@radix-ui/react-icons';
import { VisibilitySelector } from "@/components/visibility-selector";
import { AgentImage } from "@/components/agent-image";
import { AgentAvatar } from "@/components/agent-avatar"; // Added AgentAvatar
import { FormSection } from "@/components/form-section";
import { updateAgentTagsAction } from "@/db/actions/tag.actions";
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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null); // Holds preview URL
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Holds preview URL
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null); // Holds the actual file
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // Holds the actual file
  const [primaryModelId, setPrimaryModelId] = useState<string>("");
  const [visibility, setVisibility] = useState<"public" | "private" | "link">("public");
  const [selectedTags, setSelectedTags] = useState<Option[]>([]); // State for selected tags
  const [imageType, setImageType] = useState<'thumbnail' | 'avatar'>('thumbnail'); // State for tabs
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false); // Loading state for upload button
  const [isRemovingThumbnail, setIsRemovingThumbnail] = useState(false); // Loading state for remove button (client-side)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false); // Loading state for upload button
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false); // Loading state for remove button (client-side)
  
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

  // Cleanup object URLs on unmount or when file changes
  useEffect(() => {
    // This effect handles cleanup of the temporary blob URLs
    const thumbUrl = thumbnailUrl;
    const avUrl = avatarUrl;
    return () => {
      if (thumbUrl && thumbUrl.startsWith('blob:')) {
        URL.revokeObjectURL(thumbUrl);
      }
      if (avUrl && avUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avUrl);
      }
    };
  }, [thumbnailUrl, avatarUrl]); // Rerun only if the URLs themselves change

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
      let newAgentId: string | null = null;
      try {
        // 1. Create agent data object (without image URLs initially)
        const newAgentData = {
          name: formData.get("agentDisplayName") as string,
          description: (formData.get("description") as string) || null,
          slug: null, // Add slug property, backend will generate it
          systemPrompt: (formData.get("systemPrompt") as string) || null,
          thumbnailUrl: null, // Set to null initially, will be updated after upload
          visibility: visibility,
          primaryModelId: primaryModelId,
          creatorId: userId,
          welcomeMessage: null,
          avatarUrl: null, // Set to null initially
        };

        // 2. Use the server action to create the agent
        const agentCreateResult = await createAgent(newAgentData);

        if (!agentCreateResult.success) {
          throw new Error(agentCreateResult.error || "Failed to create agent");
        }
        if (!agentCreateResult.data || !agentCreateResult.data[0]) {
          throw new Error("Failed to create agent");
        }

        const newAgent = agentCreateResult.data[0];
        newAgentId = newAgent.id; // Store the ID for potential image upload
        toast.success("Agent created successfully. Processing image and tags...");

        // 3. Prepare image upload and tag update promises
        const uploadPromises: Promise<unknown>[] = [];

        // Add thumbnail upload promise if a file is selected
        if (thumbnailFile) {
          const imageFormData = new FormData();
          imageFormData.append("file", thumbnailFile);
          setIsUploadingThumbnail(true); // Set loading state for button feedback
          uploadPromises.push(
            uploadAgentImageAction(newAgentId, imageFormData, 'thumbnail')
              .finally(() => setIsUploadingThumbnail(false)) // Reset loading state
          );
        }

        // Add avatar upload promise if a file is selected
        if (avatarFile) {
          const imageFormData = new FormData();
          imageFormData.append("file", avatarFile);
          setIsUploadingAvatar(true); // Set loading state for button feedback
          uploadPromises.push(
            uploadAgentImageAction(newAgentId, imageFormData, 'avatar')
              .finally(() => setIsUploadingAvatar(false)) // Reset loading state
          );
        }

        // Add tag update promise if tags are selected
        if (selectedTags.length > 0) {
          uploadPromises.push(
            updateAgentTagsAction(newAgentId, selectedTags.map(tag => tag.value))
          );
        }

        // 4. Execute image uploads and tag updates concurrently
        if (uploadPromises.length > 0) {
          const results = await Promise.allSettled(uploadPromises);

          // 5. Process results and show appropriate toasts
          let imageSuccess = true;
          let tagSuccess = true;
          let imageErrorMsg = "";
          let tagErrorMsg = "";

          results.forEach((result, index) => {
            // Determine if the promise was for an image or tags based on order/content
            const isTagPromise = index === uploadPromises.length - 1 && selectedTags.length > 0 && (!thumbnailFile && !avatarFile || index > 0); // Heuristic: last promise if tags exist

            if (result.status === 'rejected') {
              const error = result.reason as Error;
              if (isTagPromise) {
                tagSuccess = false;
                tagErrorMsg = error.message || "Failed to update tags";
              } else {
                imageSuccess = false;
                imageErrorMsg = error.message || "Failed to upload image";
              }
            } else if (result.status === 'fulfilled') {
              const actionResult = result.value as { success: boolean; error?: string; url?: string };
              if (!actionResult.success) {
                 if (isTagPromise) {
                    tagSuccess = false;
                    tagErrorMsg = actionResult.error || "Failed to update tags";
                 } else {
                    imageSuccess = false;
                    imageErrorMsg = actionResult.error || "Failed to upload image";
                 }
              }
            }
          });

          // Show combined toast messages
          if (imageSuccess && tagSuccess) {
            toast.success("Image and tags processed successfully.");
          } else {
            const warnings = [];
            if (!imageSuccess) warnings.push(`Image upload failed: ${imageErrorMsg}`);
            if (!tagSuccess) warnings.push(`Tag assignment failed: ${tagErrorMsg}`);
            toast.warning(`Agent created, but: ${warnings.join('. ')}. You can manage these in settings.`);
          }
        } else {
          toast.info("No image or tags to process."); // Or just let the initial success message stand
        }

        // 6. Redirect to the new agent's page regardless of image/tag success
        router.push(`/${newAgentId}`);

      } catch (error) {
        // Catch errors from agent creation or unexpected issues
        toast.error(`Failed to create agent: ${(error as Error).message}`);
        console.error("Agent creation process error:", error);
        // Reset loading states if an error occurred before upload started
        setIsUploadingThumbnail(false);
        setIsUploadingAvatar(false);
      }
    });
  };

  // --- Image Handlers ---
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imgType: 'thumbnail' | 'avatar'
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

    // Revoke previous object URL if exists
    if (imgType === 'thumbnail' && thumbnailUrl && thumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailUrl);
    }
    if (imgType === 'avatar' && avatarUrl && avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl);
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);

    if (imgType === 'thumbnail') {
      setThumbnailFile(file);
      setThumbnailUrl(previewUrl);
      // Clear avatar if setting thumbnail
      setAvatarFile(null);
      if (avatarUrl && avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(null);
    } else {
      setAvatarFile(file);
      setAvatarUrl(previewUrl);
      // Clear thumbnail if setting avatar
      setThumbnailFile(null);
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl);
      setThumbnailUrl(null);
    }
     event.target.value = ''; // Reset input value after processing
  };

  const handleRemoveImage = (imgType: 'thumbnail' | 'avatar') => {
    // Simulate removing state for button feedback (client-side only before save)
    const setLoading = imgType === 'thumbnail' ? setIsRemovingThumbnail : setIsRemovingAvatar;
    setLoading(true);

    if (imgType === 'thumbnail') {
      if (thumbnailUrl && thumbnailUrl.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailUrl);
      }
      setThumbnailFile(null);
      setThumbnailUrl(null);
    } else {
       if (avatarUrl && avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl);
      }
      setAvatarFile(null);
      setAvatarUrl(null);
    }
    // Reset loading state after a short delay to show spinner
    setTimeout(() => setLoading(false), 300);
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
                  <div className="relative size-full aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30" onClick={() => !thumbnailUrl && thumbnailInputRef.current?.click()}>
                    <AgentImage
                      thumbnailUrl={thumbnailUrl} // Use state value (preview URL)
                      // Use a placeholder ID for gradient generation when no image is set.
                      agentId="new-agent-placeholder" // Agent ID not available yet
                    />
                    {/* Add upload hint */}
                    {!thumbnailUrl && !isUploadingThumbnail && ( // Hide hint during upload simulation
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
                         <p className="mt-1 text-xs text-white font-medium">Set Thumbnail</p>
                         <p className="text-xs text-white/80">Click to upload</p>
                      </div>
                    )}
                    {/* Show loader during simulated upload */}
                    {isUploadingThumbnail && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                         <Loader2 className="size-6 animate-spin text-white" />
                       </div>
                    )}
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
                          disabled={isRemovingThumbnail || isUploadingThumbnail} // Disable during simulated actions
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
                          disabled={isUploadingThumbnail || isRemovingThumbnail} // Disable during simulated actions
                        >
                           {/* No loader here, handled by overlay */}
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
                        disabled={isUploadingThumbnail || isRemovingThumbnail} // Disable during simulated actions
                      >
                        {/* No loader here, handled by overlay */}
                        Upload New Thumbnail
                      </Button>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="avatar">
                  <div className="relative size-full aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30" onClick={() => !avatarUrl && avatarInputRef.current?.click()}>
                    {/* Display AgentAvatar centered */}
                    <AgentAvatar
                      avatarUrl={avatarUrl} // Use state value (preview URL)
                      agentId="new-agent-placeholder" // Agent ID not available yet
                      size={100} // Example size, adjust as needed
                    />
                    {/* Add upload hint */}
                     {!avatarUrl && !isUploadingAvatar && ( // Hide hint during upload simulation
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="mt-1 text-xs text-white font-medium">Set Avatar</p>
                        <p className="text-xs text-white/80">Click to upload</p>
                      </div>
                    )}
                     {/* Show loader during simulated upload */}
                     {isUploadingAvatar && (
                       <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                         <Loader2 className="size-6 animate-spin text-white" />
                       </div>
                    )}
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
                          disabled={isRemovingAvatar || isUploadingAvatar} // Disable during simulated actions
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
                          disabled={isUploadingAvatar || isRemovingAvatar} // Disable during simulated actions
                        >
                          {/* No loader here, handled by overlay */}
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
                        disabled={isUploadingAvatar || isRemovingAvatar} // Disable during simulated actions
                      >
                        {/* No loader here, handled by overlay */}
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