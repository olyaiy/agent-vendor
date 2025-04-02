import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../client';
import { chat, agents, message, groupChat, groupChatAgents } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { ilike } from '../utils/queryUtils';
import { redis } from '@/lib/ratelimit';
import { v4 as uuidv4 } from 'uuid';

// Cache key prefixes
const CHAT_KEY_PREFIX = 'chat:';
const GROUP_CHAT_KEY_PREFIX = 'groupchat:';

// Cache expiration time in seconds (10 minutes)
const CACHE_EXPIRATION = 600;

/**
 * Save a new chat
 */
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
    return handleDbError(error, 'Failed to save chat in database:');
  }
}

/**
 * Invalidate chat cache
 * @param id Chat ID
 */
export async function invalidateChatCache(id: string): Promise<void> {
  await redis.del(`${CHAT_KEY_PREFIX}${id}`);
}

/**
 * Delete a chat by ID
 */
export async function deleteChatById({ id }: { id: string }) {
  try {
    // First delete all messages for this chat
    await db.delete(message).where(eq(message.chatId, id));

    // Invalidate cache when chat is deleted
    await invalidateChatCache(id);
    
    // Then delete the chat itself
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    return handleDbError(error, 'Failed to delete chat by id from database');
  }
}

/**
 * Get all chats for a user
 */
export async function getChatsByUserId({ id }: { id: string }) {
  try {
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
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    return handleDbError(error, 'Failed to get chats by user from database', []);
  }
}

/**
 * Get a single chat by ID with Redis caching
 */
export async function getChatById({ id }: { id: string }): Promise<{
  id: string;
  title: string;
  visibility: 'public' | 'private' | 'link';
  userId: string;
  agentId: string | null;
  createdAt: Date;
} | undefined> {
  try {
    // Try to get from cache first
    const cacheKey = `${CHAT_KEY_PREFIX}${id}`;
    const cachedChat = await redis.get<string>(cacheKey);
    
    if (cachedChat) {
      // Handle case where Redis client might have already parsed the JSON
      if (typeof cachedChat === 'object') {
        return cachedChat;
      }
      
      try {
        return JSON.parse(cachedChat);
      } catch (e) {
        console.error('Failed to parse cached chat:', e);
        // Continue to fetch from database if parsing fails
      }
    }
    
    // If not in cache, get from database
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    
    // Cache the result if chat exists
    if (selectedChat) {
      await redis.set(cacheKey, JSON.stringify(selectedChat), { ex: CACHE_EXPIRATION });
    }
    
    return selectedChat;
  } catch (error) {
    return handleDbError(error, 'Failed to get chat by id from database');
  }
}

/**
 * Update chat visibility setting
 */
export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public' | 'link';
}) {
  try {
    // Invalidate cache when chat is updated
    await invalidateChatCache(chatId);
    
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    return handleDbError(error, 'Failed to update chat visibility in database');
  }
}

/**
 * Search chats by content
 */
export async function searchChatsByContent({ 
  userId, 
  searchTerm 
}: { 
  userId: string; 
  searchTerm: string;
}) {
  if (!searchTerm.trim()) {
    return getChatsByUserId({ id: userId });
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
          eq(chat.userId, userId), 
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
    return handleDbError(error, 'Failed to search chats by content', []);
  }
}

// --------------------------------------------------
// Group Chat Functions
// --------------------------------------------------

/**
 * Invalidate group chat cache
 * @param id Group Chat ID
 */
export async function invalidateGroupChatCache(id: string): Promise<void> {
  await redis.del(`${GROUP_CHAT_KEY_PREFIX}${id}`);
}

/**
 * Creates a new group chat and assigns the initial agents within a transaction.
 *
 * @param userId The ID of the user creating the chat.
 * @param title The title of the group chat.
 * @param agentIds An array of agent IDs to add to the chat.
 * @returns The ID of the newly created group chat or null if an error occurred.
 */
