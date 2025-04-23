'use server'

import {
  insertAgent,
  selectRecentAgents,
  selectAllModels,
  updateAgent as updateAgentRepo,
  insertKnowledge, // Added
  updateKnowledge, // Added
  deleteKnowledge, // Added
  // Tag repository functions
  insertTag,
  selectAllTags,
  selectTagByName, // Added for tag uniqueness check
  updateTag as updateTagRepo,
  deleteTag as deleteTagRepo,
  addTagToAgent as addTagToAgentRepo,
  removeTagFromAgent as removeTagFromAgentRepo,
  selectTagsByAgentId,
  selectTopTags, // Added
  selectAgentsByTagId, // Added for base models
  // Model repository functions (New)
  insertModel,
  updateModel as updateModelRepo,
  deleteModel as deleteModelRepo,
  selectModelByName,
  countAgents, // Added countAgents
  selectAgentsByCreatorId, // Added for fetching user's agents
  selectAgentById, // Added for delete action authorization
  deleteAgent as deleteAgentRepo,
  selectAgentWithModelBySlug,
  selectKnowledgeByAgentId, // Added for delete action
} from "@/db/repository/agent-repository";
// Corrected: Added Knowledge and Tag back to the import
import { Agent, Model, Knowledge, Tag } from "@/db/schema/agent";
import { z } from "zod"; // Added for input validation
import { revalidatePath } from "next/cache"; // For potential cache invalidation
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth"; // Import auth
import { headers } from "next/headers"; // Import headers

// Helper type for action results
export type ActionResult<T> =
  | { success: true; data: T }
  // Corrected: Replaced 'any' with a more specific type for Zod flattened errors
  | { success: false; error: string; details?: Record<string, string[]> | undefined };


/**
 * Server action to create a new agent
 * This allows us to safely perform database operations from client components
 * @param data - Object containing all required agent properties
 * @returns Promise with success status and created agent data or error
 */
