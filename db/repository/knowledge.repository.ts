
import { eq, desc } from 'drizzle-orm';
import { knowledge, Knowledge } from '../schema/agent';
import { db } from '..';

/**
 * Type for creating new knowledge entries
 * Excludes auto-generated fields (id, createdAt, updatedAt)
 */
export type NewKnowledge = Omit<Knowledge, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Type for updating existing knowledge entries
 * Allows partial updates of writable fields
 */
export type UpdateKnowledge = Partial<NewKnowledge>;


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