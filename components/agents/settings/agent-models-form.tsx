'use client'
import { FormSection } from '@/components/form-section';
import { AgentModel } from '@/db/schema/agent';
import React, { useState, useEffect, useCallback } from 'react';
import { ModelSelect } from '@/components/model-select';
import { MultiModelSelect } from '@/components/multi-model-select';
import { 
  updateAgentPrimaryModelAction, 
  addSecondaryModelsToAgentAction, 
  removeSecondaryModelsFromAgentAction 
} from '@/db/actions/agent-relations.actions';
import { toast } from 'sonner';

interface ModelInfo {
  id: string;
  model: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AgentModelsFormProps {
    agentModels: AgentModel[];
    agentId: string;
    allModels: ModelInfo[];
}

const AgentModelsForm = ({ agentModels, agentId, allModels }: AgentModelsFormProps) => {
  // Find the current primary model
  const primaryModel = agentModels.find(model => model.role === 'primary');
  // Get current secondary models
  const initialSecondaryModels = agentModels.filter(model => model.role === 'secondary').map(m => m.modelId);
  
  // Track selected primary model ID for optimistic updates
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string | undefined>(primaryModel?.modelId);
  // Track selected secondary model IDs for optimistic updates
  const [selectedSecondaryIds, setSelectedSecondaryIds] = useState<string[]>(initialSecondaryModels);

  useEffect(() => {
    // Update selected primary model if prop changes
    setSelectedPrimaryId(primaryModel?.modelId);
  }, [primaryModel?.modelId]);

  useEffect(() => {
    // Update selected secondary models if props change
    const currentSecondaryIds = agentModels.filter(model => model.role === 'secondary').map(m => m.modelId);
    setSelectedSecondaryIds(currentSecondaryIds);
  }, [agentModels]); // Depend on the whole agentModels array
  
  // Handle primary model change with optimistic update
  const handlePrimaryChange = useCallback(async (modelId: string) => {
    const previousModelId = selectedPrimaryId;
    setSelectedPrimaryId(modelId);
    
    try {
      const result = await updateAgentPrimaryModelAction(agentId, modelId);
      if (result.success) {
        toast.success('Primary model updated successfully');
      } else {
        setSelectedPrimaryId(previousModelId);
        toast.error(result.error || 'Failed to update primary model');
      }
    } catch (error) {
      setSelectedPrimaryId(previousModelId);
      toast.error('An error occurred while updating the primary model');
      console.error(error);
    }
  }, [selectedPrimaryId, agentId]);

  // Handle secondary model changes with optimistic updates
  const handleSecondaryChange = useCallback(async (newSelectedIds: string[]) => {
    const previousSecondaryIds = selectedSecondaryIds;
    
    // Optimistically update UI
    setSelectedSecondaryIds(newSelectedIds);

    const modelsToAdd = newSelectedIds.filter(id => !previousSecondaryIds.includes(id));
    const modelsToRemove = previousSecondaryIds.filter(id => !newSelectedIds.includes(id));

    let addError: string | undefined;
    let removeError: string | undefined;

    try {
      // Perform add and remove operations concurrently
      const [addResult, removeResult] = await Promise.allSettled([
        modelsToAdd.length > 0 ? addSecondaryModelsToAgentAction(agentId, modelsToAdd) : Promise.resolve({ success: true }),
        modelsToRemove.length > 0 ? removeSecondaryModelsFromAgentAction(agentId, modelsToRemove) : Promise.resolve({ success: true })
      ]);

      // Process results
      if (addResult.status === 'rejected' || (addResult.status === 'fulfilled' && !addResult.value.success)) {
        addError = addResult.status === 'fulfilled' ? addResult.value.error : (addResult.reason as Error).message;
      }
      if (removeResult.status === 'rejected' || (removeResult.status === 'fulfilled' && !removeResult.value.success)) {
        removeError = removeResult.status === 'fulfilled' ? removeResult.value.error : (removeResult.reason as Error).message;
      }

      // Handle errors and revert state if necessary
      if (addError || removeError) {
        setSelectedSecondaryIds(previousSecondaryIds); // Revert state
        if (addError) toast.error(`Failed to add models: ${addError}`);
        if (removeError) toast.error(`Failed to remove models: ${removeError}`);
      } else {
        toast.success('Secondary models updated successfully');
      }

    } catch (error) {
      // Catch any unexpected errors during Promise.allSettled or setup
      setSelectedSecondaryIds(previousSecondaryIds); // Revert state
      toast.error('An unexpected error occurred while updating secondary models');
      console.error("Error updating secondary models:", error);
    }
  }, [selectedSecondaryIds, agentId]);

  return (
    <FormSection title="Intelligence" description="Choose the AI models behind your agent.">
      <div className="space-y-6"> {/* Increased spacing */}
        {/* Primary Model Selection */}
        <div className="grid gap-2">
          <label htmlFor="primary-model" className="text-sm font-medium">
            Primary Model
          </label>
          <ModelSelect
            models={allModels}
            defaultValue={selectedPrimaryId} // Use state for optimistic update
            onValueChange={handlePrimaryChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            The main AI model that will power your agent&apos;s core functions.
          </p>
        </div>

        {/* Secondary Models Selection */}
        <div className="grid gap-2">
          <label htmlFor="secondary-models" className="text-sm font-medium">
            Secondary Models
          </label>
          <MultiModelSelect
            models={allModels.filter(model => model.id !== selectedPrimaryId)} // Exclude primary model
            value={selectedSecondaryIds} // Use state for optimistic update
            onValueChange={handleSecondaryChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional supplementary models for specific tasks or fallback.
          </p>
        </div>
      </div>
    </FormSection>
  )
}

export default AgentModelsForm
