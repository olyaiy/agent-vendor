import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip"; // Import Radix primitives
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
  TooltipProvider, // Keep provider for delayDuration setup
  TooltipContent, // Keep styled content
} from "@/components/ui/tooltip";
import { modelDetails } from "@/lib/models"; // Import modelDetails
import { ModelInfo } from "@/app/[agent-id]/settings/edit-agent-form"; // Import ModelInfo type
import { providerLogos } from "@/lib/provider-logos"; // Import provider logos

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

// Helper function to extract provider from model ID
const getProviderFromModel = (modelId: string): string => {
  // Extract provider from model ID using common patterns
  if (modelId.startsWith('gpt-') || modelId.startsWith('o1') || modelId.startsWith('o3')) return 'OpenAI';
  if (modelId.startsWith('claude-')) return 'Anthropic';
  if (modelId.startsWith('gemini-')) return 'Google';
  if (modelId.startsWith('llama') || modelId.startsWith('mixtral')) return 'Groq';
  if (modelId.startsWith('mistral') || modelId.startsWith('pixtral')) return 'Mistral';
  if (modelId.startsWith('deepseek')) return 'DeepSeek';
  if (modelId.startsWith('sonar') || modelId.startsWith('r1-')) return 'Perplexity';
  if (modelId.startsWith('grok-')) return 'xAI';
  if (modelId.startsWith('qwen-')) return 'Qwen';
  
  // Default if no match
  return 'Other';
};

// Define the memoized item component outside ModelSelect
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
            value={model.model}
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
            {/* Display Name in the list */}
            <span className="font-medium ">{details?.displayName || model.model}</span>
          </CommandItem>
        </TooltipPrimitive.Trigger>
        {/* Updated Tooltip Content */}
        <TooltipContent side="right" className="max-w-[300px] p-3 shadow-lg rounded-md bg-background border">
          <div className="space-y-1.5">
            {/* Display Name (Bold) */}
            <p className="font-semibold text-sm text-primary">{details?.displayName || model.model}</p>
            {/* Model ID (Smaller, muted) */}
            <p className="text-xs text-muted-foreground font-mono">{model.model}</p>
            {/* Description */}
            {details?.description && (
              <p className="text-xs text-muted-foreground mt-2">
                {details.description}
              </p>
            )}
            {/* Context Window */}
            {details?.contextWindow !== undefined && (
              <div className="mt-2 pt-1 border-t border-border/50">
                <span className="text-xs font-medium text-foreground/80">Context:</span>
                <span className="text-xs ml-1.5 text-muted-foreground">
                  {formatContextWindow(details.contextWindow)}
                </span>
              </div>
            )}
             {/* Pricing Info (Example - can be added if needed) */}
             {details?.inputCostPerMillion !== undefined && details?.outputCostPerMillion !== undefined && (
              <div className="mt-1 pt-1 border-t border-border/50">
                 <span className="text-xs font-medium text-foreground/80">Pricing (per 1M):</span>
                 <span className="text-xs ml-1.5 text-muted-foreground">
                   ${details.inputCostPerMillion.toFixed(2)} In / ${details.outputCostPerMillion.toFixed(2)} Out
                 </span>
               </div>
             )}
          </div>
        </TooltipContent>
      </TooltipPrimitive.Root>
    );
  }
);
MemoizedModelItem.displayName = "MemoizedModelItem"; // Add display name for DevTools

export function ModelSelect({ models, defaultValue, onValueChange }: ModelSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hoveredModelId, setHoveredModelId] = React.useState<string | null>(null); // Add state for hovered item
  
  // Flatten and filter models based on search query
  const filteredModels = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    return models.filter(model => 
      model.model.toLowerCase().includes(query)
    )
  }, [models, searchQuery])

  // Group filtered models
  const groupedModels = React.useMemo(() => {
    const groups: Record<string, ModelInfo[]> = {}
    
    filteredModels.forEach(model => {
      const provider = getProviderFromModel(model.model)
      groups[provider] = groups[provider] || []
      groups[provider].push(model)
    })

    return Object.entries(groups).sort(([a], [b]) => 
      a.localeCompare(b)
    )
  }, [filteredModels])

  // Find selected model and provider
  const selectedModelInfo = React.useMemo(() => {
    const model = models.find(m => m.id === defaultValue);
    if (!model) return { model: "Select model...", displayName: "Select model...", provider: null };

    const details = modelDetails[model.model];
    const provider = getProviderFromModel(model.model);
    return {
      model: model.model, // Keep raw model ID if needed elsewhere
      displayName: details?.displayName || model.model, // Use displayName for display
      provider
    };
  }, [models, defaultValue]);
  // Memoize handlers
  const handleMouseEnter = React.useCallback((id: string) => {
    setHoveredModelId(id);
  }, []); // No dependencies needed

  const handleMouseLeave = React.useCallback(() => {
    setHoveredModelId(null);
  }, []); // No dependencies needed

  const handleSelect = React.useCallback((id: string) => {
      onValueChange?.(id);
      setOpen(false);
      setHoveredModelId(null); // Close tooltip on select
    },
    [onValueChange] // Dependency: onValueChange might change
  );


  return (
      <Popover open={open} onOpenChange={setOpen}>

        {/* Model Selector Trigger */}
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-muted/30 border-0 focus:ring-1 focus:ring-ring"
          >
            <div className="flex items-center gap-2">
              {selectedModelInfo.provider && (
                <div className="relative w-4 h-4 flex-shrink-0">
                  <Image
                    src={providerLogos[selectedModelInfo.provider].src}
                    alt={providerLogos[selectedModelInfo.provider].alt}
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
              )}
              {/* Display Name in the trigger */}
              <span className="truncate">{selectedModelInfo.displayName}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {/* Model Selector Content */}
        <PopoverContent className="w-full p-0">

           {/* Search Box */}
          <Command shouldFilter={false}>

            {/* Search Input */}
            <CommandInput 
              placeholder="Search models..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />

            {/* Wrap CommandList in a single TooltipProvider */}
            <TooltipProvider>
              <CommandList>


              {/* No models found */}
              <CommandEmpty>
                No models found.
              </CommandEmpty>


              {/* Grouped Models */}
              {groupedModels.map(([provider, models]) => (
                <CommandGroup key={provider} heading={
                  // Provider Logo and Name
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium cursor-pointer">
                    <Image
                      src={providerLogos[provider].src}
                      alt={providerLogos[provider].alt}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                    {provider}
                  </div>
                }>

                  {/* Model List By Provider*/}
                  {models.map((model) => {
                    const details = modelDetails[model.model];
                    const isSelected = defaultValue === model.id;
                    const isHovered = hoveredModelId === model.id;

                    return (
                      <MemoizedModelItem
                        key={model.id} // Key must be on the outer element in map
                        model={model}
                        details={details}
                        isHovered={isHovered}
                        isSelected={isSelected}
                        onHover={handleMouseEnter}
                        onLeave={handleMouseLeave}
                        onSelect={handleSelect}
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
  )
}