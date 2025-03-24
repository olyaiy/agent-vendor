import { db } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { models, agents, agentTags, tags, agentToolGroups, toolGroups, AgentCustomization, agentModels } from "@/lib/db/schema";
import { auth } from "@/app/(auth)/auth";
import AgentView from "@/components/agent/agent-view";

export default async function ViewAgentPage({
  params: paramsPromise,
}: {
  params: Promise<{ "agent-id": string }>;
}) {
  const params = await paramsPromise;
  const agentId = params["agent-id"];
  const session = await auth();

  // First check agent existence and permissions
  const [accessCheck] = await db.select({
    creatorId: agents.creatorId,
    visibility: agents.visibility
  }).from(agents).where(eq(agents.id, agentId));

  if (!accessCheck) {
    return notFound();
  }

  if (accessCheck.visibility === 'private' && session?.user?.id !== accessCheck.creatorId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Sorry, you don&#39;t have access</p>
      </div>
    );
  }

  // Proceed with full data fetch if authorized
  const [agentData, rawModels] = await Promise.all([
    db.select().from(agents).where(eq(agents.id, agentId)),
    db.select({
      id: models.id,
      displayName: models.model_display_name,
      modelType: models.model_type,
      description: models.description
    }).from(models),
  ]);

  if (!agentData.length) {
    return notFound();
  }

  // Fetch agent's models (both default and alternate)
  const agentModelsData = await db
    .select({
      modelId: agentModels.modelId,
      isDefault: agentModels.isDefault
    })
    .from(agentModels)
    .where(eq(agentModels.agentId, agentId));

  // Get the default model ID, or empty string if not found
  const defaultModelId = agentModelsData.find(m => m.isDefault)?.modelId || '';
  
  // Get all model IDs (both default and alternate)
  const allModelIds = agentModelsData.map(m => m.modelId);

  // Fetch agent tags
  const agentTagsData = await db
    .select({
      id: tags.id,
      name: tags.name
    })
    .from(agentTags)
    .innerJoin(tags, eq(agentTags.tagId, tags.id))
    .where(eq(agentTags.agentId, agentId));

  // Fetch agent tool groups
  const agentToolGroupsData = await db
    .select({
      id: toolGroups.id,
      name: toolGroups.name,
      displayName: toolGroups.display_name,
      description: toolGroups.description
    })
    .from(agentToolGroups)
    .innerJoin(toolGroups, eq(agentToolGroups.toolGroupId, toolGroups.id))
    .where(eq(agentToolGroups.agentId, agentId));
    
  // Map tool groups to the correct format
  const formattedToolGroups = agentToolGroupsData.map(tool => ({
    id: tool.id,
    name: tool.name,
    displayName: tool.displayName,
    description: tool.description ?? undefined
  }));

  // Find the default model for modelDetails
  const defaultModel = rawModels.find(m => m.id === defaultModelId);

  const agentViewData = {
    id: agentId,
    agentDisplayName: agentData[0].agent_display_name,
    systemPrompt: agentData[0].system_prompt,
    description: agentData[0].description ?? undefined,
    modelId: defaultModelId,
    visibility: agentData[0].visibility || 'public',
    artifactsEnabled: agentData[0].artifacts_enabled,
    imageUrl: agentData[0].thumbnail_url || undefined,
    customization: agentData[0].customization as AgentCustomization | undefined,
    createdAt: agentData[0].createdAt || undefined,
    updatedAt: agentData[0].updatedAt || undefined,
    tags: agentTagsData,
    toolGroups: formattedToolGroups,
    // Add modelDetails in the exact format expected by AgentView
    modelDetails: defaultModel ? {
      displayName: defaultModel.displayName,
      modelType: defaultModel.modelType || 'Unknown',
      description: defaultModel.description ?? undefined
    } : undefined
  };

  // Filter models list to only include those associated with this agent
  const modelsList = rawModels
    .filter(model => allModelIds.includes(model.id))
    .map(m => ({
      ...m,
      description: m.description ?? undefined
    }));

  return (
    <div className="container mx-auto py-8 px-4">
      <AgentView
        agentData={agentViewData}
        models={modelsList}
      />
    </div>
  );
} 