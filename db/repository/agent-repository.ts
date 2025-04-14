// Added searchQuery parameter and imported `or`, `ilike`
import { db } from '../index';
import { agent, Agent, models, Model, knowledge, Knowledge, tags, Tag, agentTags, AgentTag } from '../schema/agent';
import { eq, desc, and, asc, sql, or, ilike } from 'drizzle-orm'; // Removed unused alias import
// Define the type for the data needed to insert an agent
// Excludes fields that have default values or are generated (id, createdAt, updatedAt)
type NewAgent = Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for creating new knowledge entries
 * Excludes auto-generated fields (id, createdAt, updatedAt)
 */
type NewKnowledge = Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating existing knowledge entries
 * Allows partial updates of writable fields
 */
type UpdateKnowledge = Partial<NewKnowledge>;

// Define types for Tag operations
type NewTag = Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateTag = Partial<NewTag>;

/**
 * Inserts a new agent into the database.
 * @param newAgentData - The data for the new agent.
 * @returns The newly inserted agent record.
 */
export async function insertAgent(newAgentData: NewAgent): Promise<Agent[]> {
  const insertedAgent = await db
    .insert(agent)
    .values(newAgentData)
    .returning(); // Return all columns of the inserted row
  return insertedAgent;
}

/**
 * Selects an agent by its ID.
 * @param agentId - The ID of the agent to select.
 * @returns The agent record if found, otherwise undefined.
 */
export async function selectAgentById(agentId: string): Promise<Agent | undefined> {
  const result = await db
    .select()
    .from(agent)
    .where(eq(agent.id, agentId))
    .limit(1);
  return result[0];
}

/**
 * Updates an existing agent in the database.
 * @param agentId - The ID of the agent to update.
 * @param updateData - An object containing the fields to update.
 * @returns The updated agent record.
 */
export async function updateAgent(agentId: string, updateData: Partial<NewAgent>): Promise<Agent[]> {
  const updatedAgent = await db
    .update(agent)
    .set({ ...updateData, updatedAt: new Date() }) // Ensure updatedAt is updated
    .where(eq(agent.id, agentId))
    .returning();
  return updatedAgent;
}

/**
 * Deletes an agent from the database.
 * @param agentId - The ID of the agent to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteAgent(agentId: string): Promise<void> {
  await db.delete(agent).where(eq(agent.id, agentId));
}

/**
 * Selects all models from the database.
 * @returns Array of all model records.
 */
export async function selectAllModels(): Promise<Model[]> {
  return await db.select().from(models);
}

/**
 * Selects the most recent 20 agents from the database
 * @returns Array of agent records ordered by creation date
 */
// Define the structure for a tag within the agent result
type AgentTagInfo = { id: string; name: string };

