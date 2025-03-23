import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, inArray, isNotNull, or, sql, lt } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateSlug, generateUUID } from '@/lib/utils';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  agents,
  models,
  agentModels,
  type Agent,
  type Model,
  toolGroups,
  type ToolGroup,
  agentToolGroups,
  tools,
  toolGroupTools,
  userCredits,
  userTransactions,
  tags,
  agentTags,
  type DBMessage,
  suggestedPrompts,
  knowledge_items,
} from './schema';  
import { ArtifactKind } from '@/components/artifact/artifact';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    // Will use the index on user.email
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string, userName?: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash, user_name: userName });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  agentId,
}: {
  id: string;
  userId: string;
  title: string;
  agentId: string;
}) {
  try {
    const result = await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
      agentId,
    });
    return result;
  } catch (error) {
    console.error('Failed to save chat in database:', error);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    // Will use the index on chat.userId
    return await db
      .select({
        id: chat.id,
        createdAt: chat.createdAt,
        title: chat.title,
        userId: chat.userId,
        agentId: chat.agentId,
        visibility: chat.visibility,
        agentDisplayName: agents.agent_display_name
      })
      .from(chat)
      .leftJoin(agents, eq(chat.agentId, agents.id)) // This join will use the index on chat.agentId
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt)); // Will use the index on chat.createdAt
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ 
  messages, 
  model_id,
}: { 
  messages: Array<DBMessage>; 
  model_id?: string;
}) {
  try {
    // Maps model_id to messages
    const messagesToSave = messages.map(msg => ({
      ...msg,
      id: msg.id || generateUUID(),
      model_id: model_id || msg.model_id,
    }));

    await db.insert(message).values(messagesToSave);
    
    // Return the messages with their generated IDs
    return messagesToSave;
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    // Will use the index on message.chatId
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database');
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

// Define extended types for the agent with models
type AgentWithModels = Agent & {
  models: Model[];
  defaultModel: Model | null;
};

export const getAgents = async (userId?: string, includeAllModels?: boolean, includeEarnings?: boolean, onlyUserCreated?: boolean, timePeriod: string = 'all-time') => {
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
      image_url: agents.image_url,
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
          .filter((model): model is Model => model !== null);
          
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
    console.error('Failed to get agents from database');
    throw error;
  }
}

export async function getAgentById(id: string) {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
    return null;
  }

  try {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  } catch (error) {
    console.error('Failed to get agent by id from database');
    throw error;
  }
}

export async function getModelById(id: string) {
  try {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  } catch (error) {
    console.error('Failed to get model by id from database');
    throw error;
  }
}

export async function createAgent({
  agentDisplayName,
  systemPrompt,
  description,
  modelId,
  visibility,
  creatorId,
  artifactsEnabled,
  imageUrl,
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
  imageUrl?: string | null;
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
        image_url: imageUrl,
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
      await updateAgentTags(agent.id, tagIds);
    }

    return agent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

export async function deleteAgentQuery(id: string) {
  try {
    return await db.delete(agents).where(eq(agents.id, id));
  } catch (error) {
    console.error('Failed to delete agent from database');
    throw error;
  }
}

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
    console.error('Failed to get agent with model from database');
    throw error;
  }
}

export async function updateAgentById({
  id,
  agentDisplayName,
  systemPrompt,
  description,
  modelId,
  visibility,
  artifactsEnabled,
  imageUrl,
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
  imageUrl?: string | null;
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
        image_url: imageUrl,
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
      await updateAgentTags(id, tagIds);
    }

    return updatedAgent;
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
}

// Specialized function to get an agent with all model information for editing
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
    console.error('Failed to get agent with models from database');
    throw error;
  }
}

// Function to get an agent with all its available models for the chat interface
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
      .filter((model): model is (Model & { isDefault: boolean | null }) => model !== null)
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return 0;
      });

    return {
      agent: agentData,
      availableModels
    };
  } catch (error) {
    console.error('Failed to get agent with available models from database');
    throw error;
  }
}

