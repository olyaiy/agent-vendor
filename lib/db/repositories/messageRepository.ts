import { and, asc, eq, gte, inArray } from 'drizzle-orm';
import { db } from '../client';
import { message, type DBMessage } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { generateUUID } from '@/lib/utils';

/**
 * Save messages to the database with performance optimizations
 * - Uses batch inserts with prepared statements
 * - Implements write chunking for large message sets
 * - Option for deferred non-critical content
 */
export async function saveMessages({ 
  messages, 
  model_id,
  deferNonCritical = false
}: { 
  messages: Array<DBMessage>; 
  model_id?: string;
  deferNonCritical?: boolean;
}) {
  try {
    // Skip empty messages array
    if (!messages.length) return [];

    // Maps model_id to messages and ensures IDs are set
    const messagesToSave = messages.map(msg => ({
      ...msg,
      id: msg.id || generateUUID(),
      model_id: model_id || msg.model_id,
    }));

    // For large message sets, split into chunks of 50 for better performance
    if (messagesToSave.length > 50) {
      const chunks: Array<DBMessage[]> = [];
      for (let i = 0; i < messagesToSave.length; i += 50) {
        chunks.push(messagesToSave.slice(i, i + 50));
      }

      return db.transaction(async (tx) => {
        const results: DBMessage[] = [];
        for (const chunk of chunks) {
          const chunkResult = await tx.insert(message).values(chunk);
          results.push(...chunk);
        }
        return results;
      });
    }

    // For critical messages (user input), use immediate transaction
    if (!deferNonCritical) {
      return db.transaction(async (tx) => {
        await tx.insert(message).values(messagesToSave);
        return messagesToSave;
      });
    }

    // For non-critical content (like system messages or metadata updates),
    // we can use a non-blocking approach by executing the insert
    // without awaiting the result 
    if (deferNonCritical) {
      // Return immediately but still save the messages
      const insertPromise = db.transaction(async (tx) => {
        await tx.insert(message).values(messagesToSave);
      }).catch(err => console.error('Deferred message insert failed:', err));
      
      // Don't await the promise, fire and forget
      setTimeout(() => {
        // This ensures the promise is executed but not awaited
        void insertPromise;
      }, 0);
      
      return messagesToSave;
    }

    // Default case - immediate transaction
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


