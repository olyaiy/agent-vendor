import { db } from '../index';
import { chat, type Chat, message, type DBMessage } from '../schema/chat';
import { eq } from 'drizzle-orm';

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

type NewChat = Pick<Chat, 'id' | 'userId' | 'title'>;

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
      visibility: 'private' // Default visibility as per schema
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
