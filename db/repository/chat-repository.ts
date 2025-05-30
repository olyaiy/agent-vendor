import { db } from '../index';
import { chat, type Chat, message, type DBMessage } from '../schema/chat';
import { agent } from '../schema/agent'; // Add agent import
import { eq, asc, and, inArray, gte, desc, sql, or, ilike, count, exists, SQL } from 'drizzle-orm'; // Use base sql import
// Removed incorrect pg-core sql import

/**
 * Retrieves a chat by its ID
 * @param chatId - UUID of the chat to retrieve
 * @returns Chat record or undefined if not found
 */
export async function getChatById(chatId: string): Promise<Chat | undefined> {
  const [result] = await db
    .select()
    .from(chat)
    .where(eq(chat.id, chatId));
    
  return result;
}

/**
 * Retrieves the title and userId of a chat by its ID.
 * Used for efficient fetching when only title and ownership check are needed.
 * @param chatId - UUID of the chat to retrieve
 * @returns Object containing title and userId, or undefined if not found
 */
export async function getChatTitleAndUserId(chatId: string): Promise<Pick<Chat, 'title' | 'userId'> | undefined> {
  const [result] = await db
    .select({
      title: chat.title,
      userId: chat.userId,
    })
    .from(chat)
    .where(eq(chat.id, chatId));

  return result;
}


type NewChat = Pick<Chat, 'id' | 'userId' | 'title' | 'agentId'>;

/**
 * Creates a new chat conversation
 * @param newChat - Chat data containing id, userId, and title
 * @returns Created chat record
 */
export async function createChat(newChat: NewChat): Promise<Chat[]> {
  const insertedChat = await db
    .insert(chat)
    .values({
      id: newChat.id,
      userId: newChat.userId,
      title: newChat.title,
      createdAt: new Date(), // Explicitly set creation date
      visibility: 'private', // Default visibility as per schema
      agentId: newChat.agentId
    })
    .returning();
    
  return insertedChat;
}

/**
 * Updates the title of an existing chat
 * @param chatId - UUID of the chat to update
 * @param newTitle - The new title for the chat
 * @returns Update result (implementation might vary based on Drizzle version/needs)
 */
export async function updateChatTitle(chatId: string, newTitle: string) {
  // Consider adding error handling or checking the update result if needed
  await db
    .update(chat)
    .set({ title: newTitle })
    .where(eq(chat.id, chatId));
}

/**
 * Saves multiple messages to the database in a single transaction
 * @param messages - Array of DBMessage records to insert
 * @returns Promise resolving to the insert operation result
 */
export async function saveMessages({ messages }: { messages: DBMessage[] }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

/**
 * Retrieves messages for a specific chat ordered chronologically
 * @param id - UUID of the chat to retrieve messages for
 * @returns Array of message records
 * @throws Error if database operation fails
 */
export async function getMessagesByChatId({ id }: { id: string }): Promise<DBMessage[]> {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

/**
 * Deletes a single message by its ID
 * @param messageId - UUID of the message to delete
 */
export async function deleteMessageById(messageId: string) {
  await db
    .delete(message)
    .where(eq(message.id, messageId));
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

/**
 * Retrieves the most recent chat conversations for a user.
 * @param userId - The ID of the user.
 * @param limit - The maximum number of chats to retrieve (default: 20).
 * @returns Array of chat objects containing id, title, and agentId.
 * @throws Error if database operation fails
 */
export async function getUserRecentChats({
  userId,
  limit = 20,
}: {
  userId: string;
  limit?: number;
}): Promise<Array<{ id: string; title: string; agentId: string | null; agentSlug: string | null }>> {
  try {
    // Use proper join instead of raw SQL
    return await db
      .select({
        id: chat.id,
        title: chat.title,
        agentId: chat.agentId,
        agentSlug: agent.slug,
      })
      .from(chat)
      .leftJoin(agent, eq(chat.agentId, agent.id)) // Use proper join
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get recent chats for user from database', error);
    throw error;
  }
}


/**
 * Retrieves paginated chat conversations for a user, optionally filtered by a search query.
 * Searches across chat titles and text content within messages.
 * @param userId - The ID of the user.
 * @param searchQuery - Optional search term.
 * @param page - The page number (1-based).
 * @param pageSize - The number of chats per page.
 * @returns Object containing the list of chats and the total count.
 * @throws Error if database operation fails
 */
export async function getUserChatsPaginated({
  userId,
  searchQuery,
  page,
  pageSize,
}: {
  userId: string;
  searchQuery: string | null;
  page: number;
  pageSize: number;
}): Promise<{
  chats: Array<
    Pick<Chat, 'id' | 'title' | 'createdAt' | 'agentId'> &
    { agentSlug: string | null; lastMessageParts: unknown | null; lastMessageRole: string | null }
  >;
  totalCount: number;
}> {
  try {
    const offset = (page - 1) * pageSize;
    const conditions: SQL[] = [eq(chat.userId, userId)];

    if (searchQuery && searchQuery.trim() !== '') {
      const searchPattern = `%${searchQuery}%`;

      const messageSearchSubquery = db
        .select({ _: sql`1` })
        .from(message)
        .where(
          and(
            eq(message.chatId, chat.id),
            sql`exists (
              select 1
              from json_array_elements(${message.parts}) as p
              where p->>'type' = 'text' and p->>'text' ilike ${searchPattern}
            )`
          )
        )
        .limit(1);

      const searchCondition = or(
        ilike(chat.title, searchPattern),
        exists(messageSearchSubquery)
      );
      if (searchCondition) {
          conditions.push(searchCondition);
      }
    }

    const finalCondition = and(...conditions);

    const countQuery = db
      .select({ value: count() })
      .from(chat)
      .where(finalCondition);

    const lastMessageSubquery = db.$with('last_message').as(
      db.select({
        chatId: message.chatId,
        parts: message.parts,
        role: message.role,
        rn: sql<number>`row_number() over (partition by ${message.chatId} order by ${message.createdAt} desc)`.as('rn'),
      })
      .from(message)
    );

    const dataQuery = db
      .with(lastMessageSubquery)
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        agentId: chat.agentId,
        agentSlug: agent.slug, // Use proper relation
        lastMessageParts: lastMessageSubquery.parts,
        lastMessageRole: lastMessageSubquery.role,
      })
      .from(chat)
      .leftJoin(agent, eq(chat.agentId, agent.id)) // Use proper join
      .leftJoin(
        lastMessageSubquery,
        and(
          eq(chat.id, lastMessageSubquery.chatId),
          eq(lastMessageSubquery.rn, 1)
        )
      )
      .where(finalCondition)
      .orderBy(desc(chat.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [countResult, chatsResult] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    const totalCount = countResult[0]?.value ?? 0;

    return {
      chats: chatsResult,
      totalCount: totalCount,
    };

  } catch (error) {
    console.error('Failed to get paginated chats for user from database', error);
    throw error;
  }
}
