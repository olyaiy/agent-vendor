"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Info, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentBasicInfoSectionProps {
  name: string;
  description: string;
  isNameFocused: boolean;
  isDescFocused: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onNameFocus: () => void;
  onNameBlur: () => void;
  onDescFocus: () => void;
  onDescBlur: () => void;
}

export default function AgentBasicInfoSection({ 
  name, 
  description, 
  isNameFocused, 
  isDescFocused,
  onNameChange,
  onDescriptionChange,
  onNameFocus,
  onNameBlur,
  onDescFocus,
  onDescBlur
}: AgentBasicInfoSectionProps) {
  const nameCharLimit = 50;
  const descCharLimit = 300;
  const descCharsRemaining = descCharLimit - description.length;
  
  return (
    <Card className="border border-muted-foreground/10 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="size-4 text-primary" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Define how your agent will appear to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label htmlFor="agentDisplayName" className="text-sm font-medium">
                Agent Name <span className="text-red-500">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-80">
                    <p>This is the name users will see when interacting with your agent</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className={`text-xs ${name.length > nameCharLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
              {name.length}/{nameCharLimit}
            </span>
          </div>
          <div className="relative">
            <Input
              id="agentDisplayName"
              name="agentDisplayName"
              placeholder="e.g., Research Assistant, Coding Helper"
              value={name}
              className={`${
                isNameFocused
                  ? name.length > 0 && name.length <= nameCharLimit
                    ? "border-primary ring-1 ring-primary"
                    : name.length > nameCharLimit
                    ? "border-red-500 ring-1 ring-red-500"
                    : ""
                  : ""
              }`}
              onChange={(e) => onNameChange(e.target.value)}
              onFocus={onNameFocus}
              onBlur={onNameBlur}
              autoComplete="off"
              maxLength={nameCharLimit + 10} // Allow a little extra for user experience
              required
            />
            {name.length > nameCharLimit && (
              <p className="mt-1 text-xs text-red-500">
                Name is too long. Please use {nameCharLimit} characters or less.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-80">
                    <p>A brief description of what your agent does and how it can help users</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span 
              className={`text-xs ${descCharsRemaining < 0 ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              {description.length}/{descCharLimit}
            </span>
          </div>
          <div>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe what your agent does and how it can help users..."
              className={`min-h-24 resize-y ${
                isDescFocused
                  ? description.length <= descCharLimit
                    ? "border-primary/50 ring-1 ring-primary/50"
                    : "border-red-500 ring-1 ring-red-500"
                  : ""
              }`}
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              onFocus={onDescFocus}
              onBlur={onDescBlur}
              maxLength={descCharLimit + 50} // Allow a little extra for user experience
            />
            {descCharsRemaining < 0 && (
              <p className="mt-1 text-xs text-red-500">
                Description is too long. Please use {descCharLimit} characters or less.
              </p>
            )}
            {descCharsRemaining >= 0 && description.length > 0 && description.length < 30 && (
              <p className="mt-1 text-xs text-amber-500">
                Consider adding a more detailed description (at least 30 characters).
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 