// Get all tool groups
export async function getAllToolGroups() {
  try {
    return await db.select({
      id: toolGroups.id,
      name: toolGroups.name,
      displayName: toolGroups.display_name,
      description: toolGroups.description,
    })
    .from(toolGroups)
    .orderBy(asc(toolGroups.display_name));
  } catch (error) {
    console.error('Failed to get tool groups from database');
    throw error;
  }
}

// Get tool groups for a specific agent
export async function getToolGroupsByAgentId(agentId: string) {
  try {
    const result = await db.select({
      id: toolGroups.id,
      name: toolGroups.name,
      displayName: toolGroups.display_name,
      description: toolGroups.description,
    })
    .from(agentToolGroups)
    .innerJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id))
    .where(eq(agentToolGroups.agentId, agentId));
    
    return result;
  } catch (error) {
    console.error('Failed to get tool groups for agent from database');
    throw error;
  }
}

// Get tools by tool group id
export async function getToolsByToolGroupId(toolGroupId: string) {
  try {
    const result = await db.select({
      id: tools.id,
      displayName: tools.tool_display_name,
      tool: tools.tool,
      description: tools.description,
    })
    .from(tools)
    .innerJoin(
      toolGroupTools, 
      eq(tools.id, toolGroupTools.toolId)
    )
    .where(eq(toolGroupTools.toolGroupId, toolGroupId));
    
    return result;
  } catch (error) {
    console.error('Failed to get tools by tool group id from database');
    throw error;
  }
}

