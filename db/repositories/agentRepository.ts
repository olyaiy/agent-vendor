import { and, asc, desc, eq, or, lt, gte, sql, inArray } from 'drizzle-orm';
import { db } from '../client';
import { agents, agentModels, models, agentToolGroups, toolGroups, agentTags, tags, knowledge_items, userTransactions } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { generateSlug } from '@/lib/utils';

/**
 * Get all agents with optional filtering and includes
 */
export const getAgentsWithFullDetails = async (
  userId?: string, 
  includeAllModels?: boolean, 
  includeEarnings?: boolean, 
  onlyUserCreated?: boolean, 
  timePeriod: string = 'all-time'
) => {
  try {
    // Prepare date condition for transaction filtering
    let dateCondition;
    if (includeEarnings) {
      const now = new Date();
      if (timePeriod === 'current-month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateCondition = and(
          gte(userTransactions.created_at, firstDayOfMonth)
        );
      } else if (timePeriod === 'previous-month') {
        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateCondition = and(
          gte(userTransactions.created_at, firstDayOfPreviousMonth),
          lt(userTransactions.created_at, firstDayOfCurrentMonth)
        );
      }
    }

    // Define filter condition based on parameters
    const filterCondition = onlyUserCreated && userId 
      ? eq(agents.creatorId, userId)
      : or(
          eq(agents.visibility, 'public'),
          userId ? eq(agents.creatorId, userId) : sql`1 = 1`
        );

    // Execute single optimized query
    const result = await db.select({
      // Agent data
      id: agents.id,
      agent: agents.agent,
      agent_display_name: agents.agent_display_name,
      system_prompt: agents.system_prompt,
      description: agents.description,
      visibility: agents.visibility,
      creatorId: agents.creatorId,
      artifacts_enabled: agents.artifacts_enabled,
      thumbnail_url: agents.thumbnail_url,
      
      // Models data
      models: sql<any>`
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', ${models.id},
              'name', ${models.model_display_name},
              'provider', ${models.provider},
              'isDefault', ${agentModels.isDefault}
            )
          ) FILTER (WHERE ${models.id} IS NOT NULL),
          '[]'::jsonb
        )`,
      
      // Tool groups data
      toolGroups: sql<any>`
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', ${toolGroups.id},
              'name', ${toolGroups.name},
              'display_name', ${toolGroups.display_name},
              'description', ${toolGroups.description}
            )
          ) FILTER (WHERE ${toolGroups.id} IS NOT NULL),
          '[]'::jsonb
        )`,
      
      // Tags data 
      tags: sql<any>`
        COALESCE(
          JSONB_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', ${tags.id},
              'name', ${tags.name},
              'createdAt', ${tags.createdAt},
              'updatedAt', ${tags.updatedAt}
            )
          ) FILTER (WHERE ${tags.id} IS NOT NULL),
          '[]'::jsonb
        )`,
      
      // Usage calculations
      totalSpent: includeEarnings 
        ? sql<string>`
            COALESCE(
              ABS(SUM(
                CASE WHEN ${userTransactions.type} = 'usage' 
                THEN ${userTransactions.amount}::numeric 
                ELSE 0 END
              )),
              0
            )::text`
        : sql<string>`'0'`
    })
    .from(agents)
    // Join with models
    .leftJoin(
      agentModels,
      eq(agentModels.agentId, agents.id)
    )
    .leftJoin(
      models,
      eq(agentModels.modelId, models.id)
    )
    // Join with tool groups
    .leftJoin(
      agentToolGroups,
      eq(agentToolGroups.agentId, agents.id)
    )
    .leftJoin(
      toolGroups,
      eq(agentToolGroups.toolGroupId, toolGroups.id)
    )
    // Join with tags
    .leftJoin(
      agentTags,
      eq(agentTags.agentId, agents.id)
    )
    .leftJoin(
      tags,
      eq(agentTags.tagId, tags.id)
    )
    // Conditionally join with transactions (only if needed)
    .leftJoin(
      userTransactions,
      includeEarnings ? 
        and(
          eq(userTransactions.agentId, agents.id),
          eq(userTransactions.type, 'usage'),
          dateCondition
        ) : 
        undefined
    )
    .where(filterCondition)
    .groupBy(agents.id)
    .orderBy(desc(agents.id));

    // Process results 
    return result.map(agent => {
      // Parse JSON aggregations
      const modelsArray = JSON.parse(agent.models);
      const toolGroupsArray = JSON.parse(agent.toolGroups);
      const tagsArray = JSON.parse(agent.tags);
      
      if (includeAllModels) {
        return {
          ...agent,
          models: modelsArray,
          toolGroups: toolGroupsArray,
          tags: tagsArray,
          totalSpent: Number(agent.totalSpent)
        };
      } else {
        // Find default model
        const defaultModel = modelsArray.find((m: any) => m.isDefault) || null;
        return {
          ...agent,
          model: defaultModel,
          toolGroups: toolGroupsArray,
          tags: tagsArray,
          totalSpent: Number(agent.totalSpent)
        };
      }
    });
  } catch (error) {
    return handleDbError(error, 'Failed to get agents from database', []);
  }
}

