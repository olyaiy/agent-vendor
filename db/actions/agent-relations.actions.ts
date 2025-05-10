"use server";

import { revalidatePath } from "next/cache";
import { AgentModel } from "../schema/agent";
import { AgentTool, Tool } from "../schema/tool"; // Added Tool and AgentTool
import { ActionResult } from "./types"; // Added ActionResult
import { auth } from "@/lib/auth"; // Added auth
import { headers } from "next/headers"; // Added headers

import { 
  updateAgentPrimaryModel, 
  addSecondaryModelsToAgent, 
  removeSecondaryModelsFromAgent,
  addToolToAgent as addToolToAgentRepo, // Added
  removeToolFromAgent as removeToolFromAgentRepo, // Added
  selectToolsForAgent as selectToolsForAgentRepo, // Added
  selectAgentToolEntries as selectAgentToolEntriesRepo // Added
} from "../repository/agent-relations.repository";

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
): Promise<ActionResult<AgentModel[]>> { // Updated return type
  try {
    if (!agentId || !modelId) {
      return { 
        success: false, 
        error: "Agent ID and Model ID are required" 
      };
    }

    const result = await updateAgentPrimaryModel(agentId, modelId);
    
    // Revalidate the agent page to reflect changes
    // Consider revalidating a more specific path if possible, e.g., agent settings page
    const agent = await db.select({ slug: agentSchema.slug }).from(agentSchema).where(eq(agentSchema.id, agentId)).limit(1);
    if (agent[0]?.slug) {
      revalidatePath(`/agent/${agent[0].slug}/settings`);
    }
    revalidatePath(`/agent/${agentId}/settings`); // Fallback or general revalidation

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
): Promise<ActionResult<AgentModel[]>> { // Updated return type
  try {
    if (!agentId || !modelIds.length) {
      return { 
        success: false, 
        error: "Agent ID and at least one Model ID are required" 
      };
    }

    const result = await addSecondaryModelsToAgent(agentId, modelIds);
    
    const agent = await db.select({ slug: agentSchema.slug }).from(agentSchema).where(eq(agentSchema.id, agentId)).limit(1);
    if (agent[0]?.slug) {
      revalidatePath(`/agent/${agent[0].slug}/settings`);
    }
    revalidatePath(`/agent/${agentId}/settings`); 

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

/**
 * Server action to remove secondary models from an agent.
 * This will only remove models with a secondary role.
 * 
 * @param agentId - The ID of the agent.
 * @param modelIds - Array of model IDs to remove.
 * @returns Information about the success of the operation and count of removed models.
 */
export async function removeSecondaryModelsFromAgentAction(
  agentId: string, 
  modelIds: string[]
): Promise<ActionResult<{ count: number }>> { // Updated return type
  try {
    if (!agentId || !modelIds.length) {
      return {
        success: false,
        error: "Agent ID and at least one Model ID are required"
      };
    }

    const count = await removeSecondaryModelsFromAgent(agentId, modelIds);
    
    const agent = await db.select({ slug: agentSchema.slug }).from(agentSchema).where(eq(agentSchema.id, agentId)).limit(1);
    if (agent[0]?.slug) {
      revalidatePath(`/agent/${agent[0].slug}/settings`);
    }
    revalidatePath(`/agent/${agentId}/settings`); 

    return {
      success: true,
      data: { count }
    };
  } catch (error) {
    console.error("Failed to remove secondary models from agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

// --------------------- AGENT - TOOL RELATIONS ---------------------    

/**
 * Server action to add a tool to an agent.
 * @param agentId - The ID of the agent.
 * @param toolId - The ID of the tool.
 * @returns The newly created agent_tool record or error information.
 */
export async function addToolToAgentAction(
  agentId: string,
  toolId: string
): Promise<ActionResult<AgentTool[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    // Basic auth check, can be expanded to check if user owns the agent
    if (!session?.user) {
        return { success: false, error: "User not authenticated." };
    }
    // Add more specific authorization if needed (e.g., user owns agentId)

    if (!agentId || !toolId) {
      return { success: false, error: "Agent ID and Tool ID are required." };
    }

    const result = await addToolToAgentRepo(agentId, toolId);
    
    const agent = await db.select({ slug: agentSchema.slug }).from(agentSchema).where(eq(agentSchema.id, agentId)).limit(1);
    if (agent[0]?.slug) {
      revalidatePath(`/agent/${agent[0].slug}/settings`);
    }
    revalidatePath(`/agent/${agentId}/settings`);

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to add tool to agent:", error);
    // Handle potential unique constraint violation if the tool is already added
    if (error instanceof Error && error.message.includes('unique constraint')) {
        return { success: false, error: "This tool is already associated with the agent." };
    }
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

/**
 * Server action to remove a tool from an agent.
 * @param agentId - The ID of the agent.
 * @param toolId - The ID of the tool.
 * @returns Success status or error information.
 */
export async function removeToolFromAgentAction(
  agentId: string,
  toolId: string
): Promise<ActionResult<void>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return { success: false, error: "User not authenticated." };
    }
    // Add more specific authorization if needed

    if (!agentId || !toolId) {
      return { success: false, error: "Agent ID and Tool ID are required." };
    }

    await removeToolFromAgentRepo(agentId, toolId);
    
    const agent = await db.select({ slug: agentSchema.slug }).from(agentSchema).where(eq(agentSchema.id, agentId)).limit(1);
    if (agent[0]?.slug) {
      revalidatePath(`/agent/${agent[0].slug}/settings`);
    }
    revalidatePath(`/agent/${agentId}/settings`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to remove tool from agent:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

/**
 * Server action to get all tools associated with an agent.
 * @param agentId - The ID of the agent.
 * @returns List of tools or error information.
 */
export async function getToolsForAgentAction(
  agentId: string
): Promise<ActionResult<Tool[]>> {
  try {
    // Depending on requirements, this might or might not need authentication
    // If tools can be public or agent settings are public, auth might not be strict here.
    // For now, assuming it's a general fetch.
    if (!agentId) {
      return { success: false, error: "Agent ID is required." };
    }

    const tools = await selectToolsForAgentRepo(agentId);
    return { success: true, data: tools };
  } catch (error) {
    console.error("Failed to fetch tools for agent:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

/**
 * Server action to get all agent-tool relationship entries for an agent.
 * Useful for UIs that need to know the direct associations.
 * @param agentId - The ID of the agent.
 * @returns List of agent_tool entries or error information.
 */
export async function getAgentToolEntriesAction(
  agentId: string
): Promise<ActionResult<AgentTool[]>> {
  try {
    if (!agentId) {
      return { success: false, error: "Agent ID is required." };
    }
    // Auth check might be needed depending on how this data is used
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) { // Basic check, can be more specific
        // return { success: false, error: "User not authenticated." };
    }

    const entries = await selectAgentToolEntriesRepo(agentId);
    return { success: true, data: entries };
  } catch (error) {
    console.error("Failed to fetch agent tool entries:", error);
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}

// Need to import db and agentSchema for revalidatePath logic
import { db } from "..";
import { agent as agentSchema } from '../schema/agent';
import { eq } from "drizzle-orm";
