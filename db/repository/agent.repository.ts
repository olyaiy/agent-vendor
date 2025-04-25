import { eq, desc, and, sql, or, ilike, count, getTableColumns } from 'drizzle-orm';

import { Agent, agent, agentModels, agentTags, Knowledge, models, Tag, tags } from '../schema/agent';
import { db } from '..';
import { selectKnowledgeByAgentId } from './agent-repository';
import { selectTagsByAgentId } from './tag.repository';

// Define the type for the data needed to insert an agent
export type NewAgent = typeof agent.$inferInsert;

// Define the structure for a tag within the agent result (Keep here or move to shared types)
export type AgentTagInfo = { id: string; name: string };


/**
 * Inserts a new agent into the database.
 * @param newAgentData - The data for the new agent.
 * @returns The newly inserted agent record (as an array for consistency with Drizzle).
 */
export async function insertAgent(newAgentData: NewAgent): Promise<Agent[]> {
    // 1️⃣ create the agent row
    const created = await db
        .insert(agent)
        .values(newAgentData)
        .returning();

    // 2️⃣ backfill the primary role in the join table (if needed, uncommented logic was here)
    // Consider if this logic should be here or in a separate service layer function
    // If primaryModelId is always present in NewAgent, this could potentially be done here
    // or via a database trigger/constraint if your DB supports it.

    // Example backfill if needed:
    // if (newAgentData.primaryModelId && created.length > 0) {
    //     await db.insert(agentModels).values({
    //         agentId: created[0].id,
    //         modelId: newAgentData.primaryModelId,
    //         role: 'primary',
    //     }).onConflictDoNothing(); // Avoid errors if somehow already exists
    // }

    return created;
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
 * Selects an agent by its slug.
 * @param slug - The slug of the agent to select.
 * @returns The agent record if found, otherwise undefined.
 */
export async function selectAgentBySlug(slug: string): Promise<Agent | undefined> {
    const result = await db
        .select()
        .from(agent)
        .where(eq(agent.slug, slug))
        .limit(1);
    return result[0];
}

// Define a more flexible input type for updates during/after deprecation
// It accepts standard Agent fields (partial) but *also* allows specifying a primaryModelId separately
export type UpdateAgentInput = Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'primaryModelId' | 'creatorId'>> & {
    primaryModelId?: string; // Allow explicitly passing the new primary model ID
};

/**
 * Updates an existing agent (Phase 3 Version - Stops writing agent.primaryModelId).
 * Handles updating the primary model relationship ONLY in the agent_models join table.
 * @param agentId - The ID of the agent to update.
 * @param updateData - An object containing fields to update. Can include `primaryModelId` to change the primary model association.
 * @returns The updated agent record (fetched fresh after updates). Returns as an array for repo consistency.
 */
export async function updateAgent(agentId: string, updateData: UpdateAgentInput): Promise<Agent[]> {

    // 1. Separate primaryModelId from other fields meant for the 'agent' table
    const { primaryModelId, ...otherAgentFields } = updateData;

    // 2. Handle primary model change in the 'agent_models' table (Transaction remains)
    if (primaryModelId) {
        // Ensure the provided primaryModelId exists in the models table (optional but recommended)
        const modelExists = await db.select({ id: models.id }).from(models).where(eq(models.id, primaryModelId)).limit(1);
        if (modelExists.length === 0) {
            throw new Error(`Model with ID ${primaryModelId} not found. Cannot set as primary model.`);
        }

        await db.transaction(async tx => {
            // Delete the old primary model relationship
            await tx
                .delete(agentModels)
                .where(
                    and(
                        eq(agentModels.agentId, agentId),
                        eq(agentModels.role, 'primary')
                    )
                );
            // Insert the new primary model relationship
            await tx
                .insert(agentModels)
                .values({
                    agentId,
                    modelId: primaryModelId, // Use the separated ID
                    role: 'primary',
                });
             // The unique constraint 'unique_primary_model_per_agent' prevents duplicates
        });
    }

    // 3. Update the 'agent' table itself, *excluding* primaryModelId
    let updatedAgentRecord: Agent | undefined;
    if (Object.keys(otherAgentFields).length > 0) {
        const result = await db
            .update(agent)
            // *** CRITICAL CHANGE: Only set fields other than primaryModelId ***
            .set({ ...otherAgentFields, updatedAt: new Date() })
            .where(eq(agent.id, agentId))
            .returning(); // Get the updated row data directly from the agent table
        updatedAgentRecord = result[0];
    }

    // 4. Fetch the definitive final state of the agent record
    // This ensures the returned data is correct, even if only the model changed,
    // or if the type 'Agent' now differs slightly from the '.returning()' shape.
    const finalAgentState = await db
                              .select()
                              .from(agent)
                              .where(eq(agent.id, agentId))
                              .limit(1);

    if (!finalAgentState || finalAgentState.length === 0) {
        // This case should ideally not happen if the agent existed, but handle it defensively.
        // If the update deleted the agent somehow (it shouldn't), this would be empty.
        // Or if the ID was invalid initially.
        throw new Error(`Agent with ID ${agentId} not found after update operation.`);
    }

    // Return the fetched state, conforming to the Promise<Agent[]> signature
    return finalAgentState;
}


/**
 * Deletes an agent from the database.
 * Note: Related data in join tables (agentTags, agentModels) might need cleanup
 * depending on database cascade settings or explicit deletion logic.
 * @param agentId - The ID of the agent to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteAgent(agentId: string): Promise<void> {
    // Consider adding explicit deletion from agentTags, agentModels, and knowledge
    // within a transaction if cascade delete is not set up or desired.
    await db.delete(agent).where(eq(agent.id, agentId));
}


// ========================================
// Agent Search & Listing Functions
// ========================================

// Define the structure for the result of selectRecentAgents
export type RecentAgentResult = {
    id: string;
    name: string;
    description: string | null;
    thumbnailUrl: string | null;
    slug: string;
    avatarUrl: string | null;
    creatorId: string;
    tags: AgentTagInfo[];
    createdAt: Date;
    visibility: string;
};

/**
 * Selects agents from the database with optional tag and search filtering, and pagination.
 * @param tagName - Optional tag name to filter agents by.
 * @param searchQuery - Optional search query to filter agents by name, description, or tag name.
 * @param limit - The maximum number of agents to return.
 * @param offset - The number of agents to skip.
 * @returns Array of agent records ordered by creation date, including associated tags.
 */
export async function selectRecentAgents(
    tagName?: string,
    searchQuery?: string,
    limit: number = 20, // Provide default limit
    offset: number = 0 // Provide default offset
): Promise<RecentAgentResult[]> {
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]')`.as('tags');

    const queryBuilder = db
        .select({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            thumbnailUrl: agent.thumbnailUrl,
            slug: sql<string>`coalesce(${agent.slug}, '')`.as('slug'), // Ensure slug is never null in result
            avatarUrl: agent.avatarUrl,
            creatorId: agent.creatorId,
            tags: tagsAgg,
            createdAt: agent.createdAt,
            visibility: agent.visibility
        })
        .from(agent)
        .leftJoin(agentTags, eq(agent.id, agentTags.agentId))
        .leftJoin(tags, eq(agentTags.tagId, tags.id));

    const whereConditions = [];
    if (tagName) {
        // Subquery to find agents with the specific tag name
        const subQuery = db.select({ agentId: agentTags.agentId })
            .from(agentTags)
            .innerJoin(tags, eq(agentTags.tagId, tags.id))
            .where(eq(tags.name, tagName));
        whereConditions.push(sql`${agent.id} in ${subQuery}`);
    }

    if (searchQuery) {
        const searchPattern = `%${searchQuery}%`;
        // Subquery to find agents whose tags match the search query
        const tagSearchSubQuery = db.select({ agentId: agentTags.agentId })
            .from(agentTags)
            .innerJoin(tags, eq(agentTags.tagId, tags.id))
            .where(ilike(tags.name, searchPattern));

        whereConditions.push(
            or(
                ilike(agent.name, searchPattern),
                ilike(agent.description, searchPattern),
                sql`${agent.id} in ${tagSearchSubQuery}` // Check if agent ID is in the result of the tag search
            )
        );
    }

    let finalQuery = queryBuilder.$dynamic();
    if (whereConditions.length > 0) {
        finalQuery = finalQuery.where(and(...whereConditions));
    }

    // Group by agent fields to allow aggregation of tags
    // Must include all selected non-aggregated fields
    finalQuery = finalQuery.groupBy(
        agent.id,
        agent.name,
        agent.description,
        agent.thumbnailUrl,
        agent.slug,
        agent.avatarUrl,
        agent.creatorId,
        agent.createdAt,
        agent.visibility
    )
    .orderBy(desc(agent.createdAt)) // Apply default order by
    .limit(limit)
    .offset(offset);

    return await finalQuery;
}

