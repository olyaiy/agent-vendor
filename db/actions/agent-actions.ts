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
  updateTag as updateTagRepo,
  deleteTag as deleteTagRepo,
  addTagToAgent as addTagToAgentRepo,
  removeTagFromAgent as removeTagFromAgentRepo,
  selectTagsByAgentId,
} from "@/db/repository/agent-repository";
import { Agent } from "@/db/schema/agent"; // Removed unused Tag type
import { z } from "zod"; // Added for input validation
import { revalidatePath } from "next/cache"; // For potential cache invalidation
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { selectAgentById } from "@/db/repository/agent-repository"; // Added for remove action

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
export async function createTagAction(data: { name: string }) {
  const validation = NewTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.errors };
  }

  try {
    // Optional: Check if tag with the same name already exists
    // const existing = await selectTagByName(validation.data.name);
    // if (existing) {
    //   return { success: false, error: `Tag "${validation.data.name}" already exists.` };
    // }

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
export async function getAllTagsAction() {
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
export async function updateTagAction(tagId: string, data: { name: string }) {
  // Basic ID validation
  if (!tagId || typeof tagId !== 'string') {
     return { success: false, error: "Invalid tag ID provided." };
  }

  const validation = UpdateTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.errors };
  }

  try {
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
export async function deleteTagAction(tagId: string) {
  // Basic ID validation
  if (!tagId || typeof tagId !== 'string') {
     return { success: false, error: "Invalid tag ID provided." };
  }

  try {
    await deleteTagRepo(tagId);
    revalidatePath('/admin'); // Revalidate admin page
    // Also consider revalidating agent pages if tags are displayed there
    // revalidatePath('/agent/[agent-id]', 'layout');
    return { success: true };
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
export async function addTagToAgentAction(data: { agentId: string; tagId: string }) {
  const validation = AgentTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.errors };
  }

  try {
    await addTagToAgentRepo(validation.data.agentId, validation.data.tagId);
    // Revalidate agent page where tags might be displayed
    revalidatePath(`/agent/${validation.data.agentId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add tag to agent:", error);
    // Handle potential primary key violation if the relationship already exists
     if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        // Don't necessarily treat this as an error, the tag is already assigned
        return { success: true, message: "Tag already assigned to this agent." };
    }
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Server action to remove a tag from an agent.
 * @param data - Object containing agentId and tagId.
 * @returns Promise with success status or error.
 */
export async function removeTagFromAgentAction(data: { agentId: string; tagId: string }) {
  const validation = AgentTagSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid input data", details: validation.error.errors };
  }

  try {
    await removeTagFromAgentRepo(validation.data.agentId, validation.data.tagId);
    // Revalidate agent page
    revalidatePath(`/agent/${validation.data.agentId}`);
    return { success: true };
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
export async function getTagsForAgentAction(agentId: string) {
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
export async function updateAgentTagsAction(agentId: string, newTagIds: string[]) {
  // Basic validation
  if (!agentId || typeof agentId !== 'string') {
    return { success: false, error: "Invalid agent ID provided." };
  }
  if (!Array.isArray(newTagIds)) {
    return { success: false, error: "Invalid tag IDs provided." };
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

    return { success: true };
  } catch (error) {
    console.error("Failed to update agent tags:", error);
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
) {
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
    return { success: true, url: publicUrl };

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
) {
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
            console.log(`Successfully deleted R2 object: ${key}`);
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
    return { success: true };

  } catch (error) {
    console.error(`Failed to remove agent ${imageType}:`, error);
    return { success: false, error: `An unexpected error occurred during removal: ${(error as Error).message}` };
  }
}
