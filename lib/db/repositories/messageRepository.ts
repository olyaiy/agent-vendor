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

    console.log("THE MESSAGE WE ARE SAVING LOOKS LIKE THIS:")
    console.dir(messagesToSave, { depth: 3 })

    await db.insert(message).values(messagesToSave);
    
    // Return the messages with their generated IDs
    return messagesToSave;
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




// {
//   "id": "5206d38b-8943-46e8-9465-82d19c410d71",
//   "createdAt": "2025-03-25T00:53:41.835Z",
//   "role": "assistant",
//   "content": "Tesla was removed from the Vancouver International Auto Show due to safety concerns. The decision was made by event organizers after protests and vandalism targeting Tesla vehicles and showrooms increased, posing a risk to attendees and staff. Despite being given multiple opportunities to voluntarily withdraw, Tesla refused, leading the organizers to remove the brand from the event[1][3][4].\n\nThe removal is linked to broader tensions surrounding Tesla CEO Elon Musk's association with U.S. President Donald Trump, which has sparked protests in Canada. Musk's involvement with Trump has been seen as controversial, especially given Trump's policies affecting Canada[2][3].\n\nTesla's absence from the show marks a significant departure from tradition, as the company has historically been a major participant. The event will proceed with over 200 vehicles from other brands like GM, Ford, and Toyota[1][3]. Tesla has not issued an official statement regarding its exclusion or the recent vandalism incidents[2][4].",
//   "parts": [
//       {
//           "type": "source",
//           "source": {
//               "sourceType": "url",
//               "id": "4xM3itOHS4DMky5Q",
//               "url": "https://www.carscoops.com/2025/03/tesla-banned-from-vancouver-auto-show-over-protest-fears/"
//           }
//       },
//       {
//           "type": "source",
//           "source": {
//               "sourceType": "url",
//               "id": "NldF8KFeiuL1VXgl",
//               "url": "https://www.youtube.com/watch?v=Fi0eX2lP8tA"
//           }
//       },
//       {
//           "type": "source",
//           "source": {
//               "sourceType": "url",
//               "id": "BBY2fzCRgzM3vlzb",
//               "url": "https://www.foxbusiness.com/technology/tesla-booted-from-vancouver-international-auto-show-over-safety-attendees"
//           }
//       },
//       {
//           "type": "source",
//           "source": {
//               "sourceType": "url",
//               "id": "YWrLKEPUfHqgoLJL",
//               "url": "https://www.youtube.com/watch?v=TVZOCghuGC8"
//           }
//       },
//       {
//           "type": "source",
//           "source": {
//               "sourceType": "url",
//               "id": "5mbCkIiWfVZphQtK",
//               "url": "https://www.youtube.com/watch?v=M3gYZLKQ3uo"
//           }
//       },
//       {
//           "type": "text",
//           "text": "Tesla was removed from the Vancouver International Auto Show due to safety concerns. The decision was made by event organizers after protests and vandalism targeting Tesla vehicles and showrooms increased, posing a risk to attendees and staff. Despite being given multiple opportunities to voluntarily withdraw, Tesla refused, leading the organizers to remove the brand from the event[1][3][4].\n\nThe removal is linked to broader tensions surrounding Tesla CEO Elon Musk's association with U.S. President Donald Trump, which has sparked protests in Canada. Musk's involvement with Trump has been seen as controversial, especially given Trump's policies affecting Canada[2][3].\n\nTesla's absence from the show marks a significant departure from tradition, as the company has historically been a major participant. The event will proceed with over 200 vehicles from other brands like GM, Ford, and Toyota[1][3]. Tesla has not issued an official statement regarding its exclusion or the recent vandalism incidents[2][4]."
//       }
//   ],
//   "revisionId": "93673b23-9b9c-424d-a320-05d610a12a9f"
// }