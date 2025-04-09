'use server'

import { insertAgent, selectRecentAgents, selectAllModels, updateAgent as updateAgentRepo } from "@/db/repository/agent-repository";
import { Agent } from "@/db/schema/agent";

/**
 * Server action to create a new agent
 * This allows us to safely perform database operations from client components
 * @param data - Object containing all required agent properties
 * @returns Promise with success status and created agent data or error
 */
export async function createAgent(data: {
  name: string;
  description: string | null;
  systemPrompt: string | null;
  thumbnailUrl: string | null;
  visibility: string;
  primaryModelId: string;
  creatorId: string;
  welcomeMessage: string | null;
  avatarUrl: string | null;
}) {
  try {
    // Call the repository function to insert the agent
    const result = await insertAgent(data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create agent:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to fetch the most recent 20 agents
 * This enables secure data fetching from client components
 * @returns Promise with success status and agent list or error
 */
export async function getRecentAgents() {
  try {
    const agents = await selectRecentAgents();
    return { success: true, data: agents };
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to fetch all available models
 * This enables secure data fetching from client components
 * @returns Promise with success status and model list or error
 */
export async function getAllModels() {
  try {
    const modelList = await selectAllModels();
    return { success: true, data: modelList };
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to update an existing agent
 * @param agentId - The ID of the agent to update
 * @param data - Object containing the fields to update
 * @returns Promise with success status and updated agent data or error
 */
export async function updateAgentAction(agentId: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>>) {
  try {
    // Call the repository function to update the agent
    const result = await updateAgentRepo(agentId, data);
    if (result.length === 0) {
      return { success: false, error: "Agent not found or update failed" };
    }
    return { success: true, data: result[0] }; // Return the first updated agent
  } catch (error) {
    console.error("Failed to update agent:", error);
    return { success: false, error: (error as Error).message };
  }
}