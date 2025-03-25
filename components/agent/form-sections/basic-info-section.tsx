"use client";

import React, { useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";
import { AgentImageUploader } from "../agent-image-uploader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, Share } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { InfoIcon } from "@/components/icons/info-icon";

interface BasicInfoSectionProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    agentDisplayName: string;
    description?: string;
    visibility: "public" | "private" | "link";
    avatarUrl?: string | null;
  };
  thumbnailUrl: string | null;
  setThumbnailUrl: (url: string | null) => void;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  handleFormValueChange: (field: "title" | "description" | "systemPrompt" | "visibility", value: string) => void;
}

export function BasicInfoSection({ 
  mode, 
  initialData, 
  thumbnailUrl, 
  setThumbnailUrl,
  avatarUrl,
  setAvatarUrl,
  handleFormValueChange
}: BasicInfoSectionProps) {
  const agentNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [visibility, setVisibility] = useState<"public" | "private" | "link">(initialData?.visibility || "public");
  
  // Visibility options with icons and descriptions
  const visibilityOptions = useMemo(() => [
    {
      id: "private",
      label: "Private",
      description: "Only you can access this agent",
      icon: <Lock className="size-4" />
    },
    {
      id: "public",
      label: "Public",
      description: "Anyone can see and use this agent",
      icon: <Globe className="size-4" />
    },
    {
      id: "link",
      label: "Link sharing",
      description: "Only people with the link can access",
      icon: <Share className="size-4" />
    }
  ], []);

  const handleVisibilityChange = (value: string) => {
    setVisibility(value as "public" | "private" | "link");
    handleFormValueChange("visibility", value);
  };
  
  return (
    <section className="space-y-12 pb-10 pt-8">
      {/* Image and Basic Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Agent Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define your agent&apos;s identity
            </p>
          </div>
          
          <div className="space-y-6">
            <AgentImageUploader
              imageUrl={thumbnailUrl}
              setImageUrl={setThumbnailUrl}
              agentId={initialData?.id}
              label="Agent Thumbnail"
              description="A visual representation of your agent. Good images help users recognize and connect with your agent."
              recommendedSize="800×600px (4:3)"
              imageType="thumbnail"
            />
            
            <Separator className="" />
            
            <div className="flex flex-row items-start">
              <h3 className="text-sm font-medium mb-3 ">Agent Avatar (optional)</h3>
              <AgentImageUploader
                imageUrl={avatarUrl}
                setImageUrl={setAvatarUrl}
                agentId={initialData?.id}
                label=""
                recommendedSize="400×400px (1:1)"
                aspectRatio="aspect-square"
                className="max-w-[100px] mx-auto rounded-full"
                imageClassName="rounded-full"
                imageType="avatar"
              />
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
                      <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
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
              defaultValue={initialData?.agentDisplayName || ""}
              className="h-11"
              ref={agentNameRef}
              onChange={(e) => handleFormValueChange('title', e.target.value)}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-1.5 mb-1.5">
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5">
                Description <span className="text-gray-600 text-xs">(Not Visible to AI)</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
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
              placeholder="Describe what your agent does"
              defaultValue={initialData?.description || ""}
              className="min-h-24 resize-none"
              ref={descriptionRef}
              onChange={(e) => handleFormValueChange('description', e.target.value)}
            />
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4">
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex items-start gap-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  Visibility
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="size-3.5 text-muted-foreground mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[250px]">
                      <p>Control who can see and use your agent.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="bg-secondary/50 border rounded-lg p-2">
              <RadioGroup 
                value={visibility} 
                onValueChange={handleVisibilityChange}
                className="grid grid-cols-3 gap-2"
              >
                {visibilityOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={option.id}
                    className={cn(
                      "flex flex-col items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors h-full",
                      visibility === option.id 
                        ? "bg-background border-primary/30 ring-1 ring-primary/20" 
                        : "hover:bg-background/80"
                    )}
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full",
                        visibility === option.id
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <div className="flex flex-col items-center gap-0.5 text-center">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </div>
                    <RadioGroupItem value={option.id} id={option.id} className="mt-2" />
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 