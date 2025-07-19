import { eq, desc, and, sql, or, ilike, count, getTableColumns, type SQL } from 'drizzle-orm';

import { Agent, agent, agentModels, agentTags, Knowledge, models, Tag, tags } from '../schema/agent';
import { chat, message } from '../schema/chat';
import { db } from '..';

import { selectTagsByAgentId } from './tag.repository';
import { selectKnowledgeByAgentId } from './knowledge.repository';
import { generateAgentSlug } from '@/lib/utils'; // Import the slug generation utility

// Define the type for the data needed to insert an agent
// Note: Slug is intentionally omitted here as it's generated internally
// Allow optional showReasoning when creating so the default value can be used
export type NewAgent = Omit<typeof agent.$inferInsert, 'slug' | 'showReasoning'> & {
    showReasoning?: boolean;
};

// Define the structure for a tag within the agent result (Keep here or move to shared types)
export type AgentTagInfo = { id: string; name: string };


/**
 * Inserts a new agent into the database and generates its slug.
 * @param newAgentData - The data for the new agent (excluding slug).
 * @returns The newly inserted and updated agent record with the generated slug.
 */
export async function insertAgent(newAgentData: NewAgent): Promise<Agent[]> {
    // 1️⃣ Create the agent row *without* the slug initially
    const initialInsertResult = await db
        .insert(agent)
        .values({
            ...newAgentData,
            slug: null // Explicitly set slug to null initially
        })
        .returning({ id: agent.id, name: agent.name }); // Only return needed fields for slug generation

    if (!initialInsertResult || initialInsertResult.length === 0) {
        throw new Error("Failed to insert agent record initially.");
    }

    const { id: newAgentId, name: newAgentName } = initialInsertResult[0];

    // 2️⃣ Generate the slug using the utility function
    const generatedSlug = generateAgentSlug(newAgentName, newAgentId);

    // 3️⃣ Update the agent record with the generated slug
    const updatedAgentResult = await db
        .update(agent)
        .set({ slug: generatedSlug, updatedAt: new Date() }) // Also update updatedAt
        .where(eq(agent.id, newAgentId))
        .returning(); // Return the full updated record

    if (!updatedAgentResult || updatedAgentResult.length === 0) {
        // This is unlikely but handle defensively
        throw new Error("Failed to update agent record with generated slug.");
    }

    // 4️⃣ Optional: Backfill primary model in agent_models if needed (logic remains the same)
    // if (newAgentData.primaryModelId) { // Check if primaryModelId exists in input data
    //     await db.insert(agentModels).values({
    //         agentId: newAgentId,
    //         modelId: newAgentData.primaryModelId,
    //         role: 'primary',
    //     }).onConflictDoNothing();
    // }

    return updatedAgentResult; // Return the final, updated agent record
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
export type UpdateAgentInput =
    Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'primaryModelId' | 'creatorId' | 'showReasoning'>> & {
        primaryModelId?: string;
        showReasoning?: boolean;
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
    if (Object.keys(otherAgentFields).length > 0) {
        await db // No need to store the result as it's fetched again later
            .update(agent)
            // *** CRITICAL CHANGE: Only set fields other than primaryModelId ***
            .set({ ...otherAgentFields, updatedAt: new Date() })
            .where(eq(agent.id, agentId));
            // .returning() is removed as the result wasn't used
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
    slug: string | null; // Slug can be null temporarily during creation
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
    offset: number = 0, // Provide default offset
    userId?: string // Add userId parameter
): Promise<RecentAgentResult[]> {
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(jsonb_agg(distinct jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]'::jsonb)`.as('tags');

    const queryBuilder = db
        .select({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            thumbnailUrl: agent.thumbnailUrl,
            // Slug might be null if fetched before update, handle in application logic if needed
            slug: agent.slug,
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

    // --- Visibility/Ownership Filter ---
    // Agent must be public OR belong to the user (if userId is provided)
    whereConditions.push(
        or(
            eq(agent.visibility, 'public'),
            userId ? eq(agent.creatorId, userId) : sql`false`
        ) as SQL
    );
    // --- End Visibility/Ownership Filter ---

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
                ilike(agent.name, searchPattern) as SQL,
                ilike(agent.description, searchPattern) as SQL,
                sql`${agent.id} in ${tagSearchSubQuery}`
            ) as SQL
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

    // Cast needed because select includes aggregated 'tags'
    return await finalQuery as RecentAgentResult[];
}

export type PopularAgentResult = RecentAgentResult & { messageCount: number };

/**
 * Selects agents ordered by total message count (popularity).
 * Filtering options mirror selectRecentAgents.
 */
export async function selectPopularAgents(
    tagName?: string,
    searchQuery?: string,
    limit: number = 20,
    offset: number = 0,
    userId?: string
): Promise<PopularAgentResult[]> {
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(jsonb_agg(distinct jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]'::jsonb)`.as('tags');
    const messageCount = sql<number>`count(${message.id})`.as('message_count');

    const queryBuilder = db
        .select({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            thumbnailUrl: agent.thumbnailUrl,
            slug: agent.slug,
            avatarUrl: agent.avatarUrl,
            creatorId: agent.creatorId,
            tags: tagsAgg,
            createdAt: agent.createdAt,
            visibility: agent.visibility,
            messageCount
        })
        .from(agent)
        .leftJoin(agentTags, eq(agent.id, agentTags.agentId))
        .leftJoin(tags, eq(agentTags.tagId, tags.id))
        .leftJoin(chat, eq(chat.agentId, agent.id))
        .leftJoin(message, eq(message.chatId, chat.id));

    const whereConditions = [] as SQL[];

    whereConditions.push(
        or(
            eq(agent.visibility, 'public'),
            userId ? eq(agent.creatorId, userId) : sql`false`
        ) as SQL
    );

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
                ilike(agent.name, searchPattern) as SQL,
                ilike(agent.description, searchPattern) as SQL,
                sql`${agent.id} in ${tagSearchSubQuery}`
            ) as SQL
        );
    }

    let finalQuery = queryBuilder.$dynamic();
    if (whereConditions.length > 0) {
        finalQuery = finalQuery.where(and(...whereConditions));
    }

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
    .orderBy(desc(messageCount))
    .limit(limit)
    .offset(offset);

    return await finalQuery as PopularAgentResult[];
}

/**
 * Counts the total number of agents matching the optional tag and search filtering.
 * Uses CTEs for potentially better performance and readability on complex counts.
 * @param tagName - Optional tag name to filter agents by.
 * @param searchQuery - Optional search query to filter agents by name, description, or tag name.
 * @returns The total count of matching agents.
 */
export async function countAgents(tagName?: string, searchQuery?: string, userId?: string): Promise<number> {
    // Build the filtering logic similarly to selectRecentAgents
    const whereConditions = [];

    // --- Visibility/Ownership Filter ---
    whereConditions.push(
        or(
            eq(agent.visibility, 'public'),
            userId ? eq(agent.creatorId, userId) : sql`false`
        ) as SQL
    );
    // --- End Visibility/Ownership Filter ---

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
                ilike(agent.name, searchPattern) as SQL,
                ilike(agent.description, searchPattern) as SQL,
                sql`${agent.id} in ${tagSearchSubQuery}`
            ) as SQL
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
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(jsonb_agg(distinct jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]'::jsonb)`.as('tags');

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
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(jsonb_agg(distinct jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]'::jsonb)`.as('tags');

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
    const tagsAgg = sql<AgentTagInfo[]>`coalesce(jsonb_agg(distinct jsonb_build_object('id', ${tags.id}, 'name', ${tags.name})) filter (where ${tags.id} is not null), '[]'::jsonb)`.as('tags');

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
