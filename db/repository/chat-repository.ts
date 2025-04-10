import { db } from '../index';
import { chat, type Chat, message, type DBMessage } from '../schema/chat';
import { eq, asc, and, inArray, gte, desc } from 'drizzle-orm';

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
}): Promise<Pick<Chat, 'id' | 'title' | 'agentId'>[]> {
  try {
    return await db
      .select({
        id: chat.id,
        title: chat.title,
        agentId: chat.agentId,
      })
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Failed to get recent chats for user from database', error);
    throw error;
  }
}