export async function createAgent(data: {
  name: string;
  description: string | null;
  slug: string | null;
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

// Define the return type for the action
type UserAgentResult = Array<Agent & { modelName: string; tags: { id: string; name: string }[] }>;

/**
 * Server action to fetch agents for the currently authenticated user.
 * @returns Promise with success status and user's agent list or error.
 */
export async function getUserAgentsAction(): Promise<ActionResult<UserAgentResult>> {
  try {
    // Get the user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return { success: false, error: "User not authenticated." };
    }

    const userId = session.user.id;

    // Fetch agents for the user using the new repository function
    const agents = await selectAgentsByCreatorId(userId);

    return { success: true, data: agents };
  } catch (error) {
    console.error("Failed to fetch user agents:", error);
    return { success: false, error: (error as Error).message };
  }
}


// --- Knowledge Actions ---

// Schema for validating new knowledge item data
const NewKnowledgeSchema = z.object({
  agentId: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  sourceUrl: z.string().url().optional().or(z.literal('')), // Allow empty string or valid URL
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
}): Promise<ActionResult<Knowledge>> { // Added Knowledge type
  const validation = NewKnowledgeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  try {
    // Ensure sourceUrl is null if empty string or undefined before inserting
    const dataToInsert = {
      ...validation.data,
      sourceUrl: validation.data.sourceUrl || null,
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
  sourceUrl: z.string().url().optional().or(z.literal('')), // Allow empty string or valid URL
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
}): Promise<ActionResult<Knowledge>> { // Added Knowledge type
  const validation = UpdateKnowledgeSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  // Ensure at least one field is being updated
  if (Object.keys(validation.data).length === 0) {
     return { success: false, error: "No fields provided for update." };
  }

  try {
     // Ensure sourceUrl is null if empty string before updating
     const dataToUpdate = {
       ...validation.data,
       sourceUrl: validation.data.sourceUrl === '' ? null : validation.data.sourceUrl,
     };
    const result = await updateKnowledge(knowledgeId, dataToUpdate);
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
 * @returns Promise with success status or error.
 */
export async function deleteKnowledgeItemAction(knowledgeId: string): Promise<ActionResult<void>> {
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
    return { success: true, data: undefined }; // Explicitly return undefined data on success
  } catch (error) {
    console.error("Failed to delete knowledge item:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to fetch agents with optional tag and search filtering, and pagination.
 * @param tagName - Optional tag name to filter agents by.
 * @param searchQuery - Optional search query to filter agents by name, description, or tag name.
 * @param page - The current page number (1-based).
 * @param pageSize - The number of agents per page.
 * @returns Promise with success status and paginated agent list and total count, or error.
 */
// Define the expected agent type returned by selectRecentAgents, including createdAt and visibility
type AgentWithTagsAndDate = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  slug: string | null;
  avatarUrl: string | null;
  creatorId: string;
  tags: { id: string; name: string }[];
  createdAt: Date;
  visibility: string; // Added visibility
};

export async function getRecentAgents(
  tagName?: string,
  searchQuery?: string,
  page: number = 1, // Default to page 1
  pageSize: number = 20 // Default page size
): Promise<ActionResult<{ agents: AgentWithTagsAndDate[]; totalCount: number }>> {
  try {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Fetch agents for the current page
    const agents: AgentWithTagsAndDate[] = await selectRecentAgents(tagName, searchQuery, limit, offset);

    // Get the total count of agents matching the filter criteria
    const totalCount = await countAgents(tagName, searchQuery);

    // If searchQuery is provided, sort the results in JavaScript (ranking logic)
    if (searchQuery && agents.length > 0) {
      const queryLower = searchQuery.toLowerCase();

      const getRank = (agent: AgentWithTagsAndDate): number => {
        if (agent.name.toLowerCase().includes(queryLower)) {
          return 1; // Name match
        }
        if (agent.tags.some(tag => tag.name.toLowerCase().includes(queryLower))) {
          return 2; // Tag match
        }
        if (agent.description?.toLowerCase().includes(queryLower)) {
          return 3; // Description match
        }
        return 4; // Should not happen if WHERE clause works, but acts as fallback
      };

      agents.sort((a, b) => {
        const rankA = getRank(a);
        const rankB = getRank(b);

        if (rankA !== rankB) {
          return rankA - rankB; // Sort by rank ascending
        }

        // If ranks are the same, sort by creation date descending
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return { success: true, data: { agents, totalCount } };
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to fetch the 6 base model agents by their specific tag ID.
 * @returns Promise with success status and agent list (id, name, thumbnailUrl) or error
 */
export async function getBaseModelAgentsAction(): Promise<ActionResult<Array<{ 
    id: string; 
    name: string; 
    thumbnailUrl: string | null ;
    slug: string;
  }>>> {
    const baseModelTagId = "575527b1-803a-4c96-8a4a-58ca997f08bd";
    const limit = 10;
    try {
      const agents = await selectAgentsByTagId(baseModelTagId, limit);
      return { success: true, data: agents };
    } catch (error) {
      console.error("Failed to fetch base model agents:", error);
      return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to fetch all available models
 * This enables secure data fetching from client components
 * @returns Promise with success status and model list or error.
 */
export async function getAllModels(): Promise<ActionResult<Model[]>> {
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
 * @returns Promise with success status and updated agent data or error.
 */
export async function updateAgentAction(agentId: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>>): Promise<ActionResult<Agent>> {
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


// ========================================
// Model Actions (New)
// ========================================

// Schema for validating new model data
const NewModelSchema = z.object({
  model: z.string().min(1, "Model name cannot be empty.").max(100, "Model name too long"),
  description: z.string().max(500, "Description too long").nullable().optional(), // Allow null or string
});

/**
 * Server action to create a new model.
 * @param data - Object containing the model name and optional description.
 * @returns Promise with success status and created model data or error.
 */
export async function createModelAction(data: { model: string; description: string | null }): Promise<ActionResult<Model>> {
  const validation = NewModelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  try {
    // Check if model with the same name already exists
    const existing = await selectModelByName(validation.data.model);
    if (existing) {
      return { success: false, error: `Model "${validation.data.model}" already exists.` };
    }

    const result = await insertModel({
        model: validation.data.model,
        description: validation.data.description ?? null // Ensure null if undefined/empty
    });
    revalidatePath('/admin'); // Revalidate admin page to show new model
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to create model:", error);
    // Handle potential unique constraint errors (though checked above, good practice)
    if (error instanceof Error && error.message.includes('unique constraint')) {
        return { success: false, error: `Model "${data.model}" already exists.` };
    }
    return { success: false, error: (error as Error).message };
  }
}

// Schema for validating model updates
const UpdateModelSchema = z.object({
  model: z.string().min(1, "Model name cannot be empty.").max(100, "Model name too long").optional(),
  description: z.string().max(500, "Description too long").nullable().optional(),
});

/**
 * Server action to update an existing model.
 * @param modelId - The ID of the model to update.
 * @param data - Object containing the fields to update (model name, description).
 * @returns Promise with success status and updated model data or error.
 */
export async function updateModelAction(modelId: string, data: { model?: string; description?: string | null }): Promise<ActionResult<Model>> {
  // Basic ID validation
  if (!modelId || typeof modelId !== 'string') {
     return { success: false, error: "Invalid model ID provided." };
  }

  const validation = UpdateModelSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  // Ensure at least one field is being updated
   if (Object.keys(validation.data).length === 0) {
      return { success: false, error: "No fields provided for update." };
   }

  try {
    // Check for name conflict only if name is being changed
    if (validation.data.model) {
        const existing = await selectModelByName(validation.data.model);
        // If a model with the new name exists AND it's not the same model we are updating
        if (existing && existing.id !== modelId) {
            return { success: false, error: `Another model with the name "${validation.data.model}" already exists.` };
        }
    }

    const result = await updateModelRepo(modelId, {
        model: validation.data.model,
        // Handle null explicitly for description update
        description: data.description === undefined ? undefined : (data.description ?? null)
    });
    if (result.length === 0) {
      return { success: false, error: "Model not found or update failed" };
    }
    revalidatePath('/admin'); // Revalidate admin page
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to update model:", error);
     // Handle potential unique constraint errors
     if (error instanceof Error && error.message.includes('unique constraint')) {
        return { success: false, error: `Another model with the name "${data.model}" already exists.` };
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to delete a model.
 * @param modelId - The ID of the model to delete.
 * @returns Promise with success status or error.
 */
export async function deleteModelAction(modelId: string): Promise<ActionResult<void>> {
  // Basic ID validation
  if (!modelId || typeof modelId !== 'string') {
     return { success: false, error: "Invalid model ID provided." };
  }

  try {
    await deleteModelRepo(modelId); // Repository function now handles the "in use" check
    revalidatePath('/admin'); // Revalidate admin page
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete model:", error);
    // Check for the specific error thrown by the repository
    if (error instanceof Error && error.message.includes("Model is currently in use")) {
        return { success: false, error: error.message }; // Pass the specific error message to the client
    }
    return { success: false, error: (error as Error).message };
  }
}


// ========================================
// Tag Actions
// ========================================

// Schema for validating new tag data
const NewTagSchema = z.object({
  name: z.string().min(1, "Tag name cannot be empty.").max(50, "Tag name too long"), // Added max length
});

/**
 * Server action to create a new tag.
 * @param data - Object containing the tag name.
 * @returns Promise with success status and created tag data or error.
 */
export async function createTagAction(data: { name: string }): Promise<ActionResult<Tag>> { // Added Tag type
  const validation = NewTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  try {
    // Optional: Check if tag with the same name already exists (case-insensitive check might be needed)
    const existing = await selectTagByName(validation.data.name);
    if (existing) {
      return { success: false, error: `Tag "${validation.data.name}" already exists.` };
    }

    const result = await insertTag(validation.data);
    revalidatePath('/admin'); // Revalidate admin page to show new tag
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to create tag:", error);
    // Handle potential unique constraint errors if not checking existence above
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
export async function getAllTagsAction(): Promise<ActionResult<Tag[]>> { // Added Tag[] type
  try {
    const tags = await selectAllTags();
    return { success: true, data: tags };
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Schema for validating tag updates
const UpdateTagSchema = z.object({
  name: z.string().min(1, "Tag name cannot be empty.").max(50, "Tag name too long"),
});

/**
 * Server action to update an existing tag.
 * @param tagId - The ID of the tag to update.
 * @param data - Object containing the new tag name.
 * @returns Promise with success status and updated tag data or error.
 */
export async function updateTagAction(tagId: string, data: { name: string }): Promise<ActionResult<Tag>> { // Added Tag type
  // Basic ID validation
  if (!tagId || typeof tagId !== 'string') {
     return { success: false, error: "Invalid tag ID provided." };
  }

  const validation = UpdateTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  try {
     // Check for name conflict before updating
     const existing = await selectTagByName(validation.data.name);
     if (existing && existing.id !== tagId) {
         return { success: false, error: `Another tag with the name "${validation.data.name}" already exists.` };
     }

    const result = await updateTagRepo(tagId, validation.data);
    if (result.length === 0) {
      return { success: false, error: "Tag not found or update failed" };
    }
    revalidatePath('/admin'); // Revalidate admin page
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to update tag:", error);
     // Handle potential unique constraint errors
     if (error instanceof Error && error.message.includes('unique constraint')) {
        return { success: false, error: `Another tag with the name "${data.name}" already exists.` };
     }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to delete a tag.
 * @param tagId - The ID of the tag to delete.
 * @returns Promise with success status or error.
 */
export async function deleteTagAction(tagId: string): Promise<ActionResult<void>> {
  // Basic ID validation
  if (!tagId || typeof tagId !== 'string') {
     return { success: false, error: "Invalid tag ID provided." };
  }

  try {
    await deleteTagRepo(tagId);
    revalidatePath('/admin'); // Revalidate admin page
    // Also consider revalidating agent pages if tags are displayed there
    // revalidatePath('/agent/[agent-id]', 'layout');
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return { success: false, error: (error as Error).message };
  }
}

// ========================================
// Agent-Tag Relationship Actions
// ========================================

// Schema for validating agent-tag operations
const AgentTagSchema = z.object({
  agentId: z.string().uuid("Invalid Agent ID format."),
  tagId: z.string().uuid("Invalid Tag ID format."),
});

/**
 * Server action to add a tag to an agent.
 * @param data - Object containing agentId and tagId.
 * @returns Promise with success status or error.
 */
export async function addTagToAgentAction(data: { agentId: string; tagId: string }): Promise<ActionResult<void>> {
  const validation = AgentTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  try {
    await addTagToAgentRepo(validation.data.agentId, validation.data.tagId);
    // Revalidate agent page where tags might be displayed
    revalidatePath(`/agent/${validation.data.agentId}`);
    revalidatePath(`/agent/${validation.data.agentId}/settings`); // Also revalidate settings
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to add tag to agent:", error);
    // Handle potential primary key violation if the relationship already exists
     if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        // Don't necessarily treat this as an error, the tag is already assigned
        return { success: true, data: undefined }; // Still success
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to remove a tag from an agent.
 * @param data - Object containing agentId and tagId.
 * @returns Promise with success status or error.
 */
export async function removeTagFromAgentAction(data: { agentId: string; tagId: string }): Promise<ActionResult<void>> {
  const validation = AgentTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.flatten().fieldErrors };
  }

  try {
    await removeTagFromAgentRepo(validation.data.agentId, validation.data.tagId);
    // Revalidate agent page
    revalidatePath(`/agent/${validation.data.agentId}`);
    revalidatePath(`/agent/${validation.data.agentId}/settings`); // Also revalidate settings
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to remove tag from agent:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to get all tags for a specific agent.
 * @param agentId - The ID of the agent.
 * @returns Promise with success status and list of tags or error.
 */
export async function getTagsForAgentAction(agentId: string): Promise<ActionResult<Tag[]>> { // Added Tag[] type
   // Basic ID validation
  if (!agentId || typeof agentId !== 'string' /*|| !isUUID(agentId)*/) {
     return { success: false, error: "Invalid agent ID provided." };
  }

  try {
    const tags = await selectTagsByAgentId(agentId);
    return { success: true, data: tags };
  } catch (error) {
    console.error("Failed to fetch tags for agent:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to update the tags associated with an agent.
 * It adds new tags and removes tags that are no longer selected.
 * @param agentId - The ID of the agent.
 * @param newTagIds - An array of tag IDs that should be associated with the agent.
 * @returns Promise with success status or error.
 */
export async function updateAgentTagsAction(agentId: string, newTagIds: string[]): Promise<ActionResult<void>> {
  // Basic validation
  if (!agentId || typeof agentId !== 'string') {
    return { success: false, error: "Invalid agent ID provided." };
  }
  if (!Array.isArray(newTagIds) || !newTagIds.every(id => typeof id === 'string')) { // Added validation for array elements
    return { success: false, error: "Invalid tag IDs provided (must be an array of strings)." };
  }

  try {
    // Get current tags for the agent
    const currentTagsResult = await getTagsForAgentAction(agentId);
    if (!currentTagsResult.success) {
      throw new Error("Failed to fetch current tags for agent.");
    }
    const currentTagIds = currentTagsResult.data?.map(tag => tag.id) || [];

    // Determine tags to add and remove
    const tagsToAdd = newTagIds.filter(id => !currentTagIds.includes(id));
    const tagsToRemove = currentTagIds.filter(id => !newTagIds.includes(id));

    // Perform database operations (ideally within a transaction, but Drizzle might handle atomicity)
    // TODO: Consider wrapping in db.transaction if complex operations arise later
    const addPromises = tagsToAdd.map(tagId => addTagToAgentRepo(agentId, tagId));
    const removePromises = tagsToRemove.map(tagId => removeTagFromAgentRepo(agentId, tagId));

    await Promise.all([...addPromises, ...removePromises]);

    // Revalidate the agent page
    revalidatePath(`/agent/${agentId}`);
    revalidatePath(`/agent/${agentId}/settings`); // Also revalidate settings

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
export async function getTopTagsAction(limit: number): Promise<ActionResult<Tag[]>> { // Added Tag[] type
  try {
    // Basic validation for limit
    if (typeof limit !== 'number' || limit <= 0 || !Number.isInteger(limit)) { // Added integer check
      return { success: false, error: "Invalid limit provided (must be a positive integer)." };
    }
    const tags = await selectTopTags(limit);
    return { success: true, data: tags };
  } catch (error) {
    console.error("Failed to fetch top tags:", error);
    return { success: false, error: (error as Error).message };
  }
}


// ========================================
// Agent Image Actions
// ========================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

/**
 * Server action to upload an agent image (thumbnail or avatar) to R2.
 * @param agentId - The ID of the agent.
 * @param formData - FormData containing the image file under the key 'file'.
 * @param imageType - 'thumbnail' or 'avatar'.
 * @returns Promise with success status and the public URL or error.
 */
export async function uploadAgentImageAction(
  agentId: string,
  formData: FormData,
  imageType: 'thumbnail' | 'avatar'
): Promise<ActionResult<{ url: string }>> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "No file provided." };
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { success: false, error: "Invalid file type. Only JPG, PNG, and WEBP are allowed." };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.` };
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const key = `agents/${agentId}/${imageType}-${Date.now()}.${file.name.split('.').pop()}`;
    const bucketName = process.env.R2_BUCKET_NAME!;
    const publicUrlBase = process.env.R2_PUBLIC_URL_BASE!;

    if (!bucketName || !publicUrlBase || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
        console.error("R2 environment variables are not fully configured.");
        return { success: false, error: "Server configuration error for file uploads." };
    }

    // Upload to R2
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.type,
        ACL: 'public-read', // Ensure object is publicly readable
      })
    );

    const publicUrl = `${publicUrlBase}/${key}`; // Public URL path doesn't include bucket name for r2.dev

    // Update database
    const updateData = imageType === 'thumbnail'
      ? { thumbnailUrl: publicUrl }
      : { avatarUrl: publicUrl };

    const updateResult = await updateAgentRepo(agentId, updateData);

    if (updateResult.length === 0) {
      // Attempt to delete the uploaded file if DB update fails
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
      } catch (deleteError) {
        console.error(`Failed to clean up R2 object ${key} after DB update failure:`, deleteError);
      }
      return { success: false, error: "Failed to update agent record with new image URL." };
    }

    revalidatePath(`/agent/${agentId}/settings`);
    return { success: true, data: { url: publicUrl } };

  } catch (error) {
    console.error("Failed to upload agent image:", error);
    return { success: false, error: `An unexpected error occurred during upload: ${(error as Error).message}` };
  }
}


/**
 * Server action to remove an agent image (thumbnail or avatar).
 * Deletes the file from R2 and sets the corresponding URL field in the DB to null.
 * @param agentId - The ID of the agent.
 * @param imageType - 'thumbnail' or 'avatar'.
 * @returns Promise with success status or error.
 */
export async function removeAgentImageAction(
  agentId: string,
  imageType: 'thumbnail' | 'avatar'
): Promise<ActionResult<void>> {
  try {
    const agentData = await selectAgentById(agentId);
    if (!agentData) {
      return { success: false, error: "Agent not found." };
    }

    const currentUrl = imageType === 'thumbnail' ? agentData.thumbnailUrl : agentData.avatarUrl;
    const bucketName = process.env.R2_BUCKET_NAME!;
    const publicUrlBase = process.env.R2_PUBLIC_URL_BASE!;

     if (!bucketName || !publicUrlBase || !process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
        console.error("R2 environment variables are not fully configured for removal.");
        // Proceed to clear DB link even if R2 config is missing
     }

    // Attempt to delete from R2 if URL exists and config is present
    if (currentUrl && bucketName && publicUrlBase && currentUrl.startsWith(publicUrlBase)) {
      // Key parsing: URL is <publicUrlBase>/<key>
      const expectedPrefix = `${publicUrlBase}/`;
      if (!currentUrl.startsWith(expectedPrefix)) {
          console.warn(`URL ${currentUrl} does not match expected prefix ${expectedPrefix}. Skipping R2 delete.`);
          // Proceed to clear DB link anyway
      } else {
          const key = currentUrl.substring(expectedPrefix.length);
          try {
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: bucketName, // Still need bucket name for the API command
                Key: key,
              })
            );

          } catch (deleteError) {
            // Log the error but proceed to update the DB
            console.error(`Failed to delete R2 object ${key}:`, deleteError);
            // Optionally return a specific warning, but success should indicate DB update attempt
          }
      }
    }

    // Update database to remove the link, regardless of R2 deletion success
    const updateData = imageType === 'thumbnail'
      ? { thumbnailUrl: null }
      : { avatarUrl: null };

    const updateResult = await updateAgentRepo(agentId, updateData);

    if (updateResult.length === 0) {
      // This is less critical than upload failure, but still indicates an issue
      console.warn(`Agent record for ${agentId} not found or failed to update during image removal.`);
      // Return success as the primary goal (removing link) might eventually sync,
      // or return false if strict consistency is required. Let's return success for now.
    }

    revalidatePath(`/agent/${agentId}/settings`);
    return { success: true, data: undefined };

  } catch (error) {
    console.error(`Failed to remove agent ${imageType}:`, error);
    return { success: false, error: `An unexpected error occurred during removal: ${(error as Error).message}` };
  }
}

/**
 * Server action to delete an agent.
 * Performs authorization check and deletes the agent and associated data.
 * @param agentId - The ID of the agent to delete.
 * @returns Promise with success status or error.
 */
export async function deleteAgentAction(agentId: string): Promise<ActionResult<void>> {
  // Basic ID validation
  if (!agentId || typeof agentId !== 'string') {
    return { success: false, error: "Invalid agent ID provided." };
  }

  try {
    // Get the user session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session || !session.user) {
      return { success: false, error: "User not authenticated." };
    }

    // Fetch agent details to check creator
    const agentToDelete = await selectAgentById(agentId);

    if (!agentToDelete) {
      return { success: false, error: "Agent not found." };
    }

    // Check if the logged-in user is the creator
    if (session.user.id !== agentToDelete.creatorId) {
      return { success: false, error: "Unauthorized: You do not have permission to delete this agent." };
    }

    // Delete the agent (repository handles cascading deletes for knowledge and agent_tags)
    await deleteAgentRepo(agentId);

    // Revalidate relevant caches
    revalidatePath(`/profile/agents`); // Revalidate the user's agents list
    revalidatePath(`/agents`); // Revalidate the public agents list (if applicable)
    // Consider revalidating the specific agent page path if it might still be cached
    revalidatePath(`/agent/${agentId}`);


    return { success: true, data: undefined };

  } catch (error) {
    console.error("Failed to delete agent:", error);
    return { success: false, error: (error as Error).message };
  }
}





/**
 * Server action to fetch all of an agent’s settings by slug:
 *   – agent record (with model+tags)
 *   – knowledge items
 *   – all available tags & models
 */
export async function getAgentSettingsBySlugAction(
  slug: string
): Promise<ActionResult<{
  agent: Awaited<ReturnType<typeof selectAgentWithModelBySlug>>,
  knowledge: Knowledge[],
  allTags: Tag[],
  agentTags: Tag[],
  allModels: Model[]
}>> {
  // 1) lookup agent
  const agentRec = await selectAgentWithModelBySlug(slug);
  if (!agentRec) {
    return { success: false, error: "Agent not found." };
  }

  // 2) fetch everything in parallel
  const [
    knowledge,
    allTags,
    agentTags,
    allModels
  ] = await Promise.all([
    selectKnowledgeByAgentId(agentRec.id),
    selectAllTags(),
    selectTagsByAgentId(agentRec.id),
    selectAllModels()
  ]);

  return {
    success: true,
    data: {
      agent: agentRec,
      knowledge,
      allTags,
      agentTags,
      allModels
    }
  };
}
