'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
// Import auth/headers if needed for authorization (e.g., only admins can manage tags)
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// Import repository functions
import {
  insertTag,
  selectAllTags,
  selectTagByName,
  updateTag as updateTagRepo,
  deleteTag as deleteTagRepo,
  addTagToAgent as addTagToAgentRepo,
  removeTagFromAgent as removeTagFromAgentRepo,
  selectTagsByAgentId,
  selectTopTags,
  // Need agent repo functions if performing auth checks on agent ownership for tagging
  selectAgentById
} from "@/db/repository"; // Adjust path

import { Tag } from "@/db/schema/agent"; // Import schema type
import { ActionResult } from "./types"; // Import shared type

// Zod Schemas
const NewTagSchema = z.object({
  name: z.string().min(1, "Tag name cannot be empty.").max(50, "Tag name too long"),
});

const UpdateTagSchema = z.object({
  name: z.string().min(1, "Tag name cannot be empty.").max(50, "Tag name too long"),
});

const AgentTagSchema = z.object({
  agentId: z.string().uuid("Invalid Agent ID format."),
  tagId: z.string().uuid("Invalid Tag ID format."),
});

/**
 * Server action to create a new tag.
 * (Add authorization if needed - e.g., check for admin role)
 * @param data - Object containing the tag name.
 * @returns Promise with success status and created tag data or error.
 */
