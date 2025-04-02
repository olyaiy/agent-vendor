'use server';

import { getAllUsersWithCredits, getUserByIdWithCredits } from '@/lib/db/repositories/userRepository';
import { getChatsByUserId } from '@/lib/db/repositories/chatRepository';
import { getUserTransactions } from '@/lib/db/repositories/transactionRepository';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { chat, message } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Server action to fetch all users with their credit details.
 */
export async function getAllUsersAction() {
  try {
    const users = await getAllUsersWithCredits();
    // Optionally revalidate the path if data might change frequently,
    // but likely not needed for just fetching.
    // revalidatePath('/admin');
    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users.' };
  }
}

/**
 * Get chat and agent info for an array of message IDs
 */
async function getMessageChatInfo(messageIds: string[]) {
  if (!messageIds.length) return {};
  
  try {
    // Get chat IDs for these messages in a single query
    const messageData = await db
      .select({
        id: message.id,
        chatId: message.chatId
      })
      .from(message)
      .where(inArray(message.id, messageIds));
    
    // Extract unique chat IDs
    const chatIds = [...new Set(messageData.map(m => m.chatId))];
    
    if (!chatIds.length) return {};
    
    // Get agent IDs for these chats in a single query
    const chatData = await db
      .select({
        id: chat.id,
        agentId: chat.agentId,
      })
      .from(chat)
      .where(inArray(chat.id, chatIds));
    
    // Create lookup maps for quick access
    const chatMap = new Map(chatData.map(c => [c.id, c]));
    
    // Build the result mapping message ID → {chatId, agentId}
    const result: Record<string, { chatId: string; agentId: string | null }> = {};
    
    messageData.forEach(msg => {
      const chatInfo = chatMap.get(msg.chatId);
      if (chatInfo) {
        result[msg.id] = {
          chatId: msg.chatId,
          agentId: chatInfo.agentId
        };
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching message chat info:', error);
    return {};
  }
}

/**
 * Server action to fetch detailed information for a specific user.
 */
export async function getUserDetailsAction(userId: string) {
  try {
    const userDetails = await getUserByIdWithCredits(userId);
    if (!userDetails) {
      return { success: false, error: 'User not found.' };
    }

    const chats = await getChatsByUserId({ id: userId });
    const transactionsResult = await getUserTransactions(userId); // Use default pagination for now
    
    // Extract message IDs that need chat/agent lookup
    const messageIds = transactionsResult.transactions
      .filter(tx => tx.messageId)
      .map(tx => tx.messageId as string);
    
    // Get chat and agent info for these messages
    const messageChatInfo = await getMessageChatInfo(messageIds);
    
    // Enhance transaction data with chat and agent info
    const enhancedTransactions = transactionsResult.transactions.map(tx => {
      if (tx.messageId && messageChatInfo[tx.messageId]) {
        return {
          ...tx,
          chatInfo: messageChatInfo[tx.messageId]
        };
      }
      return tx;
    });

    return {
      success: true,
      data: {
        user: userDetails,
        chats,
        transactions: enhancedTransactions,
        transactionCount: transactionsResult.totalCount,
      },
    };
  } catch (error) {
    console.error(`Error fetching details for user ${userId}:`, error);
    return { success: false, error: 'Failed to fetch user details.' };
  }
}