/**
 * Get featured agents
 */
export const getFeaturedAgents = async (limit?: number) => {
  try {
    const query = db.select({
      id: agents.id,
      agent: agents.agent,
      agent_display_name: agents.agent_display_name,
      system_prompt: agents.system_prompt,
      description: agents.description,
      visibility: agents.visibility,
      creatorId: agents.creatorId,
      artifacts_enabled: agents.artifacts_enabled,
      thumbnail_url: agents.thumbnail_url,
    })
    .from(agents)
    .where(
      and(
        eq(agents.featured, true),
        eq(agents.visibility, 'public')
      )
    )
    .orderBy(desc(agents.id));

    // Apply limit if provided
    const result = limit ? await query.limit(limit) : await query;

    // For each agent, fetch their models, tool groups, and tags
    const featuredAgentsWithModels = await Promise.all(
      result.map(async (agent) => {
        // Fetch models
        const agentModelResults = await db.select({
          model: models,
          isDefault: agentModels.isDefault
        })
        .from(agentModels)
        .leftJoin(models, eq(agentModels.modelId, models.id))
        .where(eq(agentModels.agentId, agent.id));

        const defaultModel = agentModelResults.find(r => r.isDefault)?.model || null;

        // Fetch tool groups
        const toolGroupResults = await db.select({
          id: toolGroups.id,
          name: toolGroups.name,
          display_name: toolGroups.display_name,
          description: toolGroups.description,
        })
        .from(agentToolGroups)
        .leftJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id))
        .where(eq(agentToolGroups.agentId, agent.id));

        const toolGroupsArray = toolGroupResults
          .filter(tg => tg.id !== null && tg.name !== null && tg.display_name !== null)
          .map(tg => ({
            ...tg,
            id: tg.id!,
            name: tg.name!,
            display_name: tg.display_name!
          }));

        // Fetch tags
        const tagResults = await db.select({
          id: tags.id,
          name: tags.name,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt
        })
        .from(agentTags)
        .innerJoin(tags, eq(agentTags.tagId, tags.id))
        .where(eq(agentTags.agentId, agent.id))
        .orderBy(tags.name);

        return {
          ...agent,
          model: defaultModel,
          toolGroups: toolGroupsArray,
          tags: tagResults
        };
      })
    );

    return featuredAgentsWithModels;
  } catch (error) {
    return handleDbError(error, 'Failed to get featured agents from database', []);
  }
}

/**
 * Get an agent by ID
 */
export async function getAgentById(id: string) {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return null;
  }

  try {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  } catch (error) {
    return handleDbError(error, 'Failed to get agent by id from database', null);
  }
}

/**
 * Get agent with model by ID
 */
export async function getAgentWithModelById(id: string) {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return null;
  }

  try {
    const [agent] = await db
      .select({
        agent: agents
      })
      .from(agents)
      .where(eq(agents.id, id));

    if (!agent) return null;

    // Get all models for this agent
    const agentModelResults = await db.select({
      model: models,
      isDefault: agentModels.isDefault
    })
    .from(agentModels)
    .leftJoin(models, eq(agentModels.modelId, models.id))
    .where(eq(agentModels.agentId, id));

    // Get the default model
    const defaultModel = agentModelResults.find(r => r.isDefault)?.model || null;

    return {
      agent: agent.agent,
      model: defaultModel
    };
  } catch (error) {
    return handleDbError(error, 'Failed to get agent with model from database', null);
  }
}

/**
 * Get agent with all models for editing
 */
