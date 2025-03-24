'use server';

import { revalidatePath } from 'next/cache';
import { createAgent as createAgentQuery, deleteAgentQuery, getAgentById, updateAgentById, createTag, db } from '@/lib/db/queries';
import { agentModels, agentToolGroups, agents, models, agentTags, tags, suggestedPrompts, knowledge_items } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { auth } from '../(auth)/auth';

export async function createAgent({
  agentDisplayName,
  systemPrompt,
  description,
  modelId,
  visibility,
  creatorId,
  artifactsEnabled = true,
  thumbnailUrl,
  alternateModelIds = [],
  toolGroupIds = [],
  tagIds = [],
  customization
}: {
  agentDisplayName: string;
  systemPrompt: string;
  description?: string;
  modelId: string;
  visibility: "public" | "private" | "link";
  creatorId: string;
  artifactsEnabled?: boolean;
  thumbnailUrl?: string | null;
  alternateModelIds?: string[];
  toolGroupIds?: string[];
  tagIds?: string[];
  customization?: {
    overview: {
      title: string;
      content: string;
      showPoints: boolean;
      points: string[];
    };
    style: {
      colorSchemeId: string;
    };
  };
}) {
  try {
    // Process any new tags (those with IDs starting with "new-")
    const processedTagIds = await processNewTags(tagIds);
    
    // Create agent with primary model
    const result = await createAgentQuery({
      agentDisplayName,
      systemPrompt,
      description,
      modelId,
      visibility,
      creatorId,
      artifactsEnabled,
      thumbnailUrl,
      customization,
      tagIds: processedTagIds
    });

    // If alternate models were provided, add them to the agent
    if (alternateModelIds.length > 0 && result?.id) {
      const alternateModelsData = alternateModelIds.map(alternateModelId => ({
        agentId: result.id,
        modelId: alternateModelId,
        isDefault: false
      }));
      
      await db.insert(agentModels).values(alternateModelsData);
    }

    // If tool groups were provided, add them to the agent
    if (toolGroupIds.length > 0 && result?.id) {
      const toolGroupsData = toolGroupIds.map(toolGroupId => ({
        agentId: result.id,
        toolGroupId
      }));
      
      await db.insert(agentToolGroups).values(toolGroupsData);
    }
    
    revalidatePath('/');
    return result; // Return the created agent
  } catch (error) {
    console.error('Failed to create agent:', error);
    throw error; // Return the error for better error handling
  }
}