/**
 * Counts the total number of agents matching the optional tag and search filtering.
 * Uses CTEs for potentially better performance and readability on complex counts.
 * @param tagName - Optional tag name to filter agents by.
 * @param searchQuery - Optional search query to filter agents by name, description, or tag name.
 * @returns The total count of matching agents.
 */
export async function countAgents(tagName?: string, searchQuery?: string): Promise<number> {
    // Build the filtering logic similarly to selectRecentAgents
    const whereConditions = [];
    if (tagName) {
        const subQuery = db.select({ agentId: agentTags.agentId })
            .from(agentTags)
            .innerJoin(tags, eq(agentTags.tagId, tags.id))
            .where(eq(tags.name, tagName));
        whereConditions.push(sql`${agent.id} in ${subQuery}`);
    }
    if (searchQuery) {
        const searchPattern = `%${searchQuery}%`;
        const tagSearchSubQuery = db.select({ agentId: agentTags.agentId })
            .from(agentTags)
            .innerJoin(tags, eq(agentTags.tagId, tags.id))
            .where(ilike(tags.name, searchPattern));
        whereConditions.push(
            or(
                ilike(agent.name, searchPattern),
                ilike(agent.description, searchPattern),
                sql`${agent.id} in ${tagSearchSubQuery}`
            )
        );
    }

    // Select distinct agent IDs matching the criteria first, then count
    const countQuery = db
        .select({ value: count(agent.id) }) // Count distinct agent IDs
        .from(agent)
        .$dynamic(); // Allow dynamic where clause

    if (whereConditions.length > 0) {
        countQuery.where(and(...whereConditions));
    }

    const result = await countQuery;
    return result[0]?.value || 0;
}