export async function searchChatsByContent({ 
  userId, 
  searchTerm 
}: { 
  userId: string; 
  searchTerm: string;
}) {
  if (!searchTerm.trim()) {
    return await getChatsByUserId({ id: userId });
  }

  try {
    // Will use the index on chat.userId and join will use message.chatId index
    const matchingMessages = await db
      .select({
        messageId: message.id,
        chatId: message.chatId,
        role: message.role,
        content: message.parts,
        createdAt: message.createdAt
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, userId), // Uses the index on chat.userId
          or(
            sql`CAST(${message.parts} AS TEXT) ILIKE ${'%' + searchTerm + '%'}`,
            sql`CAST(${message.parts}->>'text' AS TEXT) ILIKE ${'%' + searchTerm + '%'}`,
            sql`CAST(${message.parts}->>'value' AS TEXT) ILIKE ${'%' + searchTerm + '%'}`,
            sql`CAST(${message.parts}->>'content' AS TEXT) ILIKE ${'%' + searchTerm + '%'}`
          )
        )
      );

    // If no message matches, fallback to chat title and agent name search
    if (matchingMessages.length === 0) {
      return await db
        .select({
          id: chat.id,
          createdAt: chat.createdAt,
          title: chat.title,
          userId: chat.userId,
          agentId: chat.agentId,
          visibility: chat.visibility,
          agentDisplayName: agents.agent_display_name
        })
        .from(chat)
        .leftJoin(agents, eq(chat.agentId, agents.id))
        .where(
          and(
            eq(chat.userId, userId),
            or(
              sql`${chat.title} ILIKE ${'%' + searchTerm + '%'}`,
              sql`${agents.agent_display_name} ILIKE ${'%' + searchTerm + '%'}`
            )
          )
        )
        .orderBy(desc(chat.createdAt));
    }

    // STEP 2: Process the matching messages
    // Count occurrences per chat and extract snippets
    const chatMatches: Record<string, { 
      count: number; 
      snippets: Array<{ text: string; messageId: string }>
    }> = {};

    matchingMessages.forEach(msg => {
      // Get the chatId to group by
      const chatId = msg.chatId;
      
      // Initialize chat entry if not exists
      if (!chatMatches[chatId]) {
        chatMatches[chatId] = { count: 0, snippets: [] };
      }

      // Extract content text from the message JSON
      let contentText = '';
      
      if (typeof msg.content === 'object' && msg.content !== null) {
        // Method 1: Try common JSON patterns
        if ('text' in msg.content && msg.content.text) {
          contentText = String(msg.content.text);
        } else if ('value' in msg.content && msg.content.value) {
          contentText = String(msg.content.value);
        } else if ('content' in msg.content && msg.content.content) {
          contentText = String(msg.content.content);
        } 
        // Method 2: If still no content, try stringifying the entire object
        else {
          try {
            contentText = JSON.stringify(msg.content);
          } catch (e) {
            // If stringify fails, use an empty string
            contentText = '';
          }
        }
      } else if (typeof msg.content === 'string') {
        contentText = msg.content;
      }

      // Skip if no extractable content
      if (!contentText) return;

      // Increment match count for this chat
      chatMatches[chatId].count++;

      // Extract snippet with context (limit to first 3 snippets per chat)
      if (chatMatches[chatId].snippets.length < 3) {
        const lowerContent = contentText.toLowerCase();
        const lowerTerm = searchTerm.toLowerCase();
        const index = lowerContent.indexOf(lowerTerm);

        if (index >= 0) {
          // Create snippet with some context
          const start = Math.max(0, index - 40);
          const end = Math.min(contentText.length, index + searchTerm.length + 40);
          let snippet = contentText.substring(start, end);

          // Add ellipsis if needed
          if (start > 0) snippet = '...' + snippet;
          if (end < contentText.length) snippet = snippet + '...';

          chatMatches[chatId].snippets.push({
            text: snippet,
            messageId: msg.messageId
          });
        }
      }
    });

    // STEP 3: Get complete chat data for all the matching chat IDs
    const matchingChatIds = Object.keys(chatMatches);
    
    if (matchingChatIds.length === 0) {
      return [];
    }


    const chatsWithAgents = await db
      .select({
        id: chat.id,
        createdAt: chat.createdAt,
        title: chat.title,
        userId: chat.userId,
        agentId: chat.agentId,
        visibility: chat.visibility,
        agentDisplayName: agents.agent_display_name
      })
      .from(chat)
      .leftJoin(agents, eq(chat.agentId, agents.id))
      .where(inArray(chat.id, matchingChatIds));
    
    // STEP 4: Combine the chat data with match information and sort by match count
    const result = chatsWithAgents.map(chat => ({
      ...chat,
      matchCount: chatMatches[chat.id]?.count || 0,
      matchSnippets: chatMatches[chat.id]?.snippets || []
    })).sort((a, b) => b.matchCount - a.matchCount);

    return result;
  } catch (error) {
    console.error('Failed to search chats by content', error);
    throw error;
  }
}

