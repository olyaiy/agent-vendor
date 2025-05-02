"use client";

import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AgentImage } from '@/components/agent-image';
import { AgentAvatar } from '@/components/agent-avatar';
import { Tooltip, TooltipContent } from '@/components/ui/tooltip';
import { FormSection } from '@/components/form-section';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TooltipTrigger } from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Agent } from '@/db/schema/agent';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { VisibilitySelector } from '@/components/visibility-selector';
import { Textarea } from '@/components/ui/textarea';
import { updateAgentAction, uploadAgentImageAction, removeAgentImageAction } from '@/db/actions/agent.actions';

interface AgentInfoFormProps {
  agent: Agent;
}

const AgentInfoForm = ({ agent }: AgentInfoFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Form state initialized with agent data
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(agent.thumbnailUrl);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(agent.avatarUrl);
  const [visibility, setVisibility] = useState<"public" | "private" | "link">(
    agent.visibility as "public" | "private" | "link"
  );
  
  // Image upload states
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isRemovingThumbnail, setIsRemovingThumbnail] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  // Refs for file inputs
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        // Prepare updated agent data
        const updatedAgentData = {
          name: formData.get("agentDisplayName") as string,
          description: (formData.get("description") as string) || null,
          thumbnailUrl,
          avatarUrl,
          visibility,
        };

        // Execute update
        const result = await updateAgentAction(agent.id, updatedAgentData);

        if (result.success) {
          toast.success("Agent updated successfully.");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update agent.");
        }
      } catch (error) {
        toast.error(`An unexpected error occurred: ${(error as Error).message}`);
        console.error("Agent update failed:", error);
      }
    });
  };

  // Image handlers
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
    <form onSubmit={handleSubmit}>
      <FormSection title="Agent Info" description="Basic information about your agent.">
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
              
              <div className="flex flex-row gap-4">
                {/* Thumbnail Section */}
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Thumbnail</p>
                  <div className="relative aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                    <AgentImage
                      thumbnailUrl={thumbnailUrl}
                      agentId={agent.id}
                    />
                  </div>
                  {/* Buttons for Thumbnail */}
                  <div className="flex flex-col gap-2">
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
                          Remove
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
                          Change
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
                        Upload
                      </Button>
                    )}
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">Avatar</p>
                  <div className="relative aspect-square rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                    <AgentAvatar
                      avatarUrl={avatarUrl}
                      agentId={agent.id}
                      size={100}
                    />
                  </div>
                  {/* Buttons for Avatar */}
                  <div className="flex flex-col gap-2">
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
                          Remove
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
                          Change
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
                        Upload
                      </Button>
                    )}
                  </div>
                </div>
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
                defaultValue={agent.name}
              />
            </div>

            {/* Tags Section - Moved here right after agent name */}
            {/* <div className="space-y-4">
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
                {allTags.length > 0 && (
                  <MultipleSelector
                      value={selectedTags}
                      onChange={setSelectedTags}
                      defaultOptions={allTags}
                      placeholder="Select tags..."
                      emptyIndicator={
                          <p className="text-center text-sm leading-10 text-muted-foreground">
                              No tags found. Create tags in the Admin panel.
                          </p>
                      }
                  />
                )}
            </div> */}

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
                defaultValue={agent.description || ""}
              />
            </div>

            <VisibilitySelector
              value={visibility} 
              onValueChange={setVisibility}
            />
            
            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={isPending}
                className="w-36 gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
    </FormSection>
  </form>
  );
};

export default AgentInfoForm;