export async function getAgentWithAllModels(id: string) {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return null;
  }

  try {
    // Get the agent
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    
    if (!agent) return null;

    // Get all models for this agent
    const agentModelResults = await db.select({
      modelId: agentModels.modelId,
      isDefault: agentModels.isDefault
    })
    .from(agentModels)
    .leftJoin(models, eq(agentModels.modelId, models.id))
    .where(eq(agentModels.agentId, id));

    // Get all tool groups for this agent
    const agentToolGroupsResults = await db.select({
      toolGroupId: agentToolGroups.toolGroupId
    })
    .from(agentToolGroups)
    .where(eq(agentToolGroups.agentId, id));

    // Extract primary model and alternate models
    const defaultModel = agentModelResults.find(m => m.isDefault === true);
    const alternateModels = agentModelResults.filter(m => m.isDefault !== true);

    return {
      ...agent,
      modelId: defaultModel?.modelId || '',
      alternateModelIds: alternateModels.map(m => m.modelId),
      toolGroupIds: agentToolGroupsResults.map(tg => tg.toolGroupId)
    };
  } catch (error) {
    return handleDbError(error, 'Failed to get agent with models from database', null);
  }
}

/**
 * Delete an agent
 */
export async function deleteAgentQuery(id: string) {
  try {
    return await db.delete(agents).where(eq(agents.id, id));
  } catch (error) {
    return handleDbError(error, 'Failed to delete agent from database');
  }
}

/**
 * Create a new agent
 */
export async function createAgent({
  agentDisplayName,
  systemPrompt,
  description,
  modelId,
  visibility,
  creatorId,
  artifactsEnabled,
  thumbnailUrl,
  avatarUrl,
  customization,
  tagIds
}: {
  agentDisplayName: string;
  systemPrompt: string;
  description?: string;
  modelId: string;
  visibility: 'public' | 'private' | 'link';
  creatorId: string;
  artifactsEnabled?: boolean;
  thumbnailUrl?: string | null;
  avatarUrl?: string | null;
  customization?: {
    overview: {
      title: string;
      content: string;
      showPoints: boolean;
      points: string[];
    };
    style: {
      colorSchemeId: string;
    };
  };
  tagIds?: string[];
}) {
  try {
    // Generate slug from display name
    const slug = generateSlug(agentDisplayName);

    // Insert the new agent
    const [agent] = await db
      .insert(agents)
      .values({
        agent: slug,
        agent_display_name: agentDisplayName,
        system_prompt: systemPrompt,
        description,
        visibility,
        creatorId,
        artifacts_enabled: artifactsEnabled !== undefined ? artifactsEnabled : true,
        thumbnail_url: thumbnailUrl,
        avatar_url: avatarUrl,
        customization: customization as any, // Type cast for Drizzle JSON field
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Add primary model association
    await db
      .insert(agentModels)
      .values({
        agentId: agent.id,
        modelId,
        isDefault: true,
      });
    
    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      // Directly handle tag associations to avoid circular dependency
      const tagValues = tagIds.map(tagId => ({
        agentId: agent.id,
        tagId
      }));
      
      await db.insert(agentTags).values(tagValues);
    }

    return agent;
  } catch (error) {
    return handleDbError(error, 'Error creating agent');
  }
}

/**
 * Update an agent
 */
export async function updateAgentById({
  id,
  agentDisplayName,
  systemPrompt,
  description,
  modelId,
  visibility,
  artifactsEnabled,
  thumbnailUrl,
  avatarUrl,
  customization,
  tagIds
}: {
  id: string;
  agentDisplayName: string;
  systemPrompt: string;
  description?: string;
  modelId: string;
  visibility: 'public' | 'private' | 'link';
  artifactsEnabled?: boolean;
  thumbnailUrl?: string | null;
  avatarUrl?: string | null;
  customization?: {
    overview: {
      title: string;
      content: string;
      showPoints: boolean;
      points: string[];
    };
    style: {
      colorSchemeId: string;
    };
  };
  tagIds?: string[];
}) {
  try {
    // Generate slug from display name
    const slug = generateSlug(agentDisplayName);

    // Update the agent
    const [updatedAgent] = await db
      .update(agents)
      .set({
        agent: slug,
        agent_display_name: agentDisplayName,
        system_prompt: systemPrompt,
        description,
        visibility,
        artifacts_enabled: artifactsEnabled !== undefined ? artifactsEnabled : true,
        thumbnail_url: thumbnailUrl,
        avatar_url: avatarUrl,
        customization: customization as any, // Type cast for Drizzle JSON field
        updatedAt: new Date()
      })
      .where(eq(agents.id, id))
      .returning();

    // Update primary model association
    await db
      .delete(agentModels)
      .where(and(
        eq(agentModels.agentId, id),
        eq(agentModels.isDefault, true)
      ));

    await db
      .insert(agentModels)
      .values({
        agentId: id,
        modelId,
        isDefault: true,
      });
    
    // Update tags if provided
    if (tagIds) {
      // Delete existing tags for this agent
      await db
        .delete(agentTags)
        .where(eq(agentTags.agentId, id));
      
      // If there are tags to add, insert them
      if (tagIds.length > 0) {
        const tagValues = tagIds.map(tagId => ({
          agentId: id,
          tagId
        }));
        
        await db.insert(agentTags).values(tagValues);
      }
    }

    return updatedAgent;
  } catch (error) {
    return handleDbError(error, 'Error updating agent');
  }
}

/**
 * Get agent with all available models for the chat interface
 */
export async function getAgentWithAvailableModels(id: string) {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return null;
  }

  try {
    // Fetch agent, models, and knowledge items in parallel
    const [agentData, knowledgeItems] = await Promise.all([
      // Get the agent
      db.select().from(agents).where(eq(agents.id, id)).then(rows => rows[0]),
      
      // Get knowledge items for this agent
      db.select().from(knowledge_items).where(eq(knowledge_items.agentId, id))
    ]);
    
    if (!agentData) return null;

    // Use a single query with JOIN to get all models at once
    const modelResults = await db.select({
      id: models.id,
      model: models.model,
      model_display_name: models.model_display_name,
      provider: models.provider,
      model_type: models.model_type,
      description: models.description,
      cost_per_million_input_tokens: models.cost_per_million_input_tokens,
      cost_per_million_output_tokens: models.cost_per_million_output_tokens,
      provider_options: models.provider_options,
      // Only select known fields from schema
      isDefault: agentModels.isDefault
    })
    .from(agentModels)
    .innerJoin(models, eq(agentModels.modelId, models.id))
    .where(eq(agentModels.agentId, id));
    
    // Sort (default first)
    const availableModels = modelResults.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });

    return {
      agent: agentData,
      availableModels,
      knowledgeItems
    };
  } catch (error) {
    return handleDbError(error, 'Failed to get agent with available models from database', null);
  }
}

