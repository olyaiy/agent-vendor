'use server'

import {
  insertAgent,
  selectRecentAgents,
  selectAllModels,
  updateAgent as updateAgentRepo,
  insertKnowledge, // Added
  updateKnowledge, // Added
  deleteKnowledge, // Added
} from "@/db/repository/agent-repository";
import { Agent } from "@/db/schema/agent"; // Added Knowledge type
import { z } from "zod"; // Added for input validation

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


// --- Knowledge Actions ---

// Schema for validating new knowledge item data
const NewKnowledgeSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().optional(),
});

/**
 * Server action to add a new knowledge item for an agent
 * @param data - Object containing title, content, agentId, and optional sourceUrl
 * @returns Promise with success status and created knowledge data or error
 */
export async function addKnowledgeItemAction(data: {
  agentId: string;
  title: string;
  content: string;
  sourceUrl?: string;
}) {
  const validation = NewKnowledgeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.errors };
  }

  try {
    // Ensure sourceUrl is null if undefined before inserting
    const dataToInsert = {
      ...validation.data,
      sourceUrl: validation.data.sourceUrl ?? null,
    };
    const result = await insertKnowledge(dataToInsert);
    // Optional: Revalidate paths if knowledge affects public pages
    // revalidatePath(`/agent/${data.agentId}`);
    return { success: true, data: result[0] }; // Return the first created item
  } catch (error) {
    console.error("Failed to add knowledge item:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Schema for validating knowledge item updates (all fields optional except ID)
const UpdateKnowledgeSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  content: z.string().min(1, "Content cannot be empty").optional(),
  sourceUrl: z.string().optional(),
});

/**
 * Server action to update an existing knowledge item
 * @param knowledgeId - The ID of the knowledge item to update
 * @param data - Object containing the fields to update (title, content, sourceUrl)
 * @returns Promise with success status and updated knowledge data or error
 */
export async function updateKnowledgeItemAction(knowledgeId: string, data: {
  title?: string;
  content?: string;
  sourceUrl?: string;
}) {
  const validation = UpdateKnowledgeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.errors };
  }

  // Ensure at least one field is being updated
  if (Object.keys(validation.data).length === 0) {
     return { success: false, error: "No fields provided for update." };
  }

  try {
    const result = await updateKnowledge(knowledgeId, validation.data);
    if (result.length === 0) {
      return { success: false, error: "Knowledge item not found or update failed" };
    }
    // Optional: Revalidate paths
    // revalidatePath(`/agent/...`); // Revalidate relevant paths
    return { success: true, data: result[0] }; // Return the first updated item
  } catch (error) {
    console.error("Failed to update knowledge item:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to delete a knowledge item
 * @param knowledgeId - The ID of the knowledge item to delete
 * @returns Promise with success status or error
 */
export async function deleteKnowledgeItemAction(knowledgeId: string) {
  // Basic validation for ID format (optional but recommended)
  if (!knowledgeId || typeof knowledgeId !== 'string' /*|| !isUUID(knowledgeId)*/) {
     return { success: false, error: "Invalid knowledge ID provided." };
  }

  try {
    // Optional: Check if item exists before deleting
    // const existing = await selectKnowledgeById(knowledgeId);
    // if (!existing) {
    //   return { success: false, error: "Knowledge item not found." };
    // }

    await deleteKnowledge(knowledgeId);
    // Optional: Revalidate paths
    // revalidatePath(`/agent/...`); // Revalidate relevant paths
    return { success: true };
  } catch (error) {
    console.error("Failed to delete knowledge item:", error);
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
