import { and, eq, or } from "drizzle-orm";
import { db } from "..";
import { AgentModel, AgentTag, Knowledge, Tag, agent, agentModels, agentTags, knowledge, tags } from "../schema/agent";


// --------------------- AGENT - TAG RELATIONS ---------------------    


/**
 * Adds a tag to an agent by creating an entry in the agent_tags join table.
 * @param agentId - The ID of the agent.
 * @param tagId - The ID of the tag.
 * @returns The newly created agent_tags record.
 */
export async function addTagToAgent(agentId: string, tagId: string): Promise<AgentTag[]> {
    return await db
        .insert(agentTags)
        .values({ agentId, tagId, assignedAt: new Date() }) // assignedAt has default, but setting explicitly is fine
        .returning();
}

/**
 * Removes a tag from an agent by deleting the entry from the agent_tags join table.
 * @param agentId - The ID of the agent.
 * @param tagId - The ID of the tag.
 * @returns A promise that resolves when the deletion is complete.
 */
export async function removeTagFromAgent(agentId: string, tagId: string): Promise<void> {
    await db
        .delete(agentTags)
        .where(and( // Corrected and_ to and
            eq(agentTags.agentId, agentId),
            eq(agentTags.tagId, tagId)
        ));
}

/**
 * Retrieves all tags associated with a specific agent, identified by slug.
 * @param agentSlug - The unique slug of the agent.
 * @returns A promise that resolves to an array of Tag objects.
 */
export async function selectAgentTagsBySlug(agentSlug: string): Promise<Tag[]> {
    return await db
        .select({
            id: tags.id,
            name: tags.name,
            createdAt: tags.createdAt,
            updatedAt: tags.updatedAt,
        }) // Select columns from the tags table
        .from(tags)
        .innerJoin(agentTags, eq(tags.id, agentTags.tagId)) // Join tags with agentTags
        .innerJoin(agent, eq(agentTags.agentId, agent.id)) // Join agentTags with agent
        .where(eq(agent.slug, agentSlug)); // Filter by agent slug
}


// --------------------- AGENT - MODEL RELATIONS ---------------------    

/**
 * Updates the primary model for an agent.
 * This function handles the uniqueness constraint by first removing any existing primary model
 * relationships before setting the new one.
 * 
 * @param agentId - The ID of the agent.
 * @param modelId - The ID of the model to set as primary.
 * @returns The updated agent-model relationship.
 */
export async function updateAgentPrimaryModel(agentId: string, modelId: string): Promise<AgentModel[]> {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
        // First, update any existing primary model to secondary or remove it
        await tx
            .update(agentModels)
            .set({ role: "secondary" })
            .where(and(
                eq(agentModels.agentId, agentId),
                eq(agentModels.role, "primary")
            ));
            
        // Check if the new model is already associated with the agent
        const existingRelationship = await tx
            .select()
            .from(agentModels)
            .where(and(
                eq(agentModels.agentId, agentId),
                eq(agentModels.modelId, modelId)
            ));
            
        if (existingRelationship.length > 0) {
            // Update the existing relationship to primary
            return await tx
                .update(agentModels)
                .set({ role: "primary" })
                .where(and(
                    eq(agentModels.agentId, agentId),
                    eq(agentModels.modelId, modelId)
                ))
                .returning();
        } else {
            // Create a new primary relationship
            return await tx
                .insert(agentModels)
                .values({
                    agentId,
                    modelId,
                    role: "primary"
                })
                .returning();
        }
    });
}

/**
 * Adds one or multiple models as secondary models for an agent.
 * If a model is already associated with the agent, its role will be updated to secondary.
 * 
 * @param agentId - The ID of the agent.
 * @param modelIds - An array of model IDs to add as secondary models.
 * @returns The created or updated agent-model relationships.
 */