export async function getUserTokenUsage(userId: string) {
  try {
    // Fetch model data for all models
    const modelsData = await db
      .select({
        id: models.id,
        modelName: models.model_display_name,
        provider: models.provider,
        costPerMillionInputTokens: models.cost_per_million_input_tokens,
        costPerMillionOutputTokens: models.cost_per_million_output_tokens
      })
      .from(models);
    
    // Create a map of model ID to model info
    const modelInfoMap = new Map();
    modelsData.forEach(model => {
      modelInfoMap.set(model.id, {
        modelName: model.modelName,
        provider: model.provider,
        costPerMillionInputTokens: model.costPerMillionInputTokens ? Number(model.costPerMillionInputTokens) : null,
        costPerMillionOutputTokens: model.costPerMillionOutputTokens ? Number(model.costPerMillionOutputTokens) : null
      });
    });
    
    // Fetch usage transactions for the user
    const transactions = await db
      .select({
        modelId: userTransactions.modelId,
        tokenAmount: userTransactions.tokenAmount,
        tokenType: userTransactions.tokenType,
        amount: userTransactions.amount,
      })
      .from(userTransactions)
      .where(
        and(
          eq(userTransactions.userId, userId),
          eq(userTransactions.type, 'usage')
        )
      );
    
    // Prepare data structure for token usage by model
    const tokenUsageByModel = new Map();
    
    // Default "unknown model" for transactions without model info
    tokenUsageByModel.set('unknown', {
      modelName: 'Unknown Model',
      provider: '',
      inputTokens: 0,
      outputTokens: 0,
      costPerMillionInputTokens: null,
      costPerMillionOutputTokens: null,
      cost: 0
    });
    
    // Process each transaction and attribute to the right model
    transactions.forEach(transaction => {
      if (!transaction.modelId || !transaction.tokenAmount || !transaction.tokenType) {
        return; // Skip transactions with missing data
      }
      
      let modelKey = transaction.modelId || 'unknown';
      let modelName = 'Unknown Model';
      let provider = '';
      
      // If we can determine the model, use it
      if (modelInfoMap.has(modelKey)) {
        const modelInfo = modelInfoMap.get(modelKey);
        modelName = modelInfo.modelName;
        provider = modelInfo.provider;
      }
      
      // Initialize model data if not exists
      if (!tokenUsageByModel.has(modelKey)) {
        const modelInfo = modelInfoMap.get(modelKey) || {};
        tokenUsageByModel.set(modelKey, {
          modelName,
          provider,
          inputTokens: 0,
          outputTokens: 0,
          costPerMillionInputTokens: modelInfo.costPerMillionInputTokens || null,
          costPerMillionOutputTokens: modelInfo.costPerMillionOutputTokens || null,
          cost: 0
        });
      }
      
      // Add token usage to appropriate category
      const modelData = tokenUsageByModel.get(modelKey);
      
      if (transaction.tokenType === 'input') {
        modelData.inputTokens += transaction.tokenAmount;
      } else if (transaction.tokenType === 'output') {
        modelData.outputTokens += transaction.tokenAmount;
      }
      
      // Add the cost directly from the transaction amount
      if (transaction.amount) {
        modelData.cost += Number(transaction.amount);
      }
    });
    
    // Convert map to array and sort by total usage
    const result = Array.from(tokenUsageByModel.values())
      .filter(model => model.inputTokens > 0 || model.outputTokens > 0)
      .sort((a, b) => 
        (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens)
      );
    
    return result;
  } catch (error) {
    console.error('Failed to get user token usage from database', error);
    return []; // Return empty array instead of throwing
  }
}

export async function getUserTransactions(
  userId: string, 
  page = 1, 
  pageSize = 10,
  type: "usage" | "purchase" | "refund" | "promotional" | "adjustment" | null = null,
  startDate: string | null = null,
  endDate: string | null = null
) {
  try {
    // Calculate offset based on page number and page size
    const offset = (page - 1) * pageSize;
    
    // Build the base condition with user ID
    let conditions = [eq(userTransactions.userId, userId)];
    
    // Add type filter if provided
    if (type) {
      conditions.push(eq(userTransactions.type, type));
    }
    
    // Add date range filters if provided
    if (startDate) {
      const startDateObj = new Date(startDate);
      conditions.push(gte(userTransactions.created_at, startDateObj));
    }
    
    if (endDate) {
      // Set the end date to the end of the day (23:59:59)
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      conditions.push(sql`${userTransactions.created_at} <= ${endDateObj}`);
    }
    
    // Combine all conditions with AND
    const whereConditions = and(...conditions);
    
    // First, get the total count of transactions for pagination with filters
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTransactions)
      .where(whereConditions);
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    // Get the transactions with message content if available, applying the same filters
    const transactions = await db
      .select({
        id: userTransactions.id,
        amount: userTransactions.amount,
        type: userTransactions.type,
        description: userTransactions.description,
        created_at: userTransactions.created_at,
        messageId: userTransactions.messageId,
        messageContent: message.parts,
      })
      .from(userTransactions)
      .leftJoin(message, eq(userTransactions.messageId, message.id))
      .where(whereConditions)
      .orderBy(desc(userTransactions.created_at))
      .limit(pageSize)
      .offset(offset);
    
    return {
      transactions,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Failed to get user transactions:', error);
    return {
      transactions: [],
      totalCount: 0,
      pageCount: 0
    };
  }
}

