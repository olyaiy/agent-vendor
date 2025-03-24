import { eq } from 'drizzle-orm';
import { db } from '../client';
import { models, type Model } from '../schema';
import { handleDbError } from '../utils/errorHandler';

/**
 * Get a model by ID
 */
export async function getModelById(id: string) {
  try {
    const [model] = await db.select().from(models).where(eq(models.id, id));
    return model;
  } catch (error) {
    return handleDbError(error, 'Failed to get model by id from database', null);
  }
}

/**
 * Get all available models
 */
export async function getAllModels() {
  try {
    return await db.select().from(models);
  } catch (error) {
    return handleDbError(error, 'Failed to get all models from database', []);
  }
}

/**
 * Create a new model
 */
export async function createModel(modelData: Omit<typeof models.$inferInsert, 'id'>) {
  try {
    const [model] = await db
      .insert(models)
      .values(modelData)
      .returning();
    
    return model;
  } catch (error) {
    return handleDbError(error, 'Failed to create model in database');
  }
}

/**
 * Update an existing model
 */
export async function updateModel(id: string, modelData: Partial<typeof models.$inferInsert>) {
  try {
    const [updatedModel] = await db
      .update(models)
      .set(modelData)
      .where(eq(models.id, id))
      .returning();
    
    return updatedModel;
  } catch (error) {
    return handleDbError(error, 'Failed to update model in database');
  }
}

/**
 * Delete a model by ID
 */
export async function deleteModel(id: string) {
  try {
    return await db.delete(models).where(eq(models.id, id));
  } catch (error) {
    return handleDbError(error, 'Failed to delete model from database');
  }
} 