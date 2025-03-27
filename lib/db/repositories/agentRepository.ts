import { and, asc, desc, eq, or, lt, gte, sql } from 'drizzle-orm';
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
    const result = await db.select({
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
      onlyUserCreated && userId 
        ? eq(agents.creatorId, userId)
        : or(
            eq(agents.visibility, 'public'), 
            userId ? eq(agents.creatorId, userId) : undefined
          )
    )
    .orderBy(desc(agents.id));

    // For each agent, fetch their models, tool groups, and tags
    const agentsWithModels = await Promise.all(
      result.map(async (agent) => {
        // Fetch models
        const agentModelResults = await db.select({
          model: models,
          isDefault: agentModels.isDefault
        })
        .from(agentModels)
        .leftJoin(models, eq(agentModels.modelId, models.id)) // Will use the index on agentModels.modelId
        .where(eq(agentModels.agentId, agent.id)); // Will use the index on agentModels.agentId

        const agentModelsArray = agentModelResults
          .map(r => r.model)
          .filter((model): model is typeof models.$inferSelect => model !== null);
          
        const defaultModel = agentModelResults.find(r => r.isDefault)?.model || null;

        // Fetch tool groups
        const toolGroupResults = await db.select({
          id: toolGroups.id,
          name: toolGroups.name,
          display_name: toolGroups.display_name,
          description: toolGroups.description,
        })
        .from(agentToolGroups)
        .leftJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id)) // Will use the index on agentToolGroups.toolGroupId
        .where(eq(agentToolGroups.agentId, agent.id)); // Will use the index on agentToolGroups.agentId

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
        .innerJoin(tags, eq(agentTags.tagId, tags.id)) // Will use the index on agentTags.tagId
        .where(eq(agentTags.agentId, agent.id)) // Will use the index on agentTags.agentId
        .orderBy(tags.name);
        
        // Always fetch total earnings for this agent if includeEarnings is true
        let totalSpent = 0;
        
        if (includeEarnings) {
          // Define date filtering conditions based on timePeriod
          let dateCondition;
          
          if (timePeriod === 'current-month') {
            // Current month
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateCondition = and(
              gte(userTransactions.created_at, firstDayOfMonth)
            );
          } else if (timePeriod === 'previous-month') {
            // Previous month
            const now = new Date();
            const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            dateCondition = and(
              gte(userTransactions.created_at, firstDayOfPreviousMonth),
              lt(userTransactions.created_at, firstDayOfCurrentMonth)
            );
          }
          
          // Get total amount spent on this agent (only "usage" transactions, not "self_usage")
          const transactionResults = await db
            .select({
              totalSpent: sql<string>`COALESCE(SUM(${userTransactions.amount}::numeric), 0)::text`
            })
            .from(userTransactions)
            .where(
              dateCondition 
                ? and(
                    eq(userTransactions.agentId, agent.id),
                    eq(userTransactions.type, 'usage'),
                    dateCondition
                  )
                : and(
                    eq(userTransactions.agentId, agent.id),
                    eq(userTransactions.type, 'usage')
                  )
            );
          
          // Convert the string to a number, Math.abs because usage transactions are negative
          totalSpent = transactionResults[0] ? Math.abs(Number(transactionResults[0].totalSpent)) : 0;
        }

        if (includeAllModels) {
          return {
            ...agent,
            models: agentModelsArray,
            toolGroups: toolGroupsArray,
            tags: tagResults,
            totalSpent
          };
        } else {
          return {
            ...agent,
            model: defaultModel,
            toolGroups: toolGroupsArray,
            tags: tagResults,
            totalSpent
          };
        }
      })
    );

    return agentsWithModels;
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
    // Get the agent
    const [agentData] = await db.select().from(agents).where(eq(agents.id, id));
    
    if (!agentData) return null;

    // Get all models for this agent
    const agentModelResults = await db.select({
      modelId: agentModels.modelId,
      isDefault: agentModels.isDefault
    })
    .from(agentModels)
    .where(eq(agentModels.agentId, id));

    // Get full model details for each agent model
    const modelDetails = await Promise.all(
      agentModelResults.map(async (modelRef) => {
        const [modelData] = await db
          .select()
          .from(models)
          .where(eq(models.id, modelRef.modelId));
        
        return modelData ? {
          ...modelData,
          isDefault: modelRef.isDefault
        } : null;
      })
    );

    // Filter out null results and sort (default first)
    const availableModels = modelDetails
      .filter((model): model is (typeof models.$inferSelect & { isDefault: boolean | null }) => model !== null)
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });

    // Get knowledge items for this agent
    const knowledgeItems = await db
      .select()
      .from(knowledge_items)
      .where(eq(knowledge_items.agentId, id));

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
export const getAgents = async (userId?: string, onlyUserCreated?: boolean) => {
  try {
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
    .where(
      onlyUserCreated && userId 
        ? eq(agents.creatorId, userId)
        : or(
            eq(agents.visibility, 'public'), 
            userId ? eq(agents.creatorId, userId) : undefined
          )
    )
    .orderBy(desc(agents.createdAt));

    return result.map(agent => ({
      ...agent,
      tags: agent.tags?.map(name => ({ name })), // Convert to minimal tag shape
      toolGroups: agent.tool_groups?.map(display_name => ({ display_name })) // Convert to minimal tool group shape
    }));
  } catch (error) {
    return handleDbError(error, 'Failed to get agents from database', []);
  }
} 