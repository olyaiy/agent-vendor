"use client";

import React from "react";
import { Agent } from "@/db/schema/agent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import MultipleSelector, { Option } from "@/components/ui/multiselect";
import { VisibilitySelector } from "@/components/visibility-selector";
import { AgentImage } from "@/components/agent-image";
import { AgentAvatar } from "@/components/agent-avatar";
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface AgentInfoFormProps {
  agent: Agent;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  visibility: "public" | "private" | "link";
  setVisibility: React.Dispatch<React.SetStateAction<"public" | "private" | "link">>;
  selectedTags: Option[];
  setSelectedTags: React.Dispatch<React.SetStateAction<Option[]>>;
  allTags: Option[];
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>, imageType: 'thumbnail' | 'avatar') => Promise<void>;
  handleRemoveImage: (imageType: 'thumbnail' | 'avatar') => Promise<void>;
  isUploadingThumbnail: boolean;
  isRemovingThumbnail: boolean;
  isUploadingAvatar: boolean;
  isRemovingAvatar: boolean;
  thumbnailInputRef: React.RefObject<HTMLInputElement>;
  avatarInputRef: React.RefObject<HTMLInputElement>;
  imageType: 'thumbnail' | 'avatar';
  setImageType: React.Dispatch<React.SetStateAction<'thumbnail' | 'avatar'>>;
}

export function AgentInfoForm({
  agent,
  thumbnailUrl,
  avatarUrl,
  visibility,
  setVisibility,
  selectedTags,
  setSelectedTags,
  allTags,
  handleFileChange,
  handleRemoveImage,
  isUploadingThumbnail,
  isRemovingThumbnail,
  isUploadingAvatar,
  isRemovingAvatar,
  thumbnailInputRef,
  avatarInputRef,
  imageType,
  setImageType,
}: AgentInfoFormProps) {
  return (
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
  );
}
