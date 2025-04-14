'use server';

import { generateText } from "ai";
import { myProvider } from "@/lib/models";
import { Message } from "ai";
import { auth } from '@/lib/auth';
import { 
  deleteMessageById, 
  deleteMessagesByChatIdAfterTimestamp, 
  getMessageById, 
  getUserRecentChats,
  getChatTitleAndUserId // Import the repository function
} from '../repository/chat-repository';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '../index';
import { message, chat } from '../schema/chat';

export async function generateTitleFromUserMessage({
    message,
  }: {
    message: Message;
  }) {
    const { text: title } = await generateText({
      model: myProvider.languageModel('title-model'),
      system: `
      - you will generate a short title based on the first message a user begins a conversation with
      - ensure it is not more than 80 characters long
      - the title should be a summary of the user's message
      - do not use quotes or colons`,
      prompt: JSON.stringify(message).slice(0, 2000),
    });
  
    const cleanedTitle = title.replace(/"/g, ''); // Remove double quotes
    return cleanedTitle;
  }

export async function deleteMessageAction(messageId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Verify message ownership through chat relation
    const [messageToDelete] = await db
      .select()
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(eq(message.id, messageId))
      .limit(1);

    if (messageToDelete?.Chat?.userId !== session.user.id) {
      throw new Error('Unauthorized to delete this message');
    }

    await deleteMessageById(messageId);
    
    return { 
      success: true, 
      message: 'Message deleted successfully' 
    };
  } catch (error) {
    console.error('Failed to delete message:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete message' 
    };
  }
}

export async function getChatTitleAction(chatId: string): Promise<string | null> {
  try {
    // No need to check session here, as title visibility isn't strictly tied to ownership
    // If stricter access control is needed later, session check can be added.
    const chatInfo = await getChatTitleAndUserId(chatId);
    return chatInfo?.title ?? null; // Return title or null if chat not found
  } catch (error) {
    console.error('Failed to get chat title:', error);
    // Depending on requirements, you might want to throw the error
    // or return null/undefined to indicate failure. Returning null for now.
    return null; 
  }
}

export async function deleteTrailingMessages({ id }: { id: string }) {
    const [message] = await getMessageById({ id });
  
    await deleteMessagesByChatIdAfterTimestamp({
      chatId: message.chatId,
      timestamp: message.createdAt,
    });
  }

export async function getUserRecentChatsAction(limit?: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const recentChats = await getUserRecentChats({
      userId: session.user.id,
      limit: limit,
    });

    return {
      success: true,
      data: recentChats,
    };
  } catch (error) {
    console.error('Failed to get recent chats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get recent chats',
    };
  }
}