export async function createGroupChatWithAgents(
  userId: string,
  title: string,
  agentIds: string[]
): Promise<string | null> {
  const newGroupChatId = uuidv4();

  try {
    await db.transaction(async (tx) => {
      // 1. Create the group chat entry
      await tx.insert(groupChat).values({
        id: newGroupChatId,
        userId,
        title,
        createdAt: new Date(),
        visibility: 'private', // Default visibility
      });

      // 2. Create entries in the junction table for each agent
      if (agentIds.length > 0) {
        const agentMappings = agentIds.map((agentId) => ({
          groupChatId: newGroupChatId,
          agentId,
          joinedAt: new Date(),
        }));
        await tx.insert(groupChatAgents).values(agentMappings);
      }
    });

    // Optionally invalidate any relevant caches here if needed later

    return newGroupChatId;
  } catch (error) {
    return handleDbError(error, 'Failed to create group chat with agents', null);
  }
}

/**
 * Get a single group chat by ID with Redis caching (Example - adjust as needed)
 */
export async function getGroupChatById({ id }: { id: string }): Promise<any | undefined> {
  try {
    const cacheKey = `${GROUP_CHAT_KEY_PREFIX}${id}`;
    const cachedGroupChat = await redis.get<string>(cacheKey);

    if (cachedGroupChat) {
        // Handle case where Redis client might have already parsed the JSON
        if (typeof cachedGroupChat === 'object') {
          return cachedGroupChat;
        }
        
        try {
            return JSON.parse(cachedGroupChat);
        } catch (e) {
            console.error('Failed to parse cached group chat:', e);
            // Continue to fetch from database if parsing fails
        }
    }

    // Example: Fetch group chat and its agents
    const [selectedGroupChat] = await db
        .select()
        .from(groupChat)
        .where(eq(groupChat.id, id));

    if (!selectedGroupChat) return undefined;

    const agentsInChat = await db
        .select({ agentId: groupChatAgents.agentId })
        .from(groupChatAgents)
        .where(eq(groupChatAgents.groupChatId, id));

    const result = { ...selectedGroupChat, agentIds: agentsInChat.map(a => a.agentId) };

    if (result) {
        await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_EXPIRATION });
    }

    return result;
  } catch (error) {
    return handleDbError(error, 'Failed to get group chat by id');
  }
}

/**
 * Get all group chats for a user
 */
export async function getGroupChatsByUserId({ id }: { id: string }) {
  try {
    // First get all group chats for the user
    const userGroupChats = await db
      .select({
        id: groupChat.id,
        createdAt: groupChat.createdAt,
        title: groupChat.title,
        userId: groupChat.userId,
        visibility: groupChat.visibility,
      })
      .from(groupChat)
      .where(eq(groupChat.userId, id))
      .orderBy(desc(groupChat.createdAt));

    if (!userGroupChats.length) {
      return [];
    }

    // Get all agents for these group chats
    const groupChatIds = userGroupChats.map(chat => chat.id);
    
    const agentsForGroupChats = await db
      .select({
        groupChatId: groupChatAgents.groupChatId,
        agentId: groupChatAgents.agentId,
        agentName: agents.agent_display_name,
        thumbnailUrl: agents.thumbnail_url,
      })
      .from(groupChatAgents)
      .innerJoin(agents, eq(groupChatAgents.agentId, agents.id))
      .where(inArray(groupChatAgents.groupChatId, groupChatIds));

    // Group the agents by group chat ID
    const agentsByGroupChat: Record<string, Array<{
      agentId: string;
      agentName: string | null;
      thumbnailUrl: string | null;
    }>> = {};

    agentsForGroupChats.forEach(agentInfo => {
      if (!agentsByGroupChat[agentInfo.groupChatId]) {
        agentsByGroupChat[agentInfo.groupChatId] = [];
      }
      
      agentsByGroupChat[agentInfo.groupChatId].push({
        agentId: agentInfo.agentId,
        agentName: agentInfo.agentName,
        thumbnailUrl: agentInfo.thumbnailUrl,
      });
    });

    // Combine the group chats with their agents
    return userGroupChats.map(chat => ({
      ...chat,
      agents: agentsByGroupChat[chat.id] || [],
    }));
  } catch (error) {
    return handleDbError(error, 'Failed to get group chats by user from database', []);
  }
} 