import * as React from "react";
// import { InfoIcon } from "lucide-react"; // Removed unused import
import {
  Select,
  SelectContent,
  SelectItem, // Removed SelectGroup, SelectLabel, SelectSeparator
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { modelDetails } from "@/lib/models"; // Import modelDetails
import { ModelInfo } from "@/app/[agent-id]/settings/edit-agent-form"; // Import ModelInfo type

// Updated Props interface
interface ModelSelectProps {
  models: ModelInfo[]; // Accept models from props
  defaultValue?: string; // Expecting DB UUID
  onValueChange?: (value: string) => void; // Expecting DB UUID
}

// Helper function to format context window
const formatContextWindow = (tokens: number | undefined): string => {
  if (tokens === undefined || tokens < 0) return "N/A";
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M tokens`;
  if (tokens >= 1_000) return `${tokens / 1_000}K tokens`;
  return `${tokens} tokens`;
};

export function ModelSelect({ models, defaultValue, onValueChange }: ModelSelectProps) {
  return (
    <TooltipProvider>
      <Select defaultValue={defaultValue} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-muted/30 border-0 focus:ring-1 focus:ring-ring">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="max-h-[500px]">
          {/* Removed grouping, directly map over models prop */}
          {models.map((model) => {
            // Fetch additional details from lib/models.ts
            const details = modelDetails[model.model]; // Use model.model (ID string) as key
            const contextWindow = details?.contextWindow;

            return (
              <Tooltip key={model.id}> {/* Use DB UUID as key */}
                <TooltipTrigger asChild>
                  <div> {/* Wrap SelectItem for TooltipTrigger */}
                    <SelectItem
                      value={model.id} // Use DB UUID as value
                      className="py-1.5 pr-2 rounded-sm cursor-pointer hover:bg-muted/50 pl-8 relative"
                    >
                      {/* Display model ID string */}
                      <span className="font-medium">{model.model}</span>
                    </SelectItem>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[250px] p-3">
                  <div className="space-y-2">
                    {/* Display model ID string as name */}
                    <p className="font-medium text-sm">{model.model}</p>
                    {/* Display description from DB */}
                    {model.description && (
                       <p className="text-xs text-muted-foreground">{model.description}</p>
                    )}
                    {/* Display context window from lib/models.ts */}
                    {contextWindow !== undefined && (
                      <div className="mt-1">
                        <span className="text-xs font-medium">Context:</span>
                        <span className="text-xs ml-1">{formatContextWindow(contextWindow)}</span>
                      </div>
                    )}
                    {/* Removed strengths display */}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </SelectContent>
      </Select>
    </TooltipProvider>
  );
}