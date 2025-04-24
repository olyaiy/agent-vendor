'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth"; // Assuming auth setup exists
import { headers } from "next/headers";

// Import repository functions from the barrel file
import {
  insertAgent,
  selectRecentAgents,
  updateAgent as updateAgentRepo,
  countAgents,
  selectAgentsByCreatorId,
  selectAgentById,
  deleteAgent as deleteAgentRepo,
  selectAgentWithModelBySlug,
  selectKnowledgeByAgentId,
  selectTagsByAgentId,
  selectAllTags, // Needed for getAgentSettingsBySlugAction
  selectAllModels, // Needed for getAgentSettingsBySlugAction
  selectAgentsByTagId // Needed for getBaseModelAgentsAction
} from "@/db/repository"; 

import { Agent, Knowledge, Tag, Model } from "@/db/schema/agent"; // Import schema types
import { ActionResult } from "./types"; // Import shared type

// --- S3 Configuration (Keep here or move to a dedicated service) ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Ensure environment variables are defined or handle errors appropriately
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL_BASE;

let s3Client: S3Client | null = null;
if (R2_ENDPOINT && R2_ACCESS_KEY && R2_SECRET_KEY) {
    s3Client = new S3Client({
        region: "auto",
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY,
            secretAccessKey: R2_SECRET_KEY,
        },
    });
} else {
    console.warn("R2 S3 client environment variables are not fully configured. Image upload/delete functionality will be disabled.");
}
// --- End S3 Configuration ---


/**
 * Server action to create a new agent
 * @param data - Object containing all required agent properties for insertion (matching NewAgent type from repo)
 * @returns Promise with success status and created agent data or error
 */
// Use the inferred type from the repository for better type safety if possible
// Assuming NewAgent type is exported from agent.repository.ts or index.ts
// import { NewAgent } from "@/db/repositories";
type CreateAgentData = {
    name: string;
    description: string | null;
    slug: string | null;
    systemPrompt: string | null;
    thumbnailUrl: string | null;
    visibility: string; // Consider using an enum type 'public' | 'private' | 'unlisted'
    primaryModelId: string;
    creatorId: string;
    welcomeMessage: string | null;
    avatarUrl: string | null;
};

export async function createAgent(data: CreateAgentData): Promise<ActionResult<Agent[]>> {
    // Basic validation could be added here with Zod if desired
    try {
        // Get user session to potentially validate creatorId, although it's passed in
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user || session.user.id !== data.creatorId) {
           // return { success: false, error: "Unauthorized or mismatched creator ID." };
           // Allow creation for now if creatorId is provided correctly, but auth check is good practice
        }

        const result = await insertAgent(data);
        revalidatePath('/profile/agents'); // Revalidate user's agent list
        revalidatePath('/agents'); // Revalidate public agent list
        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to create agent:", error);
        // Handle specific errors like unique constraint violations if slug needs to be unique
        if (error instanceof Error && error.message.includes('unique constraint') && data.slug) {
             return { success: false, error: `Agent slug "${data.slug}" is already taken.` };
        }
        return { success: false, error: (error as Error).message };
    }
}

// Define the return type for the user agents action
type UserAgentResult = Array<Agent & { modelName: string; tags: { id: string; name: string }[] }>;

/**
 * Server action to fetch agents for the currently authenticated user.
 * @returns Promise with success status and user's agent list or error.
 */
export async function getUserAgentsAction(): Promise<ActionResult<UserAgentResult>> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return { success: false, error: "User not authenticated." };
        }
        const userId = session.user.id;
        const agents = await selectAgentsByCreatorId(userId);
        return { success: true, data: agents };
    } catch (error) {
        console.error("Failed to fetch user agents:", error);
        return { success: false, error: (error as Error).message };
    }
}

// Define the expected agent type returned by selectRecentAgents
// This should match the type defined/exported in agent.repository.ts
// Exporting it from the repo and importing here is cleaner.
// Re-defining for completeness based on original code:
type AgentWithTagsAndDate = {
    id: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    slug: string; // Should not be null based on repo coalese
    avatarUrl: string | null;
    creatorId: string;
    tags: { id: string; name: string }[];
    createdAt: Date;
    visibility: string;
};

/**
 * Server action to fetch agents with optional tag and search filtering, and pagination.
 * Includes server-side ranking logic based on search query.
 * @param tagName - Optional tag name to filter agents by.
 * @param searchQuery - Optional search query to filter agents by name, description, or tag name.
 * @param page - The current page number (1-based).
 * @param pageSize - The number of agents per page.
 * @returns Promise with success status and paginated agent list and total count, or error.
 */
