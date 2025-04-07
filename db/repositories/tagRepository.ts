import { eq, sql } from 'drizzle-orm';
import { db } from '../client';
import { tags, agentTags } from '../schema';
import { handleDbError } from '../utils/errorHandler';

/**
 * Get all tags
 */
export async function getAllTags() {
  try {
    const result = await db.select().from(tags).orderBy(tags.name);
    return result;
  } catch (error) {
    return handleDbError(error, 'Error getting all tags', []);
  }
}

/**
 * Search tags by name
 */
export async function searchTags(searchTerm: string) {
  try {
    const result = await db
      .select()
      .from(tags)
      .where(sql`${tags.name} ILIKE ${`%${searchTerm}%`}`)
      .orderBy(tags.name);
    return result;
  } catch (error) {
    return handleDbError(error, 'Error searching tags', []);
  }
}

/**
 * Get tags for a specific agent
 */
export async function getTagsByAgentId(agentId: string) {
  try {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt
      })
      .from(agentTags)
      .innerJoin(tags, eq(agentTags.tagId, tags.id))
      .where(eq(agentTags.agentId, agentId))
      .orderBy(tags.name);
    
    return result;
  } catch (error) {
    return handleDbError(error, 'Error getting tags by agent ID', []);
  }
}

/**
 * Create a new tag
 */
export async function createTag(name: string): Promise<{ id: string; name: string }> {
  try {
    const [newTag] = await db
      .insert(tags)
      .values({ name })
      .returning();
    
    return newTag;
  } catch (error) {
    return handleDbError(error, 'Error creating tag');
  }
}

/**
 * Update tags for an agent
 */
export async function updateAgentTags(agentId: string, tagIds: string[]) {
  try {
    // Delete existing tags for this agent
    await db
      .delete(agentTags)
      .where(eq(agentTags.agentId, agentId));
    
    // If there are no tags to add, we're done
    if (!tagIds.length) return;
    
    // Add new tags
    const values = tagIds.map(tagId => ({
      agentId,
      tagId
    }));
    
    await db
      .insert(agentTags)
      .values(values);
      
    return { success: true };
  } catch (error) {
    return handleDbError(error, 'Error updating agent tags');
  }
}

/**
 * Get most commonly used tags
 */
export async function getMostCommonTags(limit?: number) {
  try {
    const result = await db
      .select({
        id: tags.id,
        name: tags.name,
        count: sql<number>`count(*)`
      })
      .from(agentTags)
      .innerJoin(tags, eq(agentTags.tagId, tags.id))
      .groupBy(tags.id, tags.name)
      .orderBy(sql`count(*) desc`, tags.name)
      .limit(limit || 100);
    
    return result;
  } catch (error) {
    return handleDbError(error, 'Error getting most common tags', []);
  }
} 