export async function updateAgent({
  id,
  agentDisplayName,
  systemPrompt,
  description,
  modelId,
  visibility,
  artifactsEnabled,
  thumbnailUrl,
  alternateModelIds = [],
  toolGroupIds = [],
  tagIds = [],
  customization
}: {
  id: string;
  agentDisplayName: string;
  systemPrompt: string;
  description?: string;
  modelId: string;
  visibility: "public" | "private" | "link";
  artifactsEnabled?: boolean;
  thumbnailUrl?: string | null;
  alternateModelIds?: string[];
  toolGroupIds?: string[];
  tagIds?: string[];
  customization?: {
    overview: {
      title: string;
      content: string;
      showPoints: boolean;
      points: string[];
    };
    style: {
      colorSchemeId: string;
    };
  };
}) {
  try {
    // Process any new tags (those with IDs starting with "new-")
    const processedTagIds = await processNewTags(tagIds);
    
    // Update the agent
    const result = await updateAgentById({
      id,
      agentDisplayName,
      systemPrompt,
      description,
      modelId,
      visibility,
      artifactsEnabled,
      thumbnailUrl,
      customization,
      tagIds: processedTagIds
    });
    
    // Update alternate models - first delete all existing non-default models
    await db.delete(agentModels).where(
      and(
        eq(agentModels.agentId, id),
        eq(agentModels.isDefault, false)
      )
    );
    
    // Then add the new alternate models
    if (alternateModelIds.length > 0) {
      const alternateModelsData = alternateModelIds.map(alternateModelId => ({
        agentId: id,
        modelId: alternateModelId,
        isDefault: false
      }));
      
      await db.insert(agentModels).values(alternateModelsData);
    }
    
    // Update tool groups - first delete all existing tool groups
    await db.delete(agentToolGroups).where(eq(agentToolGroups.agentId, id));
    
    // Then add the new tool groups
    if (toolGroupIds.length > 0) {
      const toolGroupsData = toolGroupIds.map(toolGroupId => ({
        agentId: id,
        toolGroupId
      }));
      
      await db.insert(agentToolGroups).values(toolGroupsData);
    }
    
    revalidatePath('/agents');
    revalidatePath(`/agents/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update agent:', error);
    throw new Error('Failed to update agent');
  }
}

export async function deleteAgent(id: string) {
  try {
    await deleteAgentQuery(id);
    revalidatePath('/');
  } catch (error) {
    console.error('Failed to delete agent:', error);
    throw new Error('Failed to delete agent');
  }
}

export async function deleteAgentImage(id: string, imageUrl: string) {
  try {
    
    // Extract the key (filename) from the imageUrl
    // Handle different URL formats more robustly
    let key;
    try {
      // Try to parse as a URL first
      const url = new URL(imageUrl);
      // Get the pathname without leading slash
      const pathname = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      
      // If the path has multiple segments, we need the last part
      const pathParts = pathname.split('/');
      key = pathParts[pathParts.length - 1];
      
    } catch (parseError) {
      // If URL parsing fails, fall back to string manipulation
      key = imageUrl.includes('?') 
        ? imageUrl.substring(imageUrl.lastIndexOf('/') + 1, imageUrl.indexOf('?')) 
        : imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
      
    }
    
    if (!key) {
      throw new Error('Failed to extract valid key from image URL');
    }
    
    // Skip the API route and directly delete from R2
    // This approach avoids authentication issues since we're already in a server action
    
    // Initialize the S3 client with Cloudflare R2 credentials
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      },
    });
    
    
    // Create and send the delete command
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
      Key: key,
    });
    
    await s3Client.send(deleteCommand);
    
    // Get agent details
    const agent = await getAgentById(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    // Get agent's default model
    const models = await db.select({
      modelId: agentModels.modelId,
      isDefault: agentModels.isDefault
    })
    .from(agentModels)
    .where(eq(agentModels.agentId, id));
    
    const defaultModelId = models.find((m: { modelId: string, isDefault: boolean | null }) => m.isDefault === true)?.modelId || '';
    
    // Update the agent record to remove the image reference
    await updateAgentById({
      id,
      agentDisplayName: agent.agent_display_name || '',
      systemPrompt: agent.system_prompt || '',
      description: agent.description || undefined,
      modelId: defaultModelId,
      visibility: agent.visibility || 'public',
      artifactsEnabled: agent.artifacts_enabled || true,
      thumbnailUrl: null,
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete agent image:', error);
    throw new Error('Failed to delete agent image');
  }
}

// Helper function to process new tags and return processed tag IDs
async function processNewTags(tagIds: string[] = []) {
  if (!tagIds.length) return [];
  
  const processedTagIds = [];
  
  for (const tagId of tagIds) {
    // If it's a new tag (created in the UI), create it in the database
    if (tagId.startsWith('new-')) {
      // Extract the tag name from the temporary ID
      // Format is "new-timestamp-tagName" or similar
      const tagName = tagId.substring(tagId.indexOf('-') + 1);
      
      try {
        // Create the new tag
        const newTag = await createTag(tagName);
        if (newTag) {
          processedTagIds.push(newTag.id);
        }
      } catch (error) {
        console.error(`Failed to create tag "${tagName}":`, error);
        // Continue processing other tags
      }
    } else {
      // It's an existing tag, just add it to the processed list
      processedTagIds.push(tagId);
    }
  }
  
  return processedTagIds;
}

export async function getSuggestedPromptsByAgentId(agentId: string): Promise<string[]> {
  try {
    const result = await db.select({
      prompts: suggestedPrompts.prompts
    })
    .from(suggestedPrompts)
    .where(eq(suggestedPrompts.agentId, agentId));

    // If no prompts found, return default array
    if (!result.length) {
      return [
        "What can you help me with?",
        "Tell me about yourself", 
        "What features do you have?",
        "How do I get started?"
      ];
    }

    return result[0].prompts as string[];
  } catch (error) {
    console.error('Failed to get suggested prompts for agent:', error);
    // Return default prompts on error
    return [
      "What can you help me with?",
      "Tell me about yourself", 
      "What features do you have?",
      "How do I get started?"
    ];
  }
}

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
    console.error('Failed to upsert suggested prompts:', error);
    throw error;
  }
}

// Knowledge Item Actions
export async function createKnowledgeItem(data: {
  title: string;
  content: any;
  type?: string;
  description?: string;
  agentId: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    // Ensure the agent belongs to the current user
    const [agent] = await db.select()
      .from(agents)
      .where(eq(agents.id, data.agentId));

    if (!agent || agent.creatorId !== session.user.id) {
      throw new Error("Unauthorized to add knowledge to this agent");
    }

    const [newItem] = await db.insert(knowledge_items).values({
      title: data.title,
      content: data.content,
      type: data.type || 'text',
      description: data.description,
      agentId: data.agentId,
      updatedAt: new Date()
    }).returning();

    return newItem;
  } catch (error) {
    console.error("[CREATE_KNOWLEDGE_ITEM]", error);
    throw error;
  }
}

export async function updateKnowledgeItem(data: {
  id: string;
  title?: string;
  content?: any;
  type?: string;
  description?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    // First fetch the knowledge item to check ownership
    const [item] = await db.select({
      id: knowledge_items.id,
      agentId: knowledge_items.agentId
    })
    .from(knowledge_items)
    .where(eq(knowledge_items.id, data.id));

    if (!item || !item.agentId) {
      throw new Error("Knowledge item not found");
    }

    // Get the agent to verify ownership
    const [agent] = await db.select({
      creatorId: agents.creatorId
    })
    .from(agents)
    .where(eq(agents.id, item.agentId));

    // Verify ownership through the agent
    if (!agent || agent.creatorId !== session.user.id) {
      throw new Error("Unauthorized to update this knowledge item");
    }

    const updateValues: Partial<typeof knowledge_items.$inferInsert> = {
      updatedAt: new Date()
    };
    
    if (data.title !== undefined) updateValues.title = data.title;
    if (data.content !== undefined) updateValues.content = data.content;
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.description !== undefined) updateValues.description = data.description;
    
    const [updatedItem] = await db
      .update(knowledge_items)
      .set(updateValues)
      .where(eq(knowledge_items.id, data.id))
      .returning();
      
    return updatedItem;
  } catch (error) {
    console.error("[UPDATE_KNOWLEDGE_ITEM]", error);
    throw error;
  }
}

export async function deleteKnowledgeItem(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    // First fetch the knowledge item to check ownership
    const [item] = await db.select({
      id: knowledge_items.id,
      agentId: knowledge_items.agentId
    })
    .from(knowledge_items)
    .where(eq(knowledge_items.id, id));

    if (!item || !item.agentId) {
      throw new Error("Knowledge item not found");
    }

    // Get the agent to verify ownership
    const [agent] = await db.select({
      creatorId: agents.creatorId
    })
    .from(agents)
    .where(eq(agents.id, item.agentId));

    // Verify ownership through the agent
    if (!agent || agent.creatorId !== session.user.id) {
      throw new Error("Unauthorized to delete this knowledge item");
    }

    await db
      .delete(knowledge_items)
      .where(eq(knowledge_items.id, id));
      
    return { success: true };
  } catch (error) {
    console.error("[DELETE_KNOWLEDGE_ITEM]", error);
    throw error;
  }
}
