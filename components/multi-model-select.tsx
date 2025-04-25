'use client'
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Image from "next/image";
import { Check, ChevronsUpDown } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { modelDetails } from "@/lib/models"; 
import { providerLogos } from "@/lib/provider-logos"; 

// Using an interface for ModelInfo consistency
interface ModelInfo {
  id: string;
  model: string;
  description: string | null;
}

// Props for MultiModelSelect
interface MultiModelSelectProps {
  models: ModelInfo[]; // All available models
  value: string[]; // Array of selected model IDs
  onValueChange: (value: string[]) => void; // Callback with array of IDs
}

// Helper function to format context window (copied)
const formatContextWindow = (tokens: number | undefined): string => {
  if (tokens === undefined || tokens < 0) return "N/A";
  if (tokens >= 1_000_000) return `${tokens / 1_000_000}M tokens`;
  if (tokens >= 1_000) return `${tokens / 1_000}K tokens`;
  return `${tokens} tokens`;
};

// Helper function to extract provider from model ID (copied)
const getProviderFromModel = (modelId: string): string => {
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1') || modelId.startsWith('o3')) return 'OpenAI';
  if (modelId.startsWith('claude-')) return 'Anthropic';
  if (modelId.startsWith('gemini-')) return 'Google';
  if (modelId.startsWith('llama') || modelId.startsWith('mixtral')) return 'Groq';
  if (modelId.startsWith('mistral') || modelId.startsWith('pixtral')) return 'Mistral';
  if (modelId.startsWith('deepseek')) return 'DeepSeek';
  if (modelId.startsWith('sonar') || modelId.startsWith('r1-')) return 'Perplexity';
  if (modelId.startsWith('grok-')) return 'xAI';
  if (modelId.startsWith('qwen-')) return 'Qwen';
  return 'Other';
};

// Memoized item component (copied, unchanged)
interface MemoizedModelItemProps {
  model: ModelInfo;
  details: typeof modelDetails[string] | undefined;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
  onSelect: (id: string) => void;
}

const MemoizedModelItem = React.memo(
  ({
    model,
    details,
    isHovered,
    isSelected,
    onHover,
    onLeave,
    onSelect,
  }: MemoizedModelItemProps) => {
    return (
      <TooltipPrimitive.Root key={model.id} open={isHovered}>
        <TooltipPrimitive.Trigger asChild>
          <CommandItem
            value={model.model} // Use model identifier for search
            onSelect={() => onSelect(model.id)}
            onMouseEnter={() => onHover(model.id)}
            onMouseLeave={onLeave}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                isSelected ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="font-medium">{details?.displayName || model.model}</span>
          </CommandItem>
        </TooltipPrimitive.Trigger>
        {/* Tooltip Content (copied, unchanged) */}
        <TooltipContent 
          side="right" 
          className="max-w-[320px] p-0 shadow-xl rounded-lg bg-background border overflow-hidden"
          sideOffset={5}
          avoidCollisions
        >
          <div>
            {/* Header */}
            <div className="p-3 pb-2 border-b border-border/30 flex items-center gap-2">
              <div className="relative w-5 h-5 flex-shrink-0">
                <Image
                  src={providerLogos[getProviderFromModel(model.model)]?.src || providerLogos['Other'].src}
                  alt={getProviderFromModel(model.model)}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <p className="font-semibold text-sm text-primary flex-1 truncate">
                {details?.displayName || model.model}
              </p>
            </div>
            {/* Content */}
            <div className="p-3 pt-2 space-y-2">
              <div className="flex items-center">
                <span className="text-xs text-muted-foreground font-mono px-1.5 py-0.5 bg-muted/50 rounded-sm">
                  {model.model}
                </span>
              </div>
              {details?.description && (
                <p className="text-xs leading-relaxed text-foreground/90 mt-1">
                  {details.description}
                </p>
              )}
              <div className="mt-3 space-y-2.5 flex flex-col">
                {details?.contextWindow !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Context Window</span>
                    <span className="px-2 py-0.5 bg-primary/90 text-primary-foreground rounded-full text-xs font-medium">
                      {formatContextWindow(details.contextWindow)}
                    </span>
                  </div>
                )}
                {details?.inputCostPerMillion !== undefined && details?.outputCostPerMillion !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Pricing</span>
                    <span className="px-2 py-0.5 bg-primary/90 text-primary-foreground rounded-full text-xs font-medium whitespace-nowrap">
                      ${details.inputCostPerMillion.toFixed(2)} in / ${details.outputCostPerMillion.toFixed(2)} out
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TooltipContent>
      </TooltipPrimitive.Root>
    );
  }
);
MemoizedModelItem.displayName = "MemoizedModelItem";

