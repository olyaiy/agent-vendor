"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "../util/grouped-model-select";

export type ModelInfo = {
  id: string;
  displayName: string;
  modelType?: string | null;
  description?: string | null;
  provider?: string | null;
};

interface ModelSelectorSectionProps {
  models: ModelInfo[];
  primaryModelId: string;
  alternateModelIds: string[];
  onPrimaryModelChange: (modelId: string) => void;
  onAlternateModelsChange: (modelIds: string[]) => void;
}

export function ModelSelectorSection({
  models,
  primaryModelId,
  alternateModelIds,
  onPrimaryModelChange,
  onAlternateModelsChange,
}: ModelSelectorSectionProps) {
  const handlePrimaryModelChange = (value: string) => {
    onPrimaryModelChange(value);
    
    // If the selected primary model is in the alternate models list, remove it
    if (alternateModelIds.includes(value)) {
      onAlternateModelsChange(alternateModelIds.filter(id => id !== value));
    }
  };

  const handleAddAlternateModel = (value: string) => {
    // Don't add if it's already the primary model
    if (value === primaryModelId) {
      toast.error("This model is already set as the primary model");
      return;
    }
    
    // Don't add if it's already in the list
    if (alternateModelIds.includes(value)) {
      toast.error("This model is already added");
      return;
    }
    
    onAlternateModelsChange([...alternateModelIds, value]);
  };

  const handleRemoveAlternateModel = (id: string) => {
    onAlternateModelsChange(alternateModelIds.filter(modelId => modelId !== id));
  };
  
  const getModelById = (id: string): ModelInfo | undefined => {
    return models.find(model => model.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Primary Model Section */}
      <div>
        <Label htmlFor="primaryModel" className="text-sm font-medium mb-2 block">Primary Model</Label>
        <ModelSelector
          id="primaryModel"
          models={models}
          value={primaryModelId}
          onValueChange={handlePrimaryModelChange}
          placeholder="Select a primary model"
          className="h-11 bg-background focus-visible:ring-1 focus-visible:ring-offset-0 w-full"
          required
        />
      </div>

      {/* Alternate Models Section */}
      <div className="pt-4 border-t border-border/50">
        <Label className="text-sm font-medium mb-2 block">Alternate Models</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {alternateModelIds.map(modelId => {
            const model = getModelById(modelId);
            return model ? (
              <Badge key={modelId} variant="secondary" className="py-1.5 px-2.5 flex items-center gap-1.5 bg-secondary/80">
                {model.displayName}
                <button 
                  type="button" 
                  onClick={() => handleRemoveAlternateModel(modelId)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${model.displayName}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ) : null;
          })}
          {alternateModelIds.length === 0 && (
            <p className="text-sm text-muted-foreground">No alternate models selected</p>
          )}
        </div>
        
        <ModelSelector
          id="alternateModel"
          models={models.filter(model => 
            model.id !== primaryModelId && 
            !alternateModelIds.includes(model.id)
          )}
          value=""
          onValueChange={handleAddAlternateModel}
          placeholder="Add alternate model"
          className="h-11 bg-background focus-visible:ring-1 focus-visible:ring-offset-0 w-full"
        />
        
        <p className="text-xs text-muted-foreground mt-2">
          Add alternate models that can be used as fallbacks or for specific tasks.
        </p>
      </div>
    </div>
  );
} 