/**
 * Get agents with minimal details
 */
export const getAgents = async (userId?: string, onlyUserCreated?: boolean, agentIds?: string[]) => {
  try {
    let baseCondition;
    
    if (agentIds && agentIds.length > 0) {
      // Filter by specific agent IDs when provided
      baseCondition = inArray(agents.id, agentIds);
    } else {
      // Otherwise use the existing visibility/user filtering
      baseCondition = onlyUserCreated && userId 
        ? eq(agents.creatorId, userId)
        : or(
            eq(agents.visibility, 'public'), 
            userId ? eq(agents.creatorId, userId) : undefined
          );
    }

    const result = await db.select({
      id: agents.id,
      agent_display_name: agents.agent_display_name,
      thumbnail_url: agents.thumbnail_url,
      description: agents.description,
      visibility: agents.visibility,
      creatorId: agents.creatorId,
      createdAt: agents.createdAt,
      tags: sql<string[]>`(
        SELECT array_agg(tags.name)
        FROM agent_tags
        INNER JOIN tags ON agent_tags.tag_id = tags.id
        WHERE agent_tags.agent_id = agents.id
      )`,
      tool_groups: sql<string[]>`(
        SELECT array_agg(tool_groups.display_name)
        FROM agent_tool_groups
        INNER JOIN tool_groups ON agent_tool_groups.tool_group_id = tool_groups.id
        WHERE agent_tool_groups.agent_id = agents.id
      )`
    })
    .from(agents)
    .where(baseCondition)
    .orderBy(desc(agents.createdAt));

    return result.map(agent => ({
      ...agent,
      tags: agent.tags?.map(name => ({ name })), // Convert to minimal tag shape
      toolGroups: agent.tool_groups?.map(display_name => ({ display_name })) // Convert to minimal tool group shape
    }));
  } catch (error) {
    console.log("error is---------");
    console.log(error);
    return handleDbError(error, 'Failed to get agents from database', []);
  }
} 