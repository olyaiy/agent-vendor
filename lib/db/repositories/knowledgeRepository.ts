import { desc, eq } from 'drizzle-orm';
import { db } from '../client';
import { knowledge_items, suggestedPrompts } from '../schema';
import { handleDbError } from '../utils/errorHandler';

// Add isValidUUID helper function
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get all knowledge items for an agent
 */
export async function getKnowledgeItems({ agentId }: { agentId: string }) {
  try {
    return await db
      .select()
      .from(knowledge_items)
      .where(eq(knowledge_items.agentId, agentId))
      .orderBy(desc(knowledge_items.createdAt));
  } catch (error) {
    return handleDbError(error, 'Failed to get knowledge items from database', []);
  }
}

/**
 * Create a new knowledge item
 */
export async function createKnowledgeItem({
  title,
  content,
  type,
  description,
  agentId
}: {
  title: string;
  content: any;
  type?: string;
  description?: string;
  agentId: string;
}) {
  try {
    const [item] = await db
      .insert(knowledge_items)
      .values({
        title,
        content,
        type: type || 'text',
        description,
        agentId,
        updatedAt: new Date()
      })
      .returning();
    
    return item;
  } catch (error) {
    return handleDbError(error, 'Failed to create knowledge item in database');
  }
}

/**
 * Update an existing knowledge item
 */
export async function updateKnowledgeItem({
  id,
  title,
  content,
  type,
  description
}: {
  id: string;
  title?: string;
  content?: any;
  type?: string;
  description?: string;
}) {
  try {
    const updateValues: Partial<typeof knowledge_items.$inferInsert> = {
      updatedAt: new Date()
    };
    
    if (title !== undefined) updateValues.title = title;
    if (content !== undefined) updateValues.content = content;
    if (type !== undefined) updateValues.type = type;
    if (description !== undefined) updateValues.description = description;
    
    const [updatedItem] = await db
      .update(knowledge_items)
      .set(updateValues)
      .where(eq(knowledge_items.id, id))
      .returning();
      
    return updatedItem;
  } catch (error) {
    return handleDbError(error, 'Failed to update knowledge item in database');
  }
}

/**
 * Delete a knowledge item
 */
export async function deleteKnowledgeItem({ id }: { id: string }) {
  try {
    await db
      .delete(knowledge_items)
      .where(eq(knowledge_items.id, id));
      
    return { success: true };
  } catch (error) {
    return handleDbError(error, 'Failed to delete knowledge item from database');
  }
}

/**
 * Get suggested prompts for an agent
 */
export async function getSuggestedPromptsByAgentId(agentId: string): Promise<string[]> {
  try {
    // Validate that agentId is a valid UUID before querying the database
    if (!isValidUUID(agentId)) {
      console.warn(`Invalid UUID format for agentId: ${agentId}`);
      return [
        "What are the advantages of using Next.js?",
        "Help me write an essay about silicon valley",
        "Write code to demonstrate djikstras algorithm",
        "What is the weather in San Francisco?"
      ];
    }

    const [result] = await db
      .select({
        prompts: suggestedPrompts.prompts
      })
      .from(suggestedPrompts)
      .where(eq(suggestedPrompts.agentId, agentId));

    // If no prompts found, return default array
    if (!result) {
      return [
        "What are the advantages of using Next.js?",
        "Help me write an essay about silicon valley",
        "Write code to demonstrate djikstras algorithm",
        "What is the weather in San Francisco?"
      ];
    }

    return result.prompts as string[];
  } catch (error) {
    console.log('THE ERROR IS COMING FROM LIB/DB/REPOSITORIES/KNOWLEDGE.TS')
    return handleDbError(error, 'Failed to get suggested prompts for agent', [
      
      "What are the advantages of using Next.js?",
      "Help me write an essay about silicon valley",
      "Write code to demonstrate djikstras algorithm",
      "What is the weather in San Francisco?"
    ]);
  }
}

/**
 * Update or insert suggested prompts for an agent
 */
export async function upsertSuggestedPrompts(agentId: string, prompts: string[]): Promise<void> {
  try {
    // First try to update existing record
    const updateResult = await db
      .update(suggestedPrompts)
      .set({ prompts })
      .where(eq(suggestedPrompts.agentId, agentId))
      .returning();

    // If no record was updated (updateResult is empty), insert a new one
    if (!updateResult.length) {
      await db
        .insert(suggestedPrompts)
        .values({
          agentId,
          prompts
        });
    }
  } catch (error) {
    handleDbError(error, 'Failed to upsert suggested prompts');
  }
} 