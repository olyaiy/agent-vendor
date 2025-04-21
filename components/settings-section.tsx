'use client';

import { useState, memo, useMemo } from 'react'; // Import useMemo
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Settings, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ModelSettingRange, ModelSettings } from '@/lib/models'; // Import necessary types
import { Label } from '@/components/ui/label'; // Import Label

// Define props for the component
interface SettingsSectionProps {
  // selectedModelString?: string; // Removed unused prop
  modelSettings?: Partial<ModelSettings>; // The settings object for the selected model
  chatSettings: Record<string, number>; // Current values of settings
  onSettingChange: (settingName: string, value: number) => void; // Handler to update settings
}

// Helper to get a user-friendly name for setting keys
const getSettingLabel = (key: string): string => {
  switch (key) {
    case 'maxOutputTokens': return 'Max Tokens';
    case 'temperature': return 'Temperature';
    case 'topP': return 'Top P';
    case 'topK': return 'Top K';
    case 'frequencyPenalty': return 'Frequency Penalty';
    case 'presencePenalty': return 'Presence Penalty';
    default: return key; // Fallback to the key itself
  }
};

// Helper to determine slider step based on setting key
const getSliderStep = (key: string): number => {
  switch (key) {
    case 'temperature':
    case 'topP':
    case 'frequencyPenalty':
    case 'presencePenalty':
      return 0.01;
    case 'maxOutputTokens':
    case 'topK':
      return 1;
    default:
      return 0.1; // Default step
  }
};

// Helper to get description text
const getSettingDescription = (key: string): string => {
  switch (key) {
    case 'maxOutputTokens': return 'Maximum number of tokens to generate.';
    case 'temperature': return 'Controls randomness. Higher values mean more random outputs.';
    case 'topP': return 'Nucleus sampling. Considers tokens with top P probability mass.';
    case 'topK': return 'Considers only the top K tokens. 0 disables it.';
    case 'frequencyPenalty': return 'Penalizes new tokens based on their frequency in the text so far.';
    case 'presencePenalty': return 'Penalizes new tokens based on whether they appear in the text so far.';
    default: return '';
  }
}

function SettingsSectionComponent({
  // selectedModelString, // Removed unused prop
  modelSettings,
  chatSettings,
  onSettingChange
}: SettingsSectionProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Default closed

  // Memoize the available settings entries to avoid recalculating on every render
  const availableSettingEntries = useMemo(() => {
    return modelSettings ? Object.entries(modelSettings).filter(([, config]) => config !== undefined) as [keyof ModelSettings, ModelSettingRange][] : [];
  }, [modelSettings]);

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
          {/* Optionally show the selected model name if available */}
          {/* {selectedModelString && <span className="text-xs text-muted-foreground mr-1">{selectedModelString}</span>} */}
          <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${isSettingsOpen ? 'rotate-90' : ''}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="py-3 px-3 space-y-5">
        {availableSettingEntries.length > 0 ? (
          availableSettingEntries.map(([key, config]) => {
            const currentValue = chatSettings[key] ?? config.default;
            const step = getSliderStep(key);
            const description = getSettingDescription(key);

            // Format the displayed value based on the step
            const displayValue = step < 1 ? currentValue.toFixed(2) : currentValue.toFixed(0);

            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor={key} className="text-xs font-medium text-foreground">
                    {getSettingLabel(key)}
                  </Label>
                  <span className="text-xs text-muted-foreground w-10 text-right">{displayValue}</span>
                </div>
                <Slider
                  id={key}
                  min={config.min}
                  max={config.max}
                  step={step}
                  value={[currentValue]}
                  onValueChange={([newValue]) => onSettingChange(key, newValue)}
                  className="w-full"
                />
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground italic">No specific settings available for this model.</p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export const SettingsSection = memo(SettingsSectionComponent);
