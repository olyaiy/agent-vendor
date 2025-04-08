'use server'

import { insertAgent } from "@/db/repository/agent-repository";

/**
 * Server action to create a new agent
 * This allows us to safely perform database operations from client components
 */
export async function createAgent(data: {
  name: string;
  description: string | null;
  systemPrompt: string | null;
  thumbnailUrl: string | null;
  visibility: string;
  primaryModelId: string;
  creatorId: string;
  welcomeMessage: string | null;
  avatarUrl: string | null;
}) {
  try {
    // Call the repository function to insert the agent
    const result = await insertAgent(data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to create agent:", error);
    return { success: false, error: (error as Error).message };
  }
} 