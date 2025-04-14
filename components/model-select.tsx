import * as React from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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

export function ModelSelect({ models, defaultValue, onValueChange }: ModelSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  
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
    const model = models.find(model => model.id === defaultValue);
    if (!model) return { model: "Select model...", provider: null };
    
    const provider = getProviderFromModel(model.model);
    return {
      model: model.model,
      provider
    };
  }, [models, defaultValue]);

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
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
              <span className="truncate">{selectedModelInfo.model}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search models..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No models found.</CommandEmpty>
              {groupedModels.map(([provider, models]) => (
                <CommandGroup key={provider} heading={
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium">
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
                  {models.map(model => {
                    const details = modelDetails[model.model]
                    return (
                      <Tooltip key={model.id}>
                        <TooltipTrigger asChild>
                          <CommandItem
                            value={model.model}
                            onSelect={() => {
                              onValueChange?.(model.id)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                defaultValue === model.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{model.model}</span>
                          </CommandItem>
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
                            {details?.contextWindow !== undefined && (
                              <div className="mt-1">
                                <span className="text-xs font-medium">Context:</span>
                                <span className="text-xs ml-1">{formatContextWindow(details.contextWindow)}</span>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}