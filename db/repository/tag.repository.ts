
import { eq, asc, and, sql } from 'drizzle-orm';
import { agent, agentTags, Tag, tags } from '../schema/agent';
import { db } from '..';

// Define types for Tag operations
export type NewTag = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTag = Partial<NewTag>;

// Define structure for agent info returned by selectAgentsByTagId
export type AgentInfoForTag = {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    slug: string;
};


/**
 * Inserts a new tag into the database.
 * @param newTagData - The data for the new tag (name).
 * @returns Promise with the created tag record (as an array).
 */
export async function insertTag(newTagData: NewTag): Promise<Tag[]> {
    return await db
        .insert(tags)
        .values(newTagData)
        .returning();
}

/**
 * Selects a tag by its ID.
 * @param tagId - The ID of the tag to select.
 * @returns The tag record if found, otherwise undefined.
 */
export async function selectTagById(tagId: string): Promise<Tag | undefined> {
    const result = await db
        .select()
        .from(tags)
        .where(eq(tags.id, tagId))
        .limit(1);
    return result[0];
}

/**
 * Selects a tag by its name (case-insensitive).
 * Assumes database collation handles case-insensitivity or uses `lower()`.
 * @param tagName - The name of the tag to select.
 * @returns The tag record if found, otherwise undefined.
 */
export async function selectTagByName(tagName: string): Promise<Tag | undefined> {
    // For guaranteed case-insensitivity across DBs, use:
    // import { lower } from 'drizzle-orm';
    // .where(eq(lower(tags.name), lower(tagName)))
    // Ensure you have an index on lower(name) for performance if using this often.
    const result = await db
        .select()
        .from(tags)
        .where(eq(tags.name, tagName)) // Relies on DB collation for case sensitivity
        .limit(1);
    return result[0];
}


/**
 * Selects all tags from the database, ordered by name.
 * @returns Array of all tag records.
 */
export async function selectAllTags(): Promise<Tag[]> {
    return await db
        .select()
        .from(tags)
        .orderBy(asc(tags.name));
}

/**
 * Updates an existing tag in the database.
 * @param tagId - The ID of the tag to update.
 * @param updateData - An object containing the fields to update (currently only name).
 * @returns The updated tag record (as an array).
 */
export async function updateTag(tagId: string, updateData: UpdateTag): Promise<Tag[]> {
    return await db
        .update(tags)
        .set({ ...updateData, updatedAt: new Date() }) // Ensure updatedAt is updated
        .where(eq(tags.id, tagId))
        .returning();
}

/**
 * Deletes a tag from the database.
 * Assumes ON DELETE CASCADE is set for `agent_tags.tag_id` foreign key.
 * If not, related `agent_tags` entries will cause an error or remain orphaned.
 * @param tagId - The ID of the tag to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteTag(tagId: string): Promise<void> {
    // If cascade delete is not set on agent_tags, you might need to delete manually first:
    // await db.delete(agentTags).where(eq(agentTags.tagId, tagId));
    await db.delete(tags).where(eq(tags.id, tagId));
}


// ========================================
// Agent-Tag Relationship Functions (Primarily Tag-focused)
// ========================================


/**
 * Selects all tags associated with a specific agent.
 * @param agentId - The ID of the agent.
 * @returns An array of tag records associated with the agent.
 */
export async function selectTagsByAgentId(agentId: string): Promise<Tag[]> {
    return await db
        .select({
            id: tags.id,
            name: tags.name,
            createdAt: tags.createdAt,
            updatedAt: tags.updatedAt
        })
        .from(tags)
        .innerJoin(agentTags, eq(tags.id, agentTags.tagId))
        .where(eq(agentTags.agentId, agentId))
        .orderBy(asc(tags.name));
}

/**
 * Selects all agents associated with a specific tag ID.
 * Returns basic agent info (id, name, thumbnail, slug).
 * @param tagId - The ID of the tag.
 * @param limit - The maximum number of agents to return.
 * @returns An array of agent info objects associated with the tag.
 */
export async function selectAgentsByTagId(tagId: string, limit: number = 10): Promise<AgentInfoForTag[]> {
    return await db
        .select({
            id: agent.id,
            name: agent.name,
            thumbnailUrl: agent.thumbnailUrl,
            slug: sql<string>`coalesce(${agent.slug}, '')`.as('slug')
        })
        .from(agent)
        .innerJoin(agentTags, eq(agent.id, agentTags.agentId))
        .where(eq(agentTags.tagId, tagId))
        .orderBy(asc(agent.name)) // Consider ordering by agent.createdAt or relevance?
        .limit(limit);
}

/**
 * Selects the top N tags ordered alphabetically by name.
 * Consider adding ordering by usage count if needed.
 * @param limit - The maximum number of tags to return.
 * @returns An array of tag records.
 */
export async function selectTopTags(limit: number = 10): Promise<Tag[]> {
    return await db
        .select()
        .from(tags)
        .orderBy(asc(tags.name))
        .limit(limit);
}


// Note: Functions like addTagToAgent and removeTagFromAgent involve both Agent and Tag.
// They are placed in agent.repository.ts as they modify the agent's state primarily.
// If preferred, they could be moved to a dedicated agent-relations.repository.ts.

// /**
//  * Adds a tag to an agent by creating an entry in the agent_tags join table.
//  * Located in agent.repository.ts
//  */
// export declare function addTagToAgent(agentId: string, tagId: string): Promise<AgentTag[]>;

// /**
//  * Removes a tag from an agent by deleting the entry from the agent_tags join table.
//  * Located in agent.repository.ts
//  */
// export declare function removeTagFromAgent(agentId: string, tagId: string): Promise<void>;