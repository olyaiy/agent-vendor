'use client';

import { memo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type ModelWithDefault } from '@/components/chat/chat-model-selector';

/**
 * Component for selecting AI models in the chat interface
 * 
 * Features:
 * - Displays available models with default indicator
 * - Responsive design for different screen sizes
 * - Handles model selection changes
 */
function PureModelSelector({
  availableModels,
  currentModel,
  onModelChange,
}: {
  availableModels: ModelWithDefault[];
  currentModel: string;
  onModelChange: (modelId: string) => void;
}) {
  // Don't render if only one model is available
  if (availableModels.length <= 1) {
    return null;
  }

  return (
    <Select
      value={currentModel}
      onValueChange={onModelChange}
    >
      <SelectTrigger className="h-8 w-[50%] sm:w-full md:w-52 text-xs">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent position="popper" className="max-w-[90vw] md:max-w-none">
        {availableModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{model.model_display_name}</span>
              {model.isDefault && <span className="text-xxs text-muted-foreground ml-2 shrink-0">(Default)</span>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Memoized version of the model selector to prevent unnecessary re-renders
 */
export const ModelSelector = memo(PureModelSelector);