export async function recordTransaction({
  userId,
  amount,
  type,
  description,
  messageId,
  tokenAmount,
  tokenType,
  modelId,
  agentId,
  costPerMillionInput,
  costPerMillionOutput,
  usage
}: {
  userId: string;
  amount?: number;
  type: 'usage' | 'purchase' | 'refund' | 'promotional' | 'adjustment' | 'self_usage';
  description?: string;
  messageId?: string;
  tokenAmount?: number;
  tokenType?: 'input' | 'output';
  modelId?: string;
  agentId?: string;
  // New parameter types
  costPerMillionInput?: string;
  costPerMillionOutput?: string;
  usage?: { promptTokens?: number; completionTokens?: number };
}) {
  try {
    // Calculate amount if usage data and cost rates are provided
    let calculatedAmount = amount;
    let inputCost = 0;
    let outputCost = 0;
    
    if ((type === 'usage' || type === 'self_usage') && usage && (costPerMillionInput || costPerMillionOutput)) {
      // Apply markup factor based on applyCreatorMarkup flag
      const MARKUP_FACTOR = type === 'self_usage' ? -1.08 : -1.18;

      // Calculate input and output costs
      inputCost = usage.promptTokens 
        ? (((usage.promptTokens || 0) * parseFloat(costPerMillionInput || '0')) / 1000000) * MARKUP_FACTOR
        : 0;
        
      outputCost = usage.completionTokens
        ? (((usage.completionTokens || 0) * parseFloat(costPerMillionOutput || '0')) / 1000000) * MARKUP_FACTOR
        : 0;


      // Total cost is the sum of input and output costs
      calculatedAmount = inputCost + outputCost;
      
      // 🚨 Total cost debug
   
    }
    
    if (calculatedAmount === undefined) {
      throw new Error('Transaction amount is required or must be calculable from provided parameters');
    }
    
    // Use a transaction to ensure both operations are atomic
    const transactions = await db.transaction(async (tx) => {
      const result = [];
      
      // For usage transactions with both input and output tokens, create two separate transactions
      if ((type === 'usage' || type === 'self_usage') && usage && usage.promptTokens && usage.completionTokens) {
        // Create transaction for input tokens
        const [inputTransaction] = await tx
          .insert(userTransactions)
          .values({
            userId,
            agentId,
            amount: inputCost.toString(), // Only the input cost
            type: type,
            description: description ? `${description} (Input)` : 'Token usage (Input)',
            messageId,
            tokenAmount: usage.promptTokens,
            tokenType: 'input',
            modelId
          })
          .returning();
          
        result.push(inputTransaction);
        
        // Create transaction for output tokens
        const [outputTransaction] = await tx
          .insert(userTransactions)
          .values({
            userId,
            agentId,
            amount: outputCost.toString(), // Only the output cost
            type: type,
            description: description ? `${description} (Output)` : 'Token usage (Output)',
            messageId,
            tokenAmount: usage.completionTokens,
            tokenType: 'output',
            modelId
          })
          .returning();
          
        result.push(outputTransaction);
      } else {
        // For other transaction types or when only one token type exists, create a single transaction
        const [newTransaction] = await tx
          .insert(userTransactions)
          .values({
            userId,
            agentId,
            amount: calculatedAmount.toString(), // Convert to string for numeric type
            type: type,
            description,
            messageId,
            tokenAmount: tokenAmount || ((type === 'usage' || type === 'self_usage') ? (usage?.promptTokens || 0) + (usage?.completionTokens || 0) : undefined),
            tokenType,
            modelId
          })
          .returning();

        result.push(newTransaction);
      }
      
      // Update the user's credit balance with the total amount
      // For usage, refund, or adjustment types, we modify the credit balance
      if (type === 'usage' || type === 'self_usage') {
        // Get current balance before update
        const [userCredit] = await tx
          .select({ balance: userCredits.credit_balance })
          .from(userCredits)
          .where(eq(userCredits.user_id, userId));

        const currentBalance = userCredit?.balance || 0;
        const newBalance = Number(currentBalance) + Number(calculatedAmount);


        await tx
          .update(userCredits)
          .set({
            credit_balance: sql`${userCredits.credit_balance} + ${calculatedAmount.toString()}`
          })
          .where(eq(userCredits.user_id, userId));

      } else if (type === 'purchase' || type === 'promotional') {
        // Get current balance before update
        const [userCredit] = await tx
          .select({ 
            balance: userCredits.credit_balance,
            lifetime: userCredits.lifetime_credits 
          })
          .from(userCredits)
          .where(eq(userCredits.user_id, userId));

        const currentBalance = userCredit?.balance || 0;
        const currentLifetime = userCredit?.lifetime || 0;
        const newBalance = Number(currentBalance) + Number(calculatedAmount);
        const newLifetime = Number(currentLifetime) + Number(calculatedAmount);

        // For purchase or promotional transactions, increase the credit balance
        await tx
          .update(userCredits)
          .set({
            credit_balance: sql`${userCredits.credit_balance} + ${calculatedAmount.toString()}`,
            lifetime_credits: sql`${userCredits.lifetime_credits} + ${calculatedAmount.toString()}`
          })
          .where(eq(userCredits.user_id, userId));
          

      } else if (type === 'refund' || type === 'adjustment') {
        // Get current balance before update
        const [userCredit] = await tx
          .select({ balance: userCredits.credit_balance })
          .from(userCredits)
          .where(eq(userCredits.user_id, userId));

        const currentBalance = userCredit?.balance || 0;
        const newBalance = Number(currentBalance) + Number(calculatedAmount);

        // For refund or adjustment transactions, modify based on amount sign
        await tx
          .update(userCredits)
          .set({
            credit_balance: sql`${userCredits.credit_balance} + ${calculatedAmount.toString()}`
          })
          .where(eq(userCredits.user_id, userId));
          
      }
      
      return result;
    });
    
    return transactions[0]; // Return the first transaction for backward compatibility
  } catch (error) {
    console.error('Failed to record transaction:', error);
    throw new Error('Failed to record transaction');
  }
}

