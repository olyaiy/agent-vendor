'use client'
import { FormSection } from '@/components/form-section';
import { AgentModel } from '@/db/schema/agent';
import React from 'react';
import { ModelSelect } from '@/components/model-select';
import { updateAgentPrimaryModelAction } from '@/db/actions/agent-relations.actions';
import { toast } from 'sonner';

interface AgentModelsFormProps {
    agentModels: AgentModel[];
    agentId: string;
    allModels: AgentModel[];
}

const AgentModelsForm = ({ agentModels, agentId, allModels }: AgentModelsFormProps) => {
  // Find the current primary model
  const primaryModel = agentModels.find(model => model.role === 'primary');
  
  // Handle model change
  const handleModelChange = async (modelId: string) => {
    try {
      const result = await updateAgentPrimaryModelAction(agentId, modelId);
      
      if (result.success) {
        toast.success('Model updated successfully');
      } else {
        toast.error(result.error || 'Failed to update model');
      }
    } catch (error) {
      toast.error('An error occurred while updating the model');
      console.error(error);
    }
  };

  return (
    <FormSection title="Intelligence" description="Choose the AI model behind your agent.">
      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="primary-model" className="text-sm font-medium">
            Primary Model
          </label>
          <ModelSelect
            models={allModels}
            defaultValue={primaryModel?.modelId}
            onValueChange={handleModelChange}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This is the primary AI model that will power your agent's responses.
          </p>
        </div>
      </div>
    </FormSection>
  )
}

export default AgentModelsForm