// Define the structure for the result of selectAgentWithModelBySlug/Id
export type AgentWithModelAndTags = Agent & {
    modelName: string;
    tags: AgentTagInfo[];
};

/**
 * Retrieves an agent (with its model name and tags) by its slug.
 * @param slug - URL-friendly slug of the agent.
 * @returns Combined agent + model + tags object, or undefined if not found.
 */
export async function selectAgentWithModelBySlug(slug: string): Promise<AgentWithModelAndTags | undefined> {
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]')`.as('tags');

    // Prefer joining via agentModels for primary model identification consistency
    const result = await db
    .select({
        ...getTableColumns(agent),
        modelName: models.model,
        tags: tagsAgg,
    })

        .from(agent)
        .innerJoin(agentModels, and(
            eq(agentModels.agentId, agent.id),
            eq(agentModels.role, 'primary') // Ensure we join only the primary model relationship
        ))
        .innerJoin(models, eq(agentModels.modelId, models.id))
        .leftJoin(agentTags, eq(agent.id, agentTags.agentId)) // Left join for tags
        .leftJoin(tags, eq(agentTags.tagId, tags.id))
        .where(eq(agent.slug, slug))
        .groupBy(agent.id, models.model) // Group by agent ID and model name
         // Need to list all selected agent columns in groupBy if not using primary key grouping (depends on DB)
        // .groupBy(agent.id, agent.name, ..., models.model) // More portable version
        .limit(1);

    // If your DB supports grouping by primary key (like PostgreSQL), groupBy(agent.id, models.model) is sufficient.
    // Otherwise, you need to list all selected non-aggregated columns from 'agent'.

    return result[0] as AgentWithModelAndTags | undefined; // Cast necessary because we selected ...agent
}