export async function doesAgentHaveSearchTool(agentId: string): Promise<boolean> {
  try {
    // Get all tool groups associated with the agent
    const agentToolGroups = await getToolGroupsByAgentId(agentId);
    
    // If no tool groups, return false
    if (!agentToolGroups.length) return false;
    
    // Check each tool group for a search tool
    for (const toolGroup of agentToolGroups) {
      const tools = await getToolsByToolGroupId(toolGroup.id);
      
      // Look for a tool with 'search' or 'web_search' in the name or tool identifier
      const hasSearchTool = tools.some(tool => 
        tool.displayName.toLowerCase().includes('search') || 
        tool.tool.toLowerCase().includes('search')
      );
      
      if (hasSearchTool) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check if agent has search tool:', error);
    return false;
  }
}

export async function getAllTags() {
  try {
    const result = await db.select().from(tags).orderBy(tags.name);
    return result;
  } catch (error) {
    console.error('Error getting all tags:', error);
    throw error;
  }
}

export async function searchTags(searchTerm: string) {
  try {
    const result = await db
      .select()
      .from(tags)
      .where(sql`${tags.name} ILIKE ${`%${searchTerm}%`}`)
      .orderBy(tags.name);
    return result;
  } catch (error) {
    console.error('Error searching tags:', error);
    throw error;
  }
}

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
    console.error('Error getting tags by agent ID:', error);
    throw error;
  }
}

export async function createTag(name: string) {
  try {
    const [newTag] = await db
      .insert(tags)
      .values({ name })
      .returning();
    
    return newTag;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

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
      
  } catch (error) {
    console.error('Error updating agent tags:', error);
    throw error;
  }
}

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
    console.error('Error getting most common tags:', error);
    return [];
  }
}

