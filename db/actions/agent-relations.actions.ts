"use server";

import { revalidatePath } from "next/cache";
import { AgentModel } from "../schema/agent";
import { updateAgentPrimaryModel, addSecondaryModelsToAgent } from "../repository/agent-relations.repository";

/**
 * Server action to update an agent's primary model.
 * 
 * @param agentId - The ID of the agent.
 * @param modelId - The ID of the model to set as primary.
 * @returns The updated agent-model relationship or error information.
 */
export async function updateAgentPrimaryModelAction(
  agentId: string,
  modelId: string
): Promise<{ success: boolean; data?: AgentModel[]; error?: string }> {
  try {
    if (!agentId || !modelId) {
      return { 
        success: false, 
        error: "Agent ID and Model ID are required" 
      };
    }

    const result = await updateAgentPrimaryModel(agentId, modelId);
    
    // Revalidate the agent page to reflect changes
    revalidatePath(`/dashboard/agents/${agentId}`);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Failed to update agent primary model:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

/**
 * Server action to add one or multiple secondary models to an agent.
 * 
 * @param agentId - The ID of the agent.
 * @param modelIds - Array of model IDs to add as secondary models.
 * @returns The created or updated agent-model relationships or error information.
 */
export async function addSecondaryModelsToAgentAction(
  agentId: string,
  modelIds: string[]
): Promise<{ success: boolean; data?: AgentModel[]; error?: string }> {
  try {
    if (!agentId || !modelIds.length) {
      return { 
        success: false, 
        error: "Agent ID and at least one Model ID are required" 
      };
    }

    const result = await addSecondaryModelsToAgent(agentId, modelIds);
    
    // Revalidate the agent page to reflect changes
    revalidatePath(`/dashboard/agents/${agentId}`);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Failed to add secondary models to agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}
