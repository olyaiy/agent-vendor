import { and, eq } from "drizzle-orm";
import { db } from "..";
import { AgentModel, AgentTag, Knowledge, Tag, agent, agentModels, agentTags, knowledge, tags } from "../schema/agent";


// --------------------- AGENT - TAG RELATIONS ---------------------    


/**
 * Adds a tag to an agent by creating an entry in the agent_tags join table.
 * @param agentId - The ID of the agent.
 * @param tagId - The ID of the tag.
 * @returns The newly created agent_tags record.
 */
export async function addTagToAgent(agentId: string, tagId: string): Promise<AgentTag[]> {
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

/**
 * Retrieves all tags associated with a specific agent, identified by slug.
 * @param agentSlug - The unique slug of the agent.
 * @returns A promise that resolves to an array of Tag objects.
 */
export async function selectAgentTagsBySlug(agentSlug: string): Promise<Tag[]> {
    return await db
        .select({
            id: tags.id,
            name: tags.name,
            createdAt: tags.createdAt,
            updatedAt: tags.updatedAt,
        }) // Select columns from the tags table
        .from(tags)
        .innerJoin(agentTags, eq(tags.id, agentTags.tagId)) // Join tags with agentTags
        .innerJoin(agent, eq(agentTags.agentId, agent.id)) // Join agentTags with agent
        .where(eq(agent.slug, agentSlug)); // Filter by agent slug
}


// --------------------- AGENT - MODEL RELATIONS ---------------------    

/**
 * Retrieves all agent models associated with a specific agent, identified by slug.
 * @param agentSlug - The unique slug of the agent.
 * @returns A promise that resolves to an array of AgentModel objects.
 */
export async function selectAgentModelsBySlug(agentSlug: string): Promise<AgentModel[]> {
    return await db
        .select({
            agentId: agentModels.agentId,
            modelId: agentModels.modelId,
            role: agentModels.role,
        }) // Select only columns from agentModels
        .from(agentModels)
        .innerJoin(agent, eq(agentModels.agentId, agent.id)) // Join based on agent ID
        .where(eq(agent.slug, agentSlug)); // Filter by agent slug
}



// --------------------- AGENT - KNOWLEDGE RELATIONS ---------------------    

/**
 * Retrieves all knowledge items associated with a specific agent, identified by slug.
 * @param agentSlug - The unique slug of the agent.
 * @returns A promise that resolves to an array of Knowledge objects.
 */
export async function selectAgentKnowledgeBySlug(agentSlug: string): Promise<Knowledge[]> {
    return await db
        .select({
            id: knowledge.id,
            agentId: knowledge.agentId,
            title: knowledge.title,
            content: knowledge.content,
            sourceUrl: knowledge.sourceUrl,
            createdAt: knowledge.createdAt,
            updatedAt: knowledge.updatedAt,
        }) // Select all columns from the knowledge table
        .from(knowledge)
        .innerJoin(agent, eq(knowledge.agentId, agent.id)) // Join based on agent ID
        .where(eq(agent.slug, agentSlug)); // Filter by agent slug
}