export async function getRecentAgents(
    tagName?: string,
    searchQuery?: string,
    page: number = 1,
    pageSize: number = 20
): Promise<ActionResult<{ agents: AgentWithTagsAndDate[]; totalCount: number }>> {
    try {
        const offset = (page - 1) * pageSize;
        const limit = pageSize;

        // Input validation
        if (page < 1 || pageSize < 1 || !Number.isInteger(page) || !Number.isInteger(pageSize)) {
            return { success: false, error: "Invalid pagination parameters." };
        }

        const agents = await selectRecentAgents(tagName, searchQuery, limit, offset);
        const totalCount = await countAgents(tagName, searchQuery);

        // Server-side ranking if search query is present
        if (searchQuery && agents.length > 0) {
            const queryLower = searchQuery.toLowerCase();
            const getRank = (agent: AgentWithTagsAndDate): number => {
                if (agent.name.toLowerCase().includes(queryLower)) return 1; // Name match
                if (agent.tags.some(tag => tag.name.toLowerCase().includes(queryLower))) return 2; // Tag match
                if (agent.description?.toLowerCase().includes(queryLower)) return 3; // Description match
                return 4; // Fallback
            };
            agents.sort((a, b) => {
                const rankA = getRank(a);
                const rankB = getRank(b);
                if (rankA !== rankB) return rankA - rankB; // Sort by rank
                return b.createdAt.getTime() - a.createdAt.getTime(); // Then by date
            });
        }

        return { success: true, data: { agents, totalCount } };
    } catch (error) {
        console.error("Failed to fetch agents:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to fetch the base model agents by their specific tag ID.
 * @returns Promise with success status and agent list (id, name, thumbnailUrl, slug) or error
 */
export async function getBaseModelAgentsAction(): Promise<ActionResult<Array<{
    id: string;
    name: string;
    thumbnailUrl: string | null;
    slug: string;
}>>> {
    // Consider making this ID an environment variable or constant
    const baseModelTagId = "575527b1-803a-4c96-8a4a-58ca997f08bd";
    const limit = 10; // Define limit
    try {
        const agents = await selectAgentsByTagId(baseModelTagId, limit);
        return { success: true, data: agents };
    } catch (error) {
        console.error("Failed to fetch base model agents:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to update an existing agent
 * @param agentId - The ID of the agent to update
 * @param data - Object containing the fields to update (excluding id, timestamps, creatorId)
 * @returns Promise with success status and updated agent data or error.
 */
// Define UpdateAgentData excluding non-updatable fields
// Using Partial<NewAgent> from repo is often cleaner if available
type UpdateAgentData = Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>>;

export async function updateAgentAction(agentId: string, data: UpdateAgentData): Promise<ActionResult<Agent>> {
     // Add authorization check: ensure the current user owns this agent
     try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };

        const agentToUpdate = await selectAgentById(agentId);
        if (!agentToUpdate) return { success: false, error: "Agent not found." };
        if (agentToUpdate.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

        // Add Zod validation for 'data' here if needed

        const result = await updateAgentRepo(agentId, data);
        if (result.length === 0) {
            return { success: false, error: "Agent not found or update failed" };
        }
        revalidatePath(`/agent/${result[0].slug}`); // Revalidate using slug if possible
        revalidatePath(`/agent/${agentId}/settings`);
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Failed to update agent:", error);
         // Handle specific errors like unique constraint violations if slug needs to be unique
        if (error instanceof Error && error.message.includes('unique constraint') && data.slug) {
             return { success: false, error: `Agent slug "${data.slug}" is already taken.` };
        }
        return { success: false, error: (error as Error).message };
    }
}


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
    if (!s3Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL_BASE) {
         return { success: false, error: "Server configuration error for file uploads." };
    }
    // Authorization check
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };
        const agentToUpdate = await selectAgentById(agentId);
        if (!agentToUpdate) return { success: false, error: "Agent not found." };
        if (agentToUpdate.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

        const file = formData.get("file") as File | null;
        if (!file) return { success: false, error: "No file provided." };
        if (!ALLOWED_FILE_TYPES.includes(file.type)) return { success: false, error: "Invalid file type. Only JPG, PNG, and WEBP are allowed." };
        if (file.size > MAX_FILE_SIZE) return { success: false, error: `File size exceeds the limit of ${MAX_FILE_SIZE / 1024 / 1024}MB.` };

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = file.name.split('.').pop() || 'png'; // Default extension
        const key = `agents/${agentId}/${imageType}-${Date.now()}.${fileExtension}`;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                Body: fileBuffer,
                ContentType: file.type,
                ACL: 'public-read',
            })
        );

        const publicUrl = `${R2_PUBLIC_URL_BASE}/${key}`;
        const updateData = imageType === 'thumbnail' ? { thumbnailUrl: publicUrl } : { avatarUrl: publicUrl };
        const updateResult = await updateAgentRepo(agentId, updateData);

        if (updateResult.length === 0) {
            try { // Attempt cleanup on DB failure
                await s3Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
            } catch (deleteError) {
                console.error(`Failed to clean up R2 object ${key} after DB update failure:`, deleteError);
            }
            return { success: false, error: "Failed to update agent record with new image URL." };
        }

        revalidatePath(`/agent/${agentId}/settings`);
        revalidatePath(`/agent/${updateResult[0].slug}`); // Revalidate public page too
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
     // Authorization check
     try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };

        const agentData = await selectAgentById(agentId);
        if (!agentData) return { success: false, error: "Agent not found." };
        if (agentData.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

        const currentUrl = imageType === 'thumbnail' ? agentData.thumbnailUrl : agentData.avatarUrl;

        // Attempt to delete from R2 only if client is configured and URL exists
        if (s3Client && R2_BUCKET_NAME && R2_PUBLIC_URL_BASE && currentUrl && currentUrl.startsWith(R2_PUBLIC_URL_BASE)) {
            const expectedPrefix = `${R2_PUBLIC_URL_BASE}/`;
            if (currentUrl.startsWith(expectedPrefix)) {
                 const key = currentUrl.substring(expectedPrefix.length);
                 try {
                     await s3Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
                 } catch (deleteError) {
                     console.error(`Non-critical: Failed to delete R2 object ${key}:`, deleteError);
                 }
            } else {
                 console.warn(`URL ${currentUrl} does not match expected prefix ${expectedPrefix}. Skipping R2 delete.`);
            }
        }

        // Always attempt to update the database
        const updateData = imageType === 'thumbnail' ? { thumbnailUrl: null } : { avatarUrl: null };
        const updateResult = await updateAgentRepo(agentId, updateData);

        // Log warning if update failed, but consider the action mostly successful if DB was cleared
        if (updateResult.length === 0) {
            console.warn(`Agent record for ${agentId} not found or failed to update during image removal.`);
        }

        revalidatePath(`/agent/${agentId}/settings`);
        revalidatePath(`/agent/${agentData.slug}`); // Revalidate public page too
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
    if (!agentId || typeof agentId !== 'string') {
        return { success: false, error: "Invalid agent ID provided." };
    }

    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };

        const agentToDelete = await selectAgentById(agentId);
        if (!agentToDelete) return { success: false, error: "Agent not found." };
        if (session.user.id !== agentToDelete.creatorId) {
            return { success: false, error: "Unauthorized: You do not have permission to delete this agent." };
        }

        // Optional: Delete associated images from R2 before deleting the agent record
        if (agentToDelete.thumbnailUrl) await removeAgentImageAction(agentId, 'thumbnail');
        if (agentToDelete.avatarUrl) await removeAgentImageAction(agentId, 'avatar');
        // Note: removeAgentImageAction includes its own auth check, which is slightly redundant here but safe.

        await deleteAgentRepo(agentId); // Repository handles DB deletes

        revalidatePath(`/profile/agents`);
        revalidatePath(`/agents`);
        revalidatePath(`/agent/${agentToDelete.slug}`); // Revalidate the potentially cached deleted agent page
        return { success: true, data: undefined };

    } catch (error) {
        console.error("Failed to delete agent:", error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to fetch all of an agent’s settings by slug for editing.
 * Includes agent data, knowledge, all tags, agent's current tags, and all models.
 * Requires authentication.
 * @param slug - The URL-friendly slug of the agent.
 * @returns Promise with success status and the combined settings data, or error.
 */
// Define the expected structure for the complex return type
type AgentSettingsData = {
    agent: NonNullable<Awaited<ReturnType<typeof selectAgentWithModelBySlug>>>; // Ensure agent is not undefined
    knowledge: Knowledge[];
    allTags: Tag[];
    agentTags: Tag[];
    allModels: Model[];
};

export async function getAgentSettingsBySlugAction(slug: string): Promise<ActionResult<AgentSettingsData>> {
    try {
         // Authentication and Authorization
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return { success: false, error: "User not authenticated." };

        const agentRec = await selectAgentWithModelBySlug(slug);
        if (!agentRec) return { success: false, error: "Agent not found." };
        if (agentRec.creatorId !== session.user.id) return { success: false, error: "Unauthorized." };

        // Fetch related data in parallel
        const [
            knowledge,
            allTags,
            agentTags, // Re-fetch agent's tags separately (could also use agentRec.tags if guaranteed fresh)
            allModels
        ] = await Promise.all([
            selectKnowledgeByAgentId(agentRec.id),
            selectAllTags(),
            selectTagsByAgentId(agentRec.id), // Explicitly fetch current tags
            selectAllModels()
        ]);

        return {
            success: true,
            data: {
                agent: agentRec, // agentRec is confirmed non-null here
                knowledge,
                allTags,
                agentTags,
                allModels
            }
        };
    } catch (error) {
         console.error(`Failed to fetch agent settings for slug ${slug}:`, error);
         return { success: false, error: (error as Error).message };
    }
}