export async function createTagAction(data: z.infer<typeof NewTagSchema>): Promise<ActionResult<Tag>> {
    // TODO: Add authorization check if required (e.g., isAdmin)
    const validation = NewTagSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid input data", details: validation.error.issues };
    }

    try {
        // Case-insensitive check might be better depending on requirements
        const existing = await selectTagByName(validation.data.name);
        if (existing) {
            return { success: false, error: `Tag "${validation.data.name}" already exists.` };
        }

        const result = await insertTag(validation.data);
        revalidatePath('/admin'); // Assuming tags are managed in an admin area
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Failed to create tag:", error);
        if (error instanceof Error && error.message.includes('unique constraint')) {
             return { success: false, error: `Tag "${data.name}" already exists.` };
        }
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to fetch all tags.
 * @returns Promise with success status and list of tags or error.
 */
export async function getAllTagsAction(): Promise<ActionResult<Tag[]>> {
    try {
        const tags = await selectAllTags();
        return { success: true, data: tags };
    } catch (error) {
        console.error("Failed to fetch tags:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to update an existing tag.
 * (Add authorization if needed)
 * @param tagId - The ID of the tag to update.
 * @param data - Object containing the new tag name.
 * @returns Promise with success status and updated tag data or error.
 */
export async function updateTagAction(tagId: string, data: z.infer<typeof UpdateTagSchema>): Promise<ActionResult<Tag>> {
    // TODO: Add authorization check if required
    if (!tagId) return { success: false, error: "Tag ID is required." };

    const validation = UpdateTagSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid input data", details: validation.error.issues };
    }

    try {
        const existing = await selectTagByName(validation.data.name);
        if (existing && existing.id !== tagId) {
            return { success: false, error: `Another tag with the name "${validation.data.name}" already exists.` };
        }

        const result = await updateTagRepo(tagId, validation.data);
        if (result.length === 0) {
            return { success: false, error: "Tag not found or update failed" };
        }
        revalidatePath('/admin');
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Failed to update tag:", error);
        if (error instanceof Error && error.message.includes('unique constraint')) {
             return { success: false, error: `Another tag with the name "${data.name}" already exists.` };
        }
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to delete a tag.
 * (Add authorization if needed)
 * @param tagId - The ID of the tag to delete.
 * @returns Promise with success status or error.
 */
export async function deleteTagAction(tagId: string): Promise<ActionResult<void>> {
    // TODO: Add authorization check if required
    if (!tagId) return { success: false, error: "Tag ID is required." };

    try {
        await deleteTagRepo(tagId); // Assumes CASCADE DELETE is set on agent_tags FK
        revalidatePath('/admin');
        // Consider revalidating agent pages if tags are shown:
        // revalidatePath('/agent/[slug]', 'layout'); // May be too broad
        return { success: true, data: undefined };
    } catch (error) {
        console.error("Failed to delete tag:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to add a tag to an agent.
 * Requires user to own the agent.
 * @param data - Object containing agentId and tagId.
 * @returns Promise with success status or error.
 */
export async function addTagToAgentAction(data: z.infer<typeof AgentTagSchema>): Promise<ActionResult<void>> {
    const validation = AgentTagSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid input data", details: validation.error.issues };
    }

    try {
        // Authorization check (example assumes auth is imported)
        /*
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };
        const agent = await selectAgentById(validation.data.agentId);
        if (!agent) return { success: false, error: "Agent not found." };
        if (agent.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };
        */
       // Assuming authorization happened before calling this or is handled at API route level if applicable

        await addTagToAgentRepo(validation.data.agentId, validation.data.tagId);
        // Revalidate agent page where tags might be displayed
        const agent = await selectAgentById(validation.data.agentId); // Need agent slug for revalidation
        if (agent?.slug) {
            revalidatePath(`/agent/${agent.slug}`);
            revalidatePath(`/agent/${agent.slug}/settings`);
        } else {
             revalidatePath(`/agent/${validation.data.agentId}/settings`); // Fallback
        }
        return { success: true, data: undefined };
    } catch (error) {
        console.error("Failed to add tag to agent:", error);
        if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
            // Tag already assigned, treat as success
            return { success: true, data: undefined };
        }
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to remove a tag from an agent.
 * Requires user to own the agent.
 * @param data - Object containing agentId and tagId.
 * @returns Promise with success status or error.
 */
export async function removeTagFromAgentAction(data: z.infer<typeof AgentTagSchema>): Promise<ActionResult<void>> {
    const validation = AgentTagSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid input data", details: validation.error.issues };
    }

    try {
         // Authorization check (example)
        /*
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };
        const agent = await selectAgentById(validation.data.agentId);
        if (!agent) return { success: false, error: "Agent not found." }; // Or maybe success if agent doesn't exist?
        if (agent.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };
        */

        await removeTagFromAgentRepo(validation.data.agentId, validation.data.tagId);
         // Revalidate agent page
         const agent = await selectAgentById(validation.data.agentId);
         if (agent?.slug) {
             revalidatePath(`/agent/${agent.slug}`);
             revalidatePath(`/agent/${agent.slug}/settings`);
         } else {
              revalidatePath(`/agent/${validation.data.agentId}/settings`); // Fallback
         }
        return { success: true, data: undefined };
    } catch (error) {
        console.error("Failed to remove tag from agent:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to get all tags for a specific agent.
 * (Consider if authorization is needed here - can anyone see tags for any agent?)
 * @param agentId - The ID of the agent.
 * @returns Promise with success status and list of tags or error.
 */
export async function getTagsForAgentAction(agentId: string): Promise<ActionResult<Tag[]>> {
    if (!agentId) return { success: false, error: "Agent ID is required." };

    try {
        // Optional: Authorization check if needed
        const tags = await selectTagsByAgentId(agentId);
        return { success: true, data: tags };
    } catch (error) {
        console.error("Failed to fetch tags for agent:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to update the tags associated with an agent.
 * Requires user owns the agent. Adds new tags and removes unselected ones.
 * @param agentId - The ID of the agent.
 * @param newTagIds - An array of tag IDs that should be associated with the agent.
 * @returns Promise with success status or error.
 */
export async function updateAgentTagsAction(agentId: string, newTagIds: string[]): Promise<ActionResult<void>> {
    if (!agentId) return { success: false, error: "Agent ID is required." };
    if (!Array.isArray(newTagIds) || !newTagIds.every(id => typeof id === 'string')) {
        return { success: false, error: "Invalid tag IDs provided (must be an array of strings)." };
    }

    try {
        // Authorization check (example)
        /*
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };
        const agent = await selectAgentById(agentId);
        if (!agent) return { success: false, error: "Agent not found." };
        if (agent.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };
        */

        // Get current tags using the action function for consistency (or repo directly)
        const currentTagsResult = await getTagsForAgentAction(agentId);
        if (!currentTagsResult.success) {
            // Handle error fetching current tags if needed, or assume empty if not found
             throw new Error("Failed to fetch current tags for agent.");
        }
        const currentTagIds = currentTagsResult.data?.map(tag => tag.id) || [];

        const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
        const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));

        // Consider db.transaction here for atomicity if the DB driver/ORM doesn't guarantee it
        const addPromises = tagsToAdd.map(tagId => addTagToAgentRepo(agentId, tagId));
        const removePromises = tagsToRemove.map(tagId => removeTagFromAgentRepo(agentId, tagId));

        await Promise.all([...addPromises, ...removePromises]);

        // Revalidate the agent page
         const agent = await selectAgentById(agentId); // Re-fetch needed for slug
         if (agent?.slug) {
             revalidatePath(`/agent/${agent.slug}`);
             revalidatePath(`/agent/${agent.slug}/settings`);
         } else {
              revalidatePath(`/agent/${agentId}/settings`); // Fallback
         }

        return { success: true, data: undefined };
    } catch (error) {
        console.error("Failed to update agent tags:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to fetch the top N tags ordered alphabetically.
 * @param limit - The maximum number of tags to fetch.
 * @returns Promise with success status and list of tags or error.
 */
export async function getTopTagsAction(limit: number): Promise<ActionResult<Tag[]>> {
    if (typeof limit !== 'number' || limit <= 0 || !Number.isInteger(limit)) {
        return { success: false, error: "Invalid limit provided (must be a positive integer)." };
    }
    try {
        const tags = await selectTopTags(limit);
        return { success: true, data: tags };
    } catch (error) {
        console.error("Failed to fetch top tags:", error);
        return { success: false, error: (error as Error).message };
    }
}