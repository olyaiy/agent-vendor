"use client";

import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BasicInfoSection } from "./basic-info-section";
import { useRouter } from "next/navigation";

interface BasicInfoCardSectionProps {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    agentDisplayName: string;
    description?: string;
    visibility: "public" | "private" | "link";
  };
  thumbnailUrl: string | null;
  setThumbnailUrl: (url: string | null) => void;
  isPending: boolean;
  handleFormValueChange: (field: "title" | "description" | "systemPrompt", value: string) => void;
  handleDeleteAgent: () => void;
  primaryModelId: string;
}

export function BasicInfoCardSection({
  mode,
  initialData,
  thumbnailUrl,
  setThumbnailUrl,
  isPending,
  handleFormValueChange,
  handleDeleteAgent,
  primaryModelId
}: BasicInfoCardSectionProps) {
  return (
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
        <BasicInfoSection 
          mode={mode}
          initialData={initialData}
          thumbnailUrl={thumbnailUrl}
          setThumbnailUrl={setThumbnailUrl}
          handleFormValueChange={handleFormValueChange}
        />
      </CardContent>
    </Card>
  );
} 