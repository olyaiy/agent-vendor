import { db } from '../index';
import { agent, Agent } from '../schema/agent';
import { eq, desc } from 'drizzle-orm';

// Define the type for the data needed to insert an agent
// Excludes fields that have default values or are generated (id, createdAt, updatedAt)
type NewAgent = Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Inserts a new agent into the database.
 * @param newAgentData - The data for the new agent.
 * @returns The newly inserted agent record.
 */
export async function insertAgent(newAgentData: NewAgent): Promise<Agent[]> {
  const insertedAgent = await db
    .insert(agent)
    .values(newAgentData)
    .returning(); // Return all columns of the inserted row
  return insertedAgent;
}

/**
 * Selects an agent by its ID.
 * @param agentId - The ID of the agent to select.
 * @returns The agent record if found, otherwise undefined.
 */
export async function selectAgentById(agentId: string): Promise<Agent | undefined> {
  const result = await db
    .select()
    .from(agent)
    .where(eq(agent.id, agentId))
    .limit(1);
  return result[0];
}

/**
 * Updates an existing agent in the database.
 * @param agentId - The ID of the agent to update.
 * @param updateData - An object containing the fields to update.
 * @returns The updated agent record.
 */
export async function updateAgent(agentId: string, updateData: Partial<NewAgent>): Promise<Agent[]> {
  const updatedAgent = await db
    .update(agent)
    .set({ ...updateData, updatedAt: new Date() }) // Ensure updatedAt is updated
    .where(eq(agent.id, agentId))
    .returning();
  return updatedAgent;
}

/**
 * Deletes an agent from the database.
 * @param agentId - The ID of the agent to delete.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function deleteAgent(agentId: string): Promise<void> {
  await db.delete(agent).where(eq(agent.id, agentId));
}

/**
 * Selects the most recent 20 agents from the database
 * @returns Array of agent records ordered by creation date
 */
export async function selectRecentAgents(): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  avatarUrl: string | null;
  creatorId: string;
}>> {
  return await db
    .select({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      thumbnailUrl: agent.thumbnailUrl,
      avatarUrl: agent.avatarUrl,
      creatorId: agent.creatorId
    })
    .from(agent)
    .orderBy(desc(agent.createdAt))
    .limit(20);
}