/**
 * Retrieves an agent with its associated model name and tags by ID.
 * @param agentId - UUID of the agent to retrieve.
 * @returns Combined agent, model name, and tags data or undefined if not found.
 */
export async function selectAgentWithModelById(agentId: string): Promise<AgentWithModelAndTags | undefined> {
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]')`.as('tags');

    // Prefer joining via agentModels for primary model identification consistency
    const result = await db
    .select({
        ...getTableColumns(agent),
        modelName: models.model,
        tags: tagsAgg
    })

        .from(agent)
        .innerJoin(agentModels, and( // Join on agentModels to ensure primary relationship
            eq(agentModels.agentId, agent.id),
            eq(agentModels.role, 'primary')
        ))
        .innerJoin(models, eq(agentModels.modelId, models.id)) // Join models based on agentModels
        .leftJoin(agentTags, eq(agent.id, agentTags.agentId)) // Left join for tags
        .leftJoin(tags, eq(agentTags.tagId, tags.id))
        .where(eq(agent.id, agentId))
        .groupBy(agent.id, models.model) // Group by agent ID and model name
        // .groupBy(agent.id, agent.name, ..., models.model) // More portable version if needed
        .limit(1);

    return result[0] as AgentWithModelAndTags | undefined; // Cast necessary
}


/**
 * Selects agents created by a specific user, including model name and tags.
 * @param creatorId - The ID of the user who created the agents.
 * @returns Array of agent records with model name and associated tags.
 */
export async function selectAgentsByCreatorId(creatorId: string): Promise<AgentWithModelAndTags[]> {
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]')`.as('tags');

    const results = await db
        .select({
            ...getTableColumns(agent),
            modelName: models.model,
            tags: tagsAgg
        })
        .from(agent)
         .innerJoin(agentModels, and( // Join on agentModels to ensure primary relationship
            eq(agentModels.agentId, agent.id),
            eq(agentModels.role, 'primary')
        ))
        .innerJoin(models, eq(agentModels.modelId, models.id)) // Join models based on agentModels
        .leftJoin(agentTags, eq(agent.id, agentTags.agentId))
        .leftJoin(tags, eq(agentTags.tagId, tags.id))
        .where(eq(agent.creatorId, creatorId)) // Filter by creatorId
        .groupBy(agent.id, models.model) // Group by agent ID and model name
        // .groupBy(agent.id, agent.name, ..., models.model) // More portable version
        .orderBy(desc(agent.createdAt));

    return results as AgentWithModelAndTags[]; // Cast necessary
}

/**
 * Retrieves all knowledge entries for a given agent slug.
 * Uses other repository functions.
 * @param slug – the URL-friendly agent slug
 * @returns array of Knowledge records, or [] if no such agent
 */
export async function selectKnowledgeByAgentSlug(slug: string): Promise<Knowledge[]> {
    // Find the agent first to get the ID
    const agentRec = await selectAgentWithModelBySlug(slug); // Use function from this repo
    if (!agentRec) {
        return [];
    }
    // Then fetch knowledge using the ID by calling the knowledge repository function
    return await selectKnowledgeByAgentId(agentRec.id); // Use imported function
}

/**
 * Retrieves all tags for a given agent slug.
 * Uses other repository functions.
 * @param slug – the URL-friendly agent slug
 * @returns array of Tag records, or [] if no such agent
 */
export async function selectTagsByAgentSlug(slug: string): Promise<Tag[]> {
    // Find the agent first to get the ID
    const agentRec = await selectAgentWithModelBySlug(slug); // Use function from this repo
    if (!agentRec) {
        return [];
    }
    // Then fetch tags using the ID by calling the tag repository function
    return await selectTagsByAgentId(agentRec.id); // Use imported function
}

