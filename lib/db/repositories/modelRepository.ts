import { eq } from 'drizzle-orm';
import { db } from '../client';
import { models, type Model } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { redis } from '@/lib/ratelimit';

// Cache key prefixes
const MODEL_KEY_PREFIX = 'model:';

// Cache expiration time in seconds (30 minutes)
const CACHE_EXPIRATION = 1800;

/**
 * Get a model by ID with Redis caching
 */
export async function getModelById(id: string) {
  try {
    // Try to get from cache first
    const cacheKey = `${MODEL_KEY_PREFIX}${id}`;
    const cachedModel = await redis.get<string>(cacheKey);
    
    if (cachedModel) {
      // Handle case where Redis client might have already parsed the JSON
      if (typeof cachedModel === 'object') {
        return cachedModel;
      }
      
      try {
        return JSON.parse(cachedModel);
      } catch (e) {
        console.error('Failed to parse cached model:', e);
        // Continue to fetch from database if parsing fails
      }
    }
    
    // If not in cache, get from database
    const [model] = await db.select().from(models).where(eq(models.id, id));
    
    // Cache the result if model exists
    if (model) {
      await redis.set(cacheKey, JSON.stringify(model), { ex: CACHE_EXPIRATION });
    }
    
    return model;
  } catch (error) {
    return handleDbError(error, 'Failed to get model by id from database', null);
  }
}

/**
 * Invalidate model cache
 * @param id Model ID
 */
export async function invalidateModelCache(id: string): Promise<void> {
  await redis.del(`${MODEL_KEY_PREFIX}${id}`);
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
    
    // Invalidate cache when model is updated
    await invalidateModelCache(id);
    
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
    // Invalidate cache when model is deleted
    await invalidateModelCache(id);
    
    return await db.delete(models).where(eq(models.id, id));
  } catch (error) {
    return handleDbError(error, 'Failed to delete model from database');
  }
} 