// Update the return type to include an array of tags
// Update return type to include createdAt
export async function selectRecentAgents(tagName?: string, searchQuery?: string): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  creatorId: string;
  tags: AgentTagInfo[];
  createdAt: Date; // Added createdAt
}>> {
  // Use sql template literal for JSON aggregation
  const tagsAgg = sql<AgentTagInfo[]>`coalesce(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]')`.as('tags');

  // Base query with joins
  const queryBuilder = db
    .select({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      thumbnailUrl: agent.thumbnailUrl,
      avatarUrl: agent.avatarUrl,
      creatorId: agent.creatorId,
      tags: tagsAgg, // Select the aggregated tags
      createdAt: agent.createdAt // Select createdAt
    })
    .from(agent)
    // Left join to include agents even if they have no tags
    .leftJoin(agentTags, eq(agent.id, agentTags.agentId))
    .leftJoin(tags, eq(agentTags.tagId, tags.id));

  // Build WHERE conditions dynamically
  const whereConditions = [];
  if (tagName) {
    // This condition needs to check if *any* of the joined tags match the name.
    // We'll filter later based on the aggregated tags if needed, or adjust the query structure.
    // For now, let's assume the join + where works for basic tag filtering.
    // A subquery might be more accurate here to filter agents *before* joining tags for aggregation.
    // Let's stick to the simpler approach first.
    // We need to find agents where *at least one* tag matches tagName.
    // This requires a subquery or a different approach.
    // Let's adjust: Filter agents based on a subquery checking tag existence.

     const subQuery = db.select({ agentId: agentTags.agentId })
       .from(agentTags)
       .innerJoin(tags, eq(agentTags.tagId, tags.id))
       .where(eq(tags.name, tagName));

     whereConditions.push(sql`${agent.id} in ${subQuery}`);

  }

  if (searchQuery) {
    const searchPattern = `%${searchQuery}%`;
    // Search across agent name, description, and *any* associated tag name
     whereConditions.push(
       or(
         ilike(agent.name, searchPattern),
         ilike(agent.description, searchPattern),
         // Check if the agent is associated with *any* tag matching the search query
         sql`${agent.id} in (
           select ${agentTags.agentId}
           from ${agentTags}
           inner join ${tags} on ${eq(agentTags.tagId, tags.id)}
           where ${ilike(tags.name, searchPattern)}
         )`
       )
     );
  }

  // Apply WHERE conditions if any exist
  let finalQuery = queryBuilder.$dynamic(); // Get the dynamic query builder instance
  if (whereConditions.length > 0) {
    finalQuery = finalQuery.where(and(...whereConditions));
  }


  // Default order by creation date. Ranking will be done in the server action if needed.
  const orderByClause = [desc(agent.createdAt)];


  return await finalQuery
    // Group by agent fields to allow aggregation of tags
    .groupBy(
      agent.id,
      agent.name,
      agent.description,
      agent.thumbnailUrl,
      agent.avatarUrl,
      agent.creatorId,
      agent.createdAt // Need to include orderBy column in groupBy
    )
    .orderBy(...orderByClause) // Apply default order by
    .limit(20);
}

/**
 * Retrieves an agent with its associated model name by ID
 * @param agentId - UUID of the agent to retrieve
 * @returns Combined agent and model data or undefined if not found
 */
export async function selectAgentWithModelById(agentId: string): Promise<(Agent & { modelName: string }) | undefined> {
  const result = await db
    .select({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      thumbnailUrl: agent.thumbnailUrl,
      avatarUrl: agent.avatarUrl,
      systemPrompt: agent.systemPrompt,
      welcomeMessage: agent.welcomeMessage,
      primaryModelId: agent.primaryModelId,
      visibility: agent.visibility,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      creatorId: agent.creatorId,
      modelName: models.model
    })
    .from(agent)
    .innerJoin(models, eq(agent.primaryModelId, models.id))
    .where(eq(agent.id, agentId))
    .limit(1);
    
  return result[0];
}

/**
 * Creates a new knowledge base entry
 * @param newKnowledge - Knowledge data to insert
 * @returns Array containing the created knowledge record
 */
export async function insertKnowledge(newKnowledge: NewKnowledge): Promise<Knowledge[]> {
  return await db
    .insert(knowledge)
    .values(newKnowledge)
    .returning();
}

/**
 * Retrieves a knowledge entry by its ID
 * @param id - UUID of the knowledge entry
 * @returns Knowledge record or undefined if not found
 */
export async function selectKnowledgeById(id: string): Promise<Knowledge | undefined> {
  const result = await db
    .select()
    .from(knowledge)
    .where(eq(knowledge.id, id))
    .limit(1);
  return result[0];
}

/**
 * Updates an existing knowledge entry
 * @param id - UUID of the knowledge entry to update
 * @param updateData - Partial data for updating the knowledge entry
 * @returns Array containing the updated knowledge record
 */
export async function updateKnowledge(id: string, updateData: UpdateKnowledge): Promise<Knowledge[]> {
  return await db
    .update(knowledge)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(knowledge.id, id))
    .returning();
}