export async function getSuggestedPromptsByAgentId(agentId: string): Promise<string[]> {
  try {
    const [result] = await db
      .select({
        prompts: suggestedPrompts.prompts
      })
      .from(suggestedPrompts)
      .where(eq(suggestedPrompts.agentId, agentId));

    // If no prompts found, return default array
    if (!result) {
      return [
        "What are the advantages of using Next.js?",
        "Help me write an essay about silicon valley",
        "Write code to demonstrate djikstras algorithm",
        "What is the weather in San Francisco?"
      ];
    }

    return result.prompts as string[];
  } catch (error) {
    console.error('Failed to get suggested prompts for agent:', error);
    // Return default prompts on error
    return [
      "What are the advantages of using Next.js?",
      "Help me write an essay about silicon valley",
      "Write code to demonstrate djikstras algorithm",
      "What is the weather in San Francisco?"
    ];
  }
}

export async function upsertSuggestedPrompts(agentId: string, prompts: string[]): Promise<void> {
  try {
    // First try to update existing record
    const updateResult = await db
      .update(suggestedPrompts)
      .set({ prompts })
      .where(eq(suggestedPrompts.agentId, agentId))
      .returning();

    // If no record was updated (updateResult is empty), insert a new one
    if (!updateResult.length) {
      await db
        .insert(suggestedPrompts)
        .values({
          agentId,
          prompts
        });
    }
  } catch (error) {
    console.error('Failed to upsert suggested prompts:', error);
    throw error;
  }
}

export async function getKnowledgeItems({ agentId }: { agentId: string }) {
  try {
    return await db
      .select()
      .from(knowledge_items)
      .where(eq(knowledge_items.agentId, agentId))
      .orderBy(desc(knowledge_items.createdAt));
  } catch (error) {
    console.error('Failed to get knowledge items from database:', error);
    throw error;
  }
}

export async function createKnowledgeItem({
  title,
  content,
  type,
  description,
  agentId
}: {
  title: string;
  content: any;
  type?: string;
  description?: string;
  agentId: string;
}) {
  try {
    const [item] = await db
      .insert(knowledge_items)
      .values({
        title,
        content,
        type: type || 'text',
        description,
        agentId,
        updatedAt: new Date()
      })
      .returning();
    
    return item;
  } catch (error) {
    console.error('Failed to create knowledge item in database:', error);
    throw error;
  }
}

export async function updateKnowledgeItem({
  id,
  title,
  content,
  type,
  description
}: {
  id: string;
  title?: string;
  content?: any;
  type?: string;
  description?: string;
}) {
  try {
    const updateValues: Partial<typeof knowledge_items.$inferInsert> = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateValues.title = title;
    if (content !== undefined) updateValues.content = content;
    if (type !== undefined) updateValues.type = type;
    if (description !== undefined) updateValues.description = description;
    
    const [updatedItem] = await db
      .update(knowledge_items)
      .set(updateValues)
      .where(eq(knowledge_items.id, id))
      .returning();
      
    return updatedItem;
  } catch (error) {
    console.error('Failed to update knowledge item in database:', error);
    throw error;
  }
}

export async function deleteKnowledgeItem({ id }: { id: string }) {
  try {
    await db
      .delete(knowledge_items)
      .where(eq(knowledge_items.id, id));
      
    return { success: true };
  } catch (error) {
    console.error('Failed to delete knowledge item from database:', error);
    throw error;
  }
}

export const getAgentToolsWithSingleQuery = async (agentId: string) => {
  // JOIN query that gets all tools for an agent in one database operation
  return await db.select({
    tool: tools.tool
  })
  .from(agentToolGroups)
  .innerJoin(toolGroupTools, eq(agentToolGroups.toolGroupId, toolGroupTools.toolGroupId))
  .innerJoin(tools, eq(toolGroupTools.toolId, tools.id))
  .where(eq(agentToolGroups.agentId, agentId));
};