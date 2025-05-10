"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { FormSection } from '@/components/form-section';
import MultiSelect from '@/components/ui/multiselect'; // Assuming this is your actual MultiSelect component
import { Tool } from '@/db/schema/tool';
import { addToolToAgentAction, removeToolFromAgentAction } from '@/db/actions/agent-relations.actions';
import { toast } from 'sonner';

// Define the option type locally, attempting to match what MultiSelect likely expects
// If MultiSelect exports its own Option type, importing and using that would be best.
interface MultiSelectOption {
  value: string;
  label: string;
  // Adjusting index signature to be more compatible with typical UI component option types
  [key: string]: string | boolean | undefined; // Specifically excluding 'number' based on TS error
}

interface AgentToolsFormProps {
  agentId: string;
  currentAgentTools: Tool[];
  allAvailableTools: Tool[];
}

const AgentToolsForm = ({ agentId, currentAgentTools, allAvailableTools }: AgentToolsFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [selectedToolOptions, setSelectedToolOptions] = useState<MultiSelectOption[]>([]);

  useEffect(() => {
    setSelectedToolOptions(
      currentAgentTools.map(tool => ({
        value: tool.id,
        label: tool.displayName || tool.name,
      }))
    );
  }, [currentAgentTools]);

  const availableToolOptions: MultiSelectOption[] = allAvailableTools.map(tool => ({
    value: tool.id,
    label: tool.displayName || tool.name,
  }));

  const handleToolSelectionChange = useCallback(async (newOptions: MultiSelectOption[]) => {
    const previousOptions = selectedToolOptions;
    setSelectedToolOptions(newOptions); // Optimistic update with full option objects

    const previousSelectedIds = previousOptions.map(opt => opt.value);
    const newSelectedIds = newOptions.map(opt => opt.value);

    const toolsToAdd = newSelectedIds.filter(id => !previousSelectedIds.includes(id));
    const toolsToRemove = previousSelectedIds.filter(id => !newSelectedIds.includes(id));

    if (toolsToAdd.length === 0 && toolsToRemove.length === 0) {
      return; // No changes
    }

    startTransition(async () => {
      let success = true;
      const errors: string[] = [];

      for (const toolId of toolsToAdd) {
        const tool = allAvailableTools.find(t => t.id === toolId);
        const result = await addToolToAgentAction(agentId, toolId);
        if (!result.success) {
          success = false;
          errors.push(result.error || `Failed to add tool ${tool?.name || toolId}`);
        }
      }

      for (const toolId of toolsToRemove) {
        const tool = allAvailableTools.find(t => t.id === toolId);
        const result = await removeToolFromAgentAction(agentId, toolId);
        if (!result.success) {
          success = false;
          errors.push(result.error || `Failed to remove tool ${tool?.name || toolId}`);
        }
      }

      if (success && errors.length === 0) {
        toast.success("Agent tools updated successfully.");
      } else {
        setSelectedToolOptions(previousOptions); // Revert optimistic update on error
        errors.forEach(error => toast.error("Error updating tools", { description: error }));
        if (errors.length === 0 && !success) {
            toast.error("Error updating tools", { description: "An unknown error occurred."});
        }
      }
    });
  }, [agentId, selectedToolOptions, allAvailableTools, startTransition]);

  return (
    <FormSection
      title="Agent Tools"
      description="Select the tools this agent can utilize during interactions."
    >
      <div className="space-y-4">
        <MultiSelect
          options={availableToolOptions}
          value={selectedToolOptions}
          onChange={handleToolSelectionChange}
          placeholder="Select tools for the agent..."
          disabled={isPending}
        />
        {isPending && <p className="text-sm text-muted-foreground">Updating tools...</p>}
      </div>
    </FormSection>
  );
};

export default AgentToolsForm;