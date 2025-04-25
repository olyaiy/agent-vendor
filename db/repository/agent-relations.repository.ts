import { and, eq } from "drizzle-orm";
import { db } from "..";
import { AgentTag, agentTags } from "../schema/agent";

/**
 * Adds a tag to an agent by creating an entry in the agent_tags join table.
 * @param agentId - The ID of the agent.
 * @param tagId - The ID of the tag.
 * @returns The newly created agent_tags record.
 */
export async function addTagToAgent(agentId: string, tagId: string): Promise<AgentTag[]> {
    // Optional: Check if agent and tag exist before inserting
    // Optional: Check if relationship already exists to avoid errors or handle gracefully
    return await db
        .insert(agentTags)
        .values({ agentId, tagId, assignedAt: new Date() }) // assignedAt has default, but setting explicitly is fine
        .returning();
}



/**
 * Removes a tag from an agent by deleting the entry from the agent_tags join table.
 * @param agentId - The ID of the agent.
 * @param tagId - The ID of the tag.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function removeTagFromAgent(agentId: string, tagId: string): Promise<void> {
    await db
        .delete(agentTags)
        .where(and( // Corrected and_ to and
            eq(agentTags.agentId, agentId),
            eq(agentTags.tagId, tagId)
        ));
}