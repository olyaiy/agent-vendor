import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { db } from '../client';
import { chat, agents, message } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { ilike } from '../utils/queryUtils';

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
 * Delete a chat by ID
 */
export async function deleteChatById({ id }: { id: string }) {
  try {
    // First delete all messages for this chat
    await db.delete(message).where(eq(message.chatId, id));

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
 * Get a single chat by ID
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
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    
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