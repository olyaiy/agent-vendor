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
    },
    {
        id: "private",
        label: "Private",
        description: "Only you can access this agent",
        icon: <LockClosedIcon className="size-4" />
      }
  ]);

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-start gap-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            Visibility
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoCircledIcon className="size-3 text-muted-foreground mt-0.5" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p>Control who can see and use your agent.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="bg-secondary/50 border rounded-lg p-1.5 shadow-sm">
        <div className="grid grid-cols-3 gap-1.5">
          {visibilityOptions.map((option) => (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                "flex flex-col items-start p-2 rounded-lg border cursor-pointer transition-all relative",
                "hover:shadow-md hover:border-primary/30",
                "focus-within:ring-2 focus-within:ring-primary/50",
                "active:scale-[0.98]",
                value === option.id 
                  ? "bg-background border-primary/30 ring-1 ring-primary/20 shadow-sm" 
                  : "hover:bg-background/80"
              )}
              onClick={() => onValueChange(option.id)}
            >
                {/* Radio button */}
              <input 
                type="radio" 
                id={option.id} 
                name="visibility" 
                value={option.id} 
                checked={value === option.id}
                onChange={() => {}}
                className="absolute right-2 top-2 h-4 w-4 focus:ring-primary"
                aria-labelledby={`${option.id}-label`}
              />
              {/* Visibility option */}
              <div className="flex flex-col items-start gap-2 w-full pr-6">
               
               
                {/* Icon */}
                <div className={cn(
                  "flex items-center  justify-center size-7 aspect-square rounded-full transition-colors absolute top-1 right-1",
                  value === option.id
                    ? "bg-secondary text-primary"
                    : "bg-card text-muted-foreground "
                )}>
                  {option.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">{option.description}</span>
                </div>
              </div>
            </Label>
          ))}
        </div>
      </div>
    </div>
  );
} 