/**
 * Deletes a knowledge entry by ID
 * @param id - UUID of the knowledge entry to delete
 */
export async function deleteKnowledge(id: string): Promise<void> {
  await db.delete(knowledge).where(eq(knowledge.id, id));
}

/**
 * Retrieves all knowledge entries associated with an agent
 * @param agentId - UUID of the agent to get knowledge for
 * @returns Array of knowledge records ordered by creation date (newest first)
 */
export async function selectKnowledgeByAgentId(agentId: string): Promise<Knowledge[]> {
  return await db
    .select()
    .from(knowledge)
    .where(eq(knowledge.agentId, agentId))
    .orderBy(desc(knowledge.createdAt));
}


// ========================================
// Tag Repository Functions
// ========================================

/**
 * Inserts a new tag into the database.
 * @param newTagData - The data for the new tag (name).
 * @returns The newly inserted tag record.
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
 * @param tagName - The name of the tag to select.
 * @returns The tag record if found, otherwise undefined.
 */
export async function selectTagByName(tagName: string): Promise<Tag | undefined> {
    // Consider adding index on lower(name) for performance if needed
    const result = await db
        .select()
        .from(tags)
        .where(eq(tags.name, tagName)) // Drizzle might handle case-insensitivity depending on DB collation, or use lower()
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
 * @returns The updated tag record.
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
 * Note: This will also delete related entries in agent_tags due to cascade constraint.
 * @param tagId - The ID of the tag to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteTag(tagId: string): Promise<void> {
  await db.delete(tags).where(eq(tags.id, tagId));
}


// ========================================
// Agent-Tag Relationship Functions
// ========================================

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
 * Selects all agents associated with a specific tag.
 * (Returns only agent IDs for potential efficiency, adjust if full agent data needed)
 * @param tagId - The ID of the tag.
 * @returns An array of agent IDs associated with the tag.
 */
export async function selectAgentIdsByTagId(tagId: string): Promise<string[]> {
    const results = await db
        .select({
            agentId: agent.id
        })
        .from(agent)
        .innerJoin(agentTags, eq(agent.id, agentTags.agentId))
        .where(eq(agentTags.tagId, tagId))
        .orderBy(asc(agent.name)); // Order by agent name or ID

    return results.map(r => r.agentId);
}

/**
 * Selects agents associated with a specific tag ID, returning limited fields.
 * @param tagId - The ID of the tag.
 * @param limit - The maximum number of agents to return.
 * @returns An array of agent objects with id, name, and thumbnailUrl.
 */
export async function selectAgentsByTagId(tagId: string, limit: number): Promise<Array<{
    id: string;
    name: string;
    thumbnailUrl: string | null;
}>> {
    return await db
        .select({
            id: agent.id,
            name: agent.name,
            thumbnailUrl: agent.thumbnailUrl
        })
        .from(agent)
        .innerJoin(agentTags, eq(agent.id, agentTags.agentId))
        .where(eq(agentTags.tagId, tagId))
        .orderBy(asc(agent.name)) // Or maybe orderBy(agent.createdAt)? Let's stick with name for now.
        .limit(limit);
}

// Example: If you needed full agent details by tag
// export async function selectAgentsByTagId(tagId: string): Promise<Agent[]> {
//     return await db
//         .select() // Select all columns from agent table
//         .from(agent)
//         .innerJoin(agentTags, eq(agent.id, agentTags.agentId))
//         .where(eq(agentTags.tagId, tagId))
//         .orderBy(asc(agent.name));
// }

/**
 * Selects the top N tags ordered alphabetically by name.
 * @param limit - The maximum number of tags to return.
 * @returns An array of tag records.
 */
export async function selectTopTags(limit: number): Promise<Tag[]> {
  return await db
    .select()
    .from(tags)
    .orderBy(asc(tags.name))
    .limit(limit);
}
