/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please use imports from the new modular structure directly.
 * 
 * Example:
 * import { getUser } from '@/lib/db/repositories/userRepository';
 * 
 * Or for multiple imports:
 * import { db } from '@/lib/db/client';
 */

// Re-export everything from the new modular structure
export * from './index';

// This file will be gradually phased out as code is migrated to use the new structure directly

import { getAgentById } from './repositories/agentRepository';
import { getUserByIdWithCredits } from './repositories/userRepository';
import { getGroupChatsByUserId } from './repositories/chatRepository';

// Group chat functions
export async function getGroupChats(userId: string | undefined) {
  if (!userId) {
    return [];
  }
  
  return getGroupChatsByUserId({ id: userId });
}