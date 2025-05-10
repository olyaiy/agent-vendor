import { eq } from 'drizzle-orm';
import { db } from '..';
import { tools, type Tool, type NewTool } from '../schema/tool';

export type { NewTool };

export async function insertTool(newToolData: NewTool): Promise<Tool[]> {
  return db.insert(tools).values(newToolData).returning();
}

export async function selectToolById(
  toolId: string,
): Promise<Tool | undefined> {
  const result = await db.select().from(tools).where(eq(tools.id, toolId));
  return result[0];
}

export async function selectToolsByCreatorId(
  creatorId: string,
): Promise<Tool[]> {
  return db.select().from(tools).where(eq(tools.creatorId, creatorId));
}

export async function updateTool(
  toolId: string,
  updateData: Partial<NewTool>,
): Promise<Tool[]> {
  return db.update(tools).set(updateData).where(eq(tools.id, toolId)).returning();
}

export async function deleteTool(toolId: string): Promise<void> {
  await db.delete(tools).where(eq(tools.id, toolId));
}