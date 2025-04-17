'use client';

import { useState, memo } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Settings, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ModelSelect } from '@/components/model-select';

import { ModelInfo } from "@/app/[agent-id]/settings/edit-agent-form"; // Import ModelInfo

interface SettingsSectionProps {
  selectedModelId: string;
  setSelectedModelId: React.Dispatch<React.SetStateAction<string>>;
  models: ModelInfo[]; // Add models prop
}

function SettingsSectionComponent({ selectedModelId, setSelectedModelId, models }: SettingsSectionProps) { // Add models to destructuring
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Default closed

  return (
    <Collapsible
      open={isSettingsOpen}
      onOpenChange={setIsSettingsOpen}
      className="group"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 group-hover:bg-muted/30 rounded-md px-3 transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Agent Settings</span>
        </div>
        <div className="flex items-center gap-1">
          <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3 space-y-5">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">AI Model</label>
          <ModelSelect
            models={models} // Pass models prop
            defaultValue={selectedModelId} // Use prop for default value
            onValueChange={setSelectedModelId} // Use prop for change handler
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">Temperature</label>
            <span className="text-xs text-muted-foreground">0.7</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[0.7]}
            max={1}
            step={0.1}
            className="w-full"
            // Consider adding onValueChange prop if needed later
          />
          <p className="text-xs text-muted-foreground mt-1">Creativity vs precision</p>
        </div>

        {/* topP */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">topP</label>
            <span className="text-xs text-muted-foreground">1</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[1]}
            max={1}
            min={0}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">Nucleus sampling. Only tokens with the top probability mass are considered.</p>
        </div>

        {/* topK */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">topK</label>
            <span className="text-xs text-muted-foreground">0</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[0]}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">Only sample from the top K options for each token. Advanced use only.</p>
        </div>

        {/* presencePenalty */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">presencePenalty</label>
            <span className="text-xs text-muted-foreground">0</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[0]}
            max={2}
            min={-2}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">Affects the likelihood to repeat information already in the prompt.</p>
        </div>

        {/* frequencyPenalty */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs text-muted-foreground">frequencyPenalty</label>
            <span className="text-xs text-muted-foreground">0</span> {/* Static display value */}
          </div>
          <Slider
            defaultValue={[0]}
            max={2}
            min={-2}
            step={0.01}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">Affects the likelihood to repeatedly use the same words or phrases.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const SettingsSection = memo(SettingsSectionComponent);
