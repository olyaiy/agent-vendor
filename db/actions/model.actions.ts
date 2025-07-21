'use server';

import { z } from "zod";
import { revalidatePath } from "next/cache";
// Import auth/headers if needed for authorization (e.g., only admins can manage models)
// import { auth } from "@/lib/auth";
// import { headers } from "next/headers";

// Import repository functions
import {
  insertModel,
  selectAllModels,
  updateModel as updateModelRepo,
  deleteModel as deleteModelRepo,
  selectModelByName,
} from "@/db/repository"; // Adjust path

import { Model } from "@/db/schema/agent"; // Import schema type
import { ActionResult } from "./types"; // Import shared type
import { localModelIds } from "@/lib/models";

// Zod Schemas
const NewModelSchema = z.object({
  model: z.string().min(1, "Model name cannot be empty.").max(100, "Model name too long"),
  description: z.string().max(500, "Description too long").nullable().optional(),
});

const UpdateModelSchema = z.object({
  model: z.string().min(1, "Model name cannot be empty.").max(100, "Model name too long").optional(),
  description: z.string().max(500, "Description too long").nullable().optional(),
});

/**
 * Server action to fetch all available models.
 * @returns Promise with success status and model list or error.
 */
export async function getAllModelsAction(): Promise<ActionResult<Model[]>> {
    try {
        const modelList = await selectAllModels();
        return { success: true, data: modelList };
    } catch (error) {
        console.error("Failed to fetch models:", error);
        return { success: false, error: (error as Error).message };
    }
}


/**
 * Server action to create a new model.
 * (Add authorization if needed)
 * @param data - Object containing the model name and optional description.
 * @returns Promise with success status and created model data or error.
 */
export async function createModelAction(data: z.infer<typeof NewModelSchema>): Promise<ActionResult<Model>> {
    // TODO: Add authorization check (e.g., isAdmin)
    const validation = NewModelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid input data", details: validation.error.issues };
    }

    try {
        const existing = await selectModelByName(validation.data.model);
        if (existing) {
            return { success: false, error: `Model "${validation.data.model}" already exists.` };
        }

        const result = await insertModel({
            model: validation.data.model,
            description: validation.data.description ?? null // Ensure null if undefined
        });
        revalidatePath('/admin'); // Assuming models managed in admin area
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Failed to create model:", error);
        if (error instanceof Error && error.message.includes('unique constraint')) {
             return { success: false, error: `Model "${data.model}" already exists.` };
        }
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to update an existing model.
 * (Add authorization if needed)
 * @param modelId - The ID of the model to update.
 * @param data - Object containing the fields to update (model name, description).
 * @returns Promise with success status and updated model data or error.
 */
export async function updateModelAction(modelId: string, data: z.infer<typeof UpdateModelSchema>): Promise<ActionResult<Model>> {
     // TODO: Add authorization check
    if (!modelId) return { success: false, error: "Model ID is required." };

    const validation = UpdateModelSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Invalid input data", details: validation.error.issues };
    }
    if (Object.keys(validation.data).length === 0) {
        return { success: false, error: "No fields provided for update." };
    }

    try {
        if (validation.data.model) {
            const existing = await selectModelByName(validation.data.model);
            if (existing && existing.id !== modelId) {
                return { success: false, error: `Another model with the name "${validation.data.model}" already exists.` };
            }
        }

        const result = await updateModelRepo(modelId, {
            model: validation.data.model,
            // Handle explicit null/undefined for description update
            description: data.description === undefined ? undefined : (data.description ?? null)
        });
        if (result.length === 0) {
            return { success: false, error: "Model not found or update failed" };
        }
        revalidatePath('/admin');
        return { success: true, data: result[0] };
    } catch (error) {
        console.error("Failed to update model:", error);
         if (error instanceof Error && error.message.includes('unique constraint')) {
             return { success: false, error: `Another model with the name "${data.model}" already exists.` };
        }
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Server action to delete a model.
 * (Add authorization if needed)
 * @param modelId - The ID of the model to delete.
 * @returns Promise with success status or error.
 */
export async function deleteModelAction(modelId: string): Promise<ActionResult<void>> {
    // TODO: Add authorization check
    if (!modelId) return { success: false, error: "Model ID is required." };

    try {
        await deleteModelRepo(modelId); // Repository now handles the "in use" check
        revalidatePath('/admin');
        return { success: true, data: undefined };
    } catch (error) {
        console.error("Failed to delete model:", error);
        // Pass specific "in use" error from repo to client
        if (error instanceof Error && error.message.includes("Model is currently in use")) {
            return { success: false, error: error.message };
        }
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Compares model names defined locally with those stored in the database.
 * Returns arrays of missing models in each location.
 */
export async function compareModelListsAction(): Promise<ActionResult<{ missingInDb: string[]; missingLocally: string[] }>> {
    try {
        const dbModels = await selectAllModels();
        const dbModelNames = dbModels.map(m => m.model);

        const missingInDb = localModelIds.filter(id => !dbModelNames.includes(id)).sort();
        const missingLocally = dbModelNames.filter(name => !localModelIds.includes(name)).sort();

        return { success: true, data: { missingInDb, missingLocally } };
    } catch (error) {
        console.error('Failed to compare model lists:', error);
        return { success: false, error: (error as Error).message };
    }
}