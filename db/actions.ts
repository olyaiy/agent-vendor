'use server';

import { doesAgentHaveSearchTool, saveChat } from './queries';

export async function checkAgentHasSearchTool(agentId: string): Promise<boolean> {
  return doesAgentHaveSearchTool(agentId);
}

export async function createChat({
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
    return await saveChat({ id, userId, title, agentId });
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
} 