'use server';

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

import {
  insertTool,
  selectToolById,
  selectToolsByCreatorId,
  updateTool as updateToolRepo,
  deleteTool as deleteToolRepo,
} from "@/db/repository/tool.repository"; // Adjusted import path

import { Tool, NewTool } from "@/db/schema/tool"; // Adjusted import path
import { ActionResult } from "./types";

// Zod schema for creating a tool (can be expanded)
const CreateToolSchema = z.object({
  name: z.string().min(1, "Tool name is required."),
  displayName: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['basetool', 'sequence', 'api']),
  definition: z.any().optional(), // Or more specific Zod schema if known
  inputSchema: z.any().optional(), // Or more specific Zod schema if known
  // creatorId will be set from session
});

export async function createToolAction(
  data: Omit<NewTool, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>
): Promise<ActionResult<Tool>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "User not authenticated." };
    }
    const creatorId = session.user.id;

    const validationResult = CreateToolSchema.safeParse(data);
    if (!validationResult.success) {
      return { success: false, error: validationResult.error.errors.map(e => e.message).join(", ") };
    }

    const newToolData: NewTool = {
      ...validationResult.data,
      creatorId,
      // Drizzle will handle id, createdAt, updatedAt defaults
    };

    const result = await insertTool(newToolData);
    if (result.length === 0) {
        return { success: false, error: "Failed to create tool." };
    }

    revalidatePath('/tools'); // Example path, adjust as needed
    revalidatePath(`/profile/tools`); // Example path for user's tools
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to create tool:", error);
    if (error instanceof Error && error.message.includes('unique constraint') && data.name) {
        return { success: false, error: `Tool name "${data.name}" is already taken.` };
    }
    return { success: false, error: (error as Error).message };
  }
}

export async function getToolByIdAction(toolId: string): Promise<ActionResult<Tool>> {
  try {
    // Public tools might not need auth, or could have different logic
    // For now, let's assume fetching a tool by ID is a general operation
    const tool = await selectToolById(toolId);
    if (!tool) {
      return { success: false, error: "Tool not found." };
    }
    return { success: true, data: tool };
  } catch (error) {
    console.error("Failed to fetch tool by ID:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getToolsByCreatorIdAction(): Promise<ActionResult<Tool[]>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "User not authenticated." };
    }
    const userId = session.user.id;
    const tools = await selectToolsByCreatorId(userId);
    return { success: true, data: tools };
  } catch (error) {
    console.error("Failed to fetch user's tools:", error);
    return { success: false, error: (error as Error).message };
  }
}

// Zod schema for updating a tool
const UpdateToolSchema = CreateToolSchema.partial().extend({
  // You might want to disallow changing certain fields like 'type' or 'creatorId' after creation
});


export async function updateToolAction(
  toolId: string,
  data: Partial<Omit<NewTool, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>>
): Promise<ActionResult<Tool>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "User not authenticated." };
    }

    const toolToUpdate = await selectToolById(toolId);
    if (!toolToUpdate) {
      return { success: false, error: "Tool not found." };
    }
    if (toolToUpdate.creatorId !== session.user.id) {
      return { success: false, error: "Unauthorized. You can only update your own tools." };
    }

    const validationResult = UpdateToolSchema.safeParse(data);
    if (!validationResult.success) {
        return { success: false, error: validationResult.error.errors.map(e => e.message).join(", ") };
    }

    const result = await updateToolRepo(toolId, validationResult.data);
    if (result.length === 0) {
      return { success: false, error: "Tool not found or update failed." };
    }

    revalidatePath('/tools'); // Example path
    revalidatePath(`/tools/${toolId}`); // Example path
    revalidatePath(`/profile/tools`);
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("Failed to update tool:", error);
    if (error instanceof Error && error.message.includes('unique constraint') && data.name) {
        return { success: false, error: `Tool name "${data.name}" is already taken.` };
    }
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteToolAction(toolId: string): Promise<ActionResult<void>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, error: "User not authenticated." };
    }

    const toolToDelete = await selectToolById(toolId);
    if (!toolToDelete) {
      return { success: false, error: "Tool not found." };
    }
    if (toolToDelete.creatorId !== session.user.id) {
      return { success: false, error: "Unauthorized. You can only delete your own tools." };
    }

    await deleteToolRepo(toolId);

    revalidatePath('/tools');
    revalidatePath(`/profile/tools`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete tool:", error);
    // Consider if there are related entities that might prevent deletion (e.g., if in use by agents)
    // The current schema uses "onDelete: cascade" for agent_tools, so that should be handled by DB.
    return { success: false, error: (error as Error).message };
  }
}