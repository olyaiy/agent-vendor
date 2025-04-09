import { db } from '../index';
import { agent, Agent, models, Model } from '../schema/agent';
import { eq, desc } from 'drizzle-orm';
import { knowledge, Knowledge } from '../schema/agent';

// Define the type for the data needed to insert an agent
// Excludes fields that have default values or are generated (id, createdAt, updatedAt)
type NewAgent = Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for creating new knowledge entries
 * Excludes auto-generated fields (id, createdAt, updatedAt)
 */
type NewKnowledge = Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating existing knowledge entries
 * Allows partial updates of writable fields
 */
type UpdateKnowledge = Partial<NewKnowledge>;

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
 * Selects all models from the database.
 * @returns Array of all model records.
 */
export async function selectAllModels(): Promise<Model[]> {
  return await db.select().from(models);
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

/**
 * Retrieves an agent with its associated model name by ID
 * @param agentId - UUID of the agent to retrieve
 * @returns Combined agent and model data or undefined if not found
 */
export async function selectAgentWithModelById(agentId: string): Promise<(Agent & { modelName: string }) | undefined> {
  const result = await db
    .select({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      thumbnailUrl: agent.thumbnailUrl,
      avatarUrl: agent.avatarUrl,
      systemPrompt: agent.systemPrompt,
      welcomeMessage: agent.welcomeMessage,
      primaryModelId: agent.primaryModelId,
      visibility: agent.visibility,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      creatorId: agent.creatorId,
      modelName: models.model
    })
    .from(agent)
    .innerJoin(models, eq(agent.primaryModelId, models.id))
    .where(eq(agent.id, agentId))
    .limit(1);
    
  return result[0];
}

/**
 * Creates a new knowledge base entry
 * @param newKnowledge - Knowledge data to insert
 * @returns Array containing the created knowledge record
 */
export async function insertKnowledge(newKnowledge: NewKnowledge): Promise<Knowledge[]> {
  return await db
    .insert(knowledge)
    .values(newKnowledge)
    .returning();
}

/**
 * Retrieves a knowledge entry by its ID
 * @param id - UUID of the knowledge entry
 * @returns Knowledge record or undefined if not found
 */
export async function selectKnowledgeById(id: string): Promise<Knowledge | undefined> {
  const result = await db
    .select()
    .from(knowledge)
    .where(eq(knowledge.id, id))
    .limit(1);
  return result[0];
}

/**
 * Updates an existing knowledge entry
 * @param id - UUID of the knowledge entry to update
 * @param updateData - Partial data for updating the knowledge entry
 * @returns Array containing the updated knowledge record
 */
export async function updateKnowledge(id: string, updateData: UpdateKnowledge): Promise<Knowledge[]> {
  return await db
    .update(knowledge)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(knowledge.id, id))
    .returning();
}

/**
 * Deletes a knowledge entry by ID
 * @param id - UUID of the knowledge entry to delete
 */
export async function deleteKnowledge(id: string): Promise<void> {
  await db.delete(knowledge).where(eq(knowledge.id, id));
}

/**
 * Retrieves all knowledge entries associated with an agent
 * @param agentId - UUID of the agent to get knowledge for
 * @returns Array of knowledge records ordered by creation date (newest first)
 */
export async function selectKnowledgeByAgentId(agentId: string): Promise<Knowledge[]> {
  return await db
    .select()
    .from(knowledge)
    .where(eq(knowledge.agentId, agentId))
    .orderBy(desc(knowledge.createdAt));
}
