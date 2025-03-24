"use client";

import React, { useRef } from "react";
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
import { AlertCircle } from "lucide-react";
import { AgentImageUploader } from "../agent-image-uploader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppearanceSection } from "./appearance-section";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BasicInfoSectionProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    agentDisplayName: string;
    description?: string;
    visibility: "public" | "private" | "link";
  };
  thumbnailUrl: string | null;
  setThumbnailUrl: (url: string | null) => void;
  handleFormValueChange: (field: "title" | "description" | "systemPrompt", value: string) => void;
}

export function BasicInfoSection({ 
  mode, 
  initialData, 
  thumbnailUrl, 
  setThumbnailUrl,
  handleFormValueChange
}: BasicInfoSectionProps) {
  const agentNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  return (
    <section className="space-y-12 pb-10 pt-8">
      {/* Image and Basic Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-4">
          <div className="pb-2 border-b">
            <h2 className="text-lg font-medium tracking-tight">Agent Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Define your agent's identity
            </p>
          </div>
          
          <div className="space-y-3">
            <AgentImageUploader
              imageUrl={thumbnailUrl}
              setImageUrl={setThumbnailUrl}
              agentId={initialData?.id}
            />
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
                  {/* Appearance Settings */}
      <AppearanceSection initialVisibility={initialData?.visibility || "public"} />

          </div>
        </div>
      </div>
      
      
    </section>
  );
} 