// Main MultiModelSelect component
export function MultiModelSelect({ models, value, onValueChange }: MultiModelSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hoveredModelId, setHoveredModelId] = React.useState<string | null>(null);

  // Flatten and filter models based on search query (copied)
  const filteredModels = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return models.filter(model => 
      model.model.toLowerCase().includes(query) ||
      (modelDetails[model.model]?.displayName.toLowerCase() || '').includes(query)
    );
  }, [models, searchQuery]);

  // Group filtered models (copied)
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {};
    filteredModels.forEach(model => {
      const provider = getProviderFromModel(model.model);
      groups[provider] = groups[provider] || [];
      groups[provider].push(model);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredModels]);

  // Determine display text for the trigger button
  const triggerText = React.useMemo(() => {
    if (value.length === 0) return "Select models...";
    if (value.length === 1) {
      const selectedModel = models.find(m => m.id === value[0]);
      return selectedModel ? (modelDetails[selectedModel.model]?.displayName || selectedModel.model) : "Select models...";
    }
    return `${value.length} models selected`;
  }, [value, models]);

  // Memoize handlers (copied)
  const handleMouseEnter = React.useCallback((id: string) => {
    setHoveredModelId(id);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setHoveredModelId(null);
  }, []);

  // Modified handleSelect for multiple selections
  const handleSelect = React.useCallback((id: string) => {
    const newValue = value.includes(id) 
      ? value.filter(v => v !== id) // Remove if already selected
      : [...value, id]; // Add if not selected
    onValueChange(newValue);
    setHoveredModelId(null); // Close tooltip on select
    // Keep popover open: setOpen(false); is removed
  }, [value, onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-muted/30 border-0 focus:ring-1 focus:ring-ring"
        >
          <span className="truncate">{triggerText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* Popover Content */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0"> 
        <Command shouldFilter={false}>
          {/* Search Input */}
          <CommandInput 
            placeholder="Search models..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          {/* Tooltip Provider for all items */}
          <TooltipProvider>
            <CommandList>
              {/* Empty State */}
              <CommandEmpty>
                No models found.
              </CommandEmpty>
              {/* Grouped Model List */}
              {groupedModels.map(([provider, providerModels]) => (
                <CommandGroup key={provider} heading={
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium">
                    <Image
                      src={providerLogos[provider]?.src || providerLogos['Other'].src}
                      alt={providerLogos[provider]?.alt || 'Other'}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                    {provider}
                  </div>
                }>
                  {/* Model Items */}
                  {providerModels.map((model) => {
                    const details = modelDetails[model.model];
                    const isSelected = value.includes(model.id); // Check if ID is in the value array
                    const isHovered = hoveredModelId === model.id;
                    return (
                      <MemoizedModelItem
                        key={model.id}
                        model={model}
                        details={details}
                        isHovered={isHovered}
                        isSelected={isSelected}
                        onHover={handleMouseEnter}
                        onLeave={handleMouseLeave}
                        onSelect={handleSelect} // Use the updated handleSelect
                      />
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </TooltipProvider>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 