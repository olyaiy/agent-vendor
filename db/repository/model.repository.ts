
import { eq, asc, count, and } from 'drizzle-orm';
import { agentModels, Model, models } from '../schema/agent';
import { db } from '..';

// Define types for Model operations
export type NewModel = Omit<Model, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateModel = Partial<NewModel>;

/**
 * Selects all models from the database.
 * @returns Array of all model records.
 */
export async function selectAllModels(): Promise<Model[]> {
    return await db.select().from(models).orderBy(asc(models.model));
}

/**
 * Selects a model by its name (case-sensitive due to potential unique index).
 * @param modelName - The name of the model to select.
 * @returns The model record if found, otherwise undefined.
 */
export async function selectModelByName(modelName: string): Promise<Model | undefined> {
    const result = await db
        .select()
        .from(models)
        .where(eq(models.model, modelName)) // Assumes case-sensitive comparison based on DB collation/index
        .limit(1);
    return result[0];
}

/**
 * Inserts a new model into the database.
 * @param newModelData - The data for the new model (model name, description).
 * @returns The newly inserted model record (as an array).
 */
export async function insertModel(newModelData: NewModel): Promise<Model[]> {
    return await db
        .insert(models)
        .values(newModelData)
        .returning();
}

/**
 * Updates an existing model in the database.
 * @param modelId - The ID of the model to update.
 * @param updateData - An object containing the fields to update (model name, description).
 * @returns The updated model record (as an array).
 */
export async function updateModel(modelId: string, updateData: UpdateModel): Promise<Model[]> {
    return await db
        .update(models)
        .set({ ...updateData, updatedAt: new Date() }) // Ensure updatedAt is updated
        .where(eq(models.id, modelId))
        .returning();
}

/**
 * Checks if any agents are currently using the specified model as their *primary* model.
 * @param modelId - The ID of the model to check.
 * @returns True if the model is in use as a primary model, false otherwise.
 */
export async function isModelInUse(modelId: string): Promise<boolean> {
    const result = await db
        .select({ value: count() })
        .from(agentModels)
        .where(
            and(
                eq(agentModels.modelId, modelId),
                eq(agentModels.role, 'primary') // Specifically check for 'primary' role usage
            )
        )
        .limit(1); // Limit 1 is sufficient, we just need to know if count > 0

    return (result[0]?.value ?? 0) > 0;
}

/**
 * Deletes a model from the database *only if* it's not currently used by any agents as a primary model.
 * Throws an error if the model is in use.
 * @param modelId - The ID of the model to delete.
 * @returns A promise that resolves when the deletion is complete.
 * @throws Error if the model is in use by agents as a primary model.
 */
export async function deleteModel(modelId: string): Promise<void> {
    const inUse = await isModelInUse(modelId);
    if (inUse) {
        // Consider creating custom error types for better handling
        throw new Error("Model is currently in use as a primary model by one or more agents and cannot be deleted.");
    }
    // Also consider implications if model could be used in a non-primary role via agentModels
    // If deletion should be blocked regardless of role, adjust isModelInUse accordingly.

    await db.delete(models).where(eq(models.id, modelId));
    // Note: Related agentModels entries should ideally be handled by CASCADE DELETE
    // or explicitly deleted here if necessary. If an agent's primaryModelId still points
    // here (due to denormalization), that agent record might need updating too.
}