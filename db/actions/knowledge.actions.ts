'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth"; // Import auth if needed for authorization
import { headers } from "next/headers";

// Import repository functions
import {
  insertKnowledge,
  updateKnowledge,
  deleteKnowledge,
  selectKnowledgeById, // Keep if needed for checks
  selectAgentById // Needed for authorization check
} from "@/db/repository"; // Adjust path

import { Knowledge } from "@/db/schema/agent"; // Import schema type
import { ActionResult } from "./types"; // Import shared type

// Zod Schemas for validation
const NewKnowledgeSchema = z.object({
  agentId: z.string().uuid("Invalid Agent ID format."),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().url("Invalid URL format.").max(2048, "URL too long").optional().or(z.literal('')),
});

const UpdateKnowledgeSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(255).optional(),
  content: z.string().min(1, "Content cannot be empty").optional(),
  sourceUrl: z.string().url("Invalid URL format.").max(2048).nullable().optional().or(z.literal('')), // Allow null/empty for removal
});


/**
 * Server action to add a new knowledge item for an agent.
 * Includes authorization check.
 * @param data - Object containing title, content, agentId, and optional sourceUrl
 * @returns Promise with success status and created knowledge data or error
 */
export async function addKnowledgeItemAction(data: z.infer<typeof NewKnowledgeSchema>): Promise<ActionResult<Knowledge>> {
  const validation = NewKnowledgeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.issues };
  }

  try {
    // Authorization: Check if user owns the agent
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "User not authenticated." };
    const agent = await selectAgentById(validation.data.agentId);
    if (!agent) return { success: false, error: "Agent not found." };
    if (agent.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

    const dataToInsert = {
      ...validation.data,
      sourceUrl: validation.data.sourceUrl || null, // Store empty string as null
    };
    const result = await insertKnowledge(dataToInsert);

    revalidatePath(`/agent/${agent.slug}/settings`); // Revalidate settings page using slug
    return { success: true, data: result[0] };

  } catch (error) {
    console.error("Failed to add knowledge item:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to update an existing knowledge item.
 * Includes authorization check.
 * @param knowledgeId - The ID of the knowledge item to update
 * @param data - Object containing the fields to update (title, content, sourceUrl)
 * @returns Promise with success status and updated knowledge data or error
 */
export async function updateKnowledgeItemAction(knowledgeId: string, data: z.infer<typeof UpdateKnowledgeSchema>): Promise<ActionResult<Knowledge>> {
  if (!knowledgeId) return { success: false, error: "Knowledge ID is required." };

  const validation = UpdateKnowledgeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.issues };
  }
  if (Object.keys(validation.data).length === 0) {
    return { success: false, error: "No fields provided for update." };
  }

  try {
     // Authorization: Check if user owns the agent associated with this knowledge item
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "User not authenticated." };
    const knowledgeItem = await selectKnowledgeById(knowledgeId);
    if (!knowledgeItem) return { success: false, error: "Knowledge item not found." };
    const agent = await selectAgentById(knowledgeItem.agentId);
    if (!agent) return { success: false, error: "Associated agent not found." }; // Should not happen if FK constraint exists
    if (agent.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

    const dataToUpdate = {
        ...validation.data,
        // Handle explicit null/empty string for sourceUrl update
        sourceUrl: validation.data.sourceUrl === undefined ? undefined : (validation.data.sourceUrl || null),
      };

    const result = await updateKnowledge(knowledgeId, dataToUpdate);
    if (result.length === 0) {
      return { success: false, error: "Knowledge item not found or update failed" };
    }

    revalidatePath(`/agent/${agent.slug}/settings`); // Revalidate settings page
    return { success: true, data: result[0] };

  } catch (error) {
    console.error("Failed to update knowledge item:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to delete a knowledge item.
 * Includes authorization check.
 * @param knowledgeId - The ID of the knowledge item to delete
 * @returns Promise with success status or error.
 */
export async function deleteKnowledgeItemAction(knowledgeId: string): Promise<ActionResult<void>> {
  if (!knowledgeId) return { success: false, error: "Knowledge ID is required." };

  try {
     // Authorization: Check if user owns the agent associated with this knowledge item
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "User not authenticated." };
    const knowledgeItem = await selectKnowledgeById(knowledgeId);
    if (!knowledgeItem) return { success: false, error: "Knowledge item not found." }; // Or return success if already deleted?
    const agent = await selectAgentById(knowledgeItem.agentId);
    if (!agent) return { success: false, error: "Associated agent not found." };
    if (agent.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

    await deleteKnowledge(knowledgeId);

    revalidatePath(`/agent/${agent.slug}/settings`); // Revalidate settings page
    return { success: true, data: undefined };

  } catch (error) {
    console.error("Failed to delete knowledge item:", error);
    return { success: false, error: (error as Error).message };
  }
}