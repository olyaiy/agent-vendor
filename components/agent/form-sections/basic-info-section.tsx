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
    <div className="grid grid-cols-1 md:grid-cols-6 gap-8 w-full">
      {/* Image Upload Area */}
      <div className="col-span-1 md:col-span-2">
        <AgentImageUploader
          imageUrl={thumbnailUrl}
          setImageUrl={setThumbnailUrl}
          agentId={initialData?.id}
        />
      </div>

      {/* Right Column - Basic Information */}
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
        <AppearanceSection initialVisibility={initialData?.visibility || "public"} />
      </div>
    </div>
  );
} 