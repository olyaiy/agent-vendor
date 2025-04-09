"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircledIcon, LockClosedIcon, GlobeIcon, Share1Icon } from '@radix-ui/react-icons';
import { useState } from "react";

export interface VisibilityOption {
  id: "public" | "private" | "link";
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function VisibilitySelector({
  value,
  onValueChange
}: {
  value: "public" | "private" | "link";
  onValueChange: (value: "public" | "private" | "link") => void;
}) {
  const [visibilityOptions] = useState<VisibilityOption[]>([
    {
      id: "private",
      label: "Private",
      description: "Only you can access this agent",
      icon: <LockClosedIcon className="size-4" />
    },
    {
      id: "public",
      label: "Public",
      description: "Anyone can see and use this agent",
      icon: <GlobeIcon className="size-4" />
    },
    {
      id: "link",
      label: "Link sharing",
      description: "Only people with the link can access",
      icon: <Share1Icon className="size-4" />
    }
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-1.5">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            Visibility
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoCircledIcon className="size-3.5 text-muted-foreground mt-0.5" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p>Control who can see and use your agent.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="bg-secondary/50 border rounded-lg p-2.5 shadow-sm">
        <div className="grid grid-cols-3 gap-2.5">
          {visibilityOptions.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex flex-col items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all",
                "hover:shadow-md hover:border-primary/30",
                "focus-within:ring-2 focus-within:ring-primary/50",
                "active:scale-[0.98]",
                value === option.id 
                  ? "bg-background border-primary/30 ring-1 ring-primary/20 shadow-sm" 
                  : "hover:bg-background/80"
              )}
              onClick={() => onValueChange(option.id)}
            >
              <div className="flex flex-col items-center gap-2.5 w-full">
                <div className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-full transition-colors",
                  value === option.id
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}>
                  {option.icon}
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{option.description}</span>
                </div>
              </div>
              <input 
                type="radio" 
                id={option.id} 
                name="visibility" 
                value={option.id} 
                checked={value === option.id}
                onChange={() => {}}
                className="mt-2.5 h-4 w-4 focus:ring-primary"
                aria-labelledby={`${option.id}-label`}
              />
            </Label>
          ))}
        </div>
      </div>
    </div>
  );
} 