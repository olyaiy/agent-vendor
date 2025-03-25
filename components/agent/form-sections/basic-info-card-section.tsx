"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BasicInfoSection } from "./basic-info-section";

interface BasicInfoCardSectionProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    agentDisplayName: string;
    description?: string;
    visibility: "public" | "private" | "link";
    agentSlug?: string;
    avatarUrl?: string | null;
  };
  thumbnailUrl: string | null;
  setThumbnailUrl: (url: string | null) => void;
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  isPending: boolean;
  handleFormValueChange: (field: "title" | "description" | "systemPrompt" | "visibility", value: string) => void;
  handleDeleteAgent: () => void;
  primaryModelId: string;
}

export function BasicInfoCardSection({
  mode,
  initialData,
  thumbnailUrl,
  setThumbnailUrl,
  avatarUrl,
  setAvatarUrl,
  isPending,
  handleFormValueChange,
  handleDeleteAgent,
  primaryModelId
}: BasicInfoCardSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header section with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-6 gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New Agent' : 'Edit Agent'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'create' ? 'Configure your new AI agent' : 'Update your AI agent settings'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {mode === 'edit' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    disabled={isPending}
                    onClick={handleDeleteAgent}
                  >
                    {isPending ? 'Deleting...' : 'Delete Agent'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Permanently delete this agent</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
          {mode === 'edit' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/${initialData?.id}`}>
                Chat with Agent
              </a>
            </Button>
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
      </div>
      

      
      {/* Main content */}
      <div className="pt-0">
        <BasicInfoSection 
          mode={mode}
          initialData={initialData}
          thumbnailUrl={thumbnailUrl}
          setThumbnailUrl={setThumbnailUrl}
          avatarUrl={avatarUrl}
          setAvatarUrl={setAvatarUrl}
          handleFormValueChange={handleFormValueChange}
        />
      </div>
    </div>
  );
} 