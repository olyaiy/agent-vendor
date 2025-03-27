import { and, asc, eq, gte, inArray } from 'drizzle-orm';
import { db } from '../client';
import { message, type DBMessage } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { generateUUID } from '@/lib/utils';

/**
 * Save messages to the database
 */
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

    // Use transaction for batch insert
    return db.transaction(async (tx) => {
      await tx.insert(message).values(messagesToSave);
      return messagesToSave;
    });
  } catch (error) {
    return handleDbError(error, 'Failed to save messages in database', []);
  }
}

/**
 * Get all messages for a specific chat
 */
export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    // Will use the index on message.chatId
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    return handleDbError(error, 'Failed to get messages by chat id from database', []);
  }
}

/**
 * Get a single message by ID
 */
export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    return handleDbError(error, 'Failed to get message by id from database', []);
  }
}

/**
 * Delete messages for a chat after a specific timestamp
 */
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
    
    return { count: 0 };
  } catch (error) {
    return handleDbError(error, 'Failed to delete messages by id after timestamp from database', { count: 0 });
  }
} 