export async function addSecondaryModelsToAgent(agentId: string, modelIds: string[]): Promise<AgentModel[]> {
    if (!modelIds.length) {
        return [];
    }

    return await db.transaction(async (tx) => {
        const results: AgentModel[] = [];

        // Process each model ID
        for (const modelId of modelIds) {
            // Check if the model is already associated with the agent
            const existingRelationship = await tx
                .select()
                .from(agentModels)
                .where(and(
                    eq(agentModels.agentId, agentId),
                    eq(agentModels.modelId, modelId)
                ));

            if (existingRelationship.length > 0) {
                // If it's not already the primary model, update it to be secondary
                if (existingRelationship[0].role !== 'primary') {
                    const updated = await tx
                        .update(agentModels)
                        .set({ role: "secondary" })
                        .where(and(
                            eq(agentModels.agentId, agentId),
                            eq(agentModels.modelId, modelId)
                        ))
                        .returning();
                    
                    results.push(...updated);
                } else {
                    // If it's the primary model, don't change it
                    results.push(existingRelationship[0]);
                }
            } else {
                // Create a new secondary relationship
                const inserted = await tx
                    .insert(agentModels)
                    .values({
                        agentId,
                        modelId,
                        role: "secondary"
                    })
                    .returning();
                
                results.push(...inserted);
            }
        }

        return results;
    });
}

/**
 * Retrieves all agent models associated with a specific agent, identified by slug.
 * @param agentSlug - The unique slug of the agent.
 * @returns A promise that resolves to an array of AgentModel objects.
 */
export async function selectAgentModelsBySlug(agentSlug: string): Promise<AgentModel[]> {
    return await db
        .select({
            agentId: agentModels.agentId,
            modelId: agentModels.modelId,
            role: agentModels.role,
        }) // Select only columns from agentModels
        .from(agentModels)
        .innerJoin(agent, eq(agentModels.agentId, agent.id)) // Join based on agent ID
        .where(eq(agent.slug, agentSlug)); // Filter by agent slug
}



// --------------------- AGENT - KNOWLEDGE RELATIONS ---------------------    

/**
 * Retrieves all knowledge items associated with a specific agent, identified by slug.
 * @param agentSlug - The unique slug of the agent.
 * @returns A promise that resolves to an array of Knowledge objects.
 */
export async function selectAgentKnowledgeBySlug(agentSlug: string): Promise<Knowledge[]> {
    return await db
        .select({
            id: knowledge.id,
            agentId: knowledge.agentId,
            title: knowledge.title,
            content: knowledge.content,
            sourceUrl: knowledge.sourceUrl,
            createdAt: knowledge.createdAt,
            updatedAt: knowledge.updatedAt,
        }) // Select all columns from the knowledge table
        .from(knowledge)
        .innerJoin(agent, eq(knowledge.agentId, agent.id)) // Join based on agent ID
        .where(eq(agent.slug, agentSlug)); // Filter by agent slug
}

/**
 * Removes secondary models from an agent.
 * This function will only remove models with a 'secondary' role to prevent
 * accidentally removing the primary model.
 * 
 * @param agentId - The ID of the agent.
 * @param modelIds - An array of model IDs to remove from the agent.
 * @returns The number of relationships removed.
 */
export async function removeSecondaryModelsFromAgent(agentId: string, modelIds: string[]): Promise<number> {
    if (!modelIds.length) {
        return 0;
    }
    
    // Use a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
        // Delete the specified secondary model relationships
        const result = await tx
            .delete(agentModels)
            .where(
                and(
                    eq(agentModels.agentId, agentId),
                    eq(agentModels.role, "secondary"),
                    // Only include the specified model IDs in the condition
                    // Using the "in" array operator for SQL "modelId IN (modelIds)"
                    // Create individual conditions for each modelId and combine with OR
                    or(...modelIds.map(id => eq(agentModels.modelId, id)))
                )
            );
            
        // Return the count of deleted rows
        return result.count || 0;
    });
}


