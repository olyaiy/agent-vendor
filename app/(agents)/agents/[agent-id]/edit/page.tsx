import AgentForm from "@/components/agent/agent-form";
import { auth } from "@/app/(auth)/auth";
import { db, getAgentWithAllModels, getAllToolGroups, getAllTags, getTagsByAgentId, getKnowledgeItems } from "@/lib/db/queries";
import { models, agents } from "@/lib/db/schema";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export default async function EditAgentPage({
  params: paramsPromise,
}: {
  params: Promise<{ "agent-id": string }>;
}) {
  const session = await auth();
  const params = await paramsPromise;
  const agentId = params["agent-id"];

  // First check if the agent exists and get the creatorId
  const [agent] = await db.select({
    creatorId: agents.creatorId
  }).from(agents).where(eq(agents.id, agentId));

  if (!agent) {
    return notFound();
  }

  // If user is not the creator, redirect to view page
  if (session?.user?.id !== agent.creatorId) {
    redirect(`/agents/${agentId}/view`);
  }

  const [agentWithModels, modelsList, toolGroups, tags, agentTags, knowledgeItems] = await Promise.all([
    getAgentWithAllModels(agentId),
    db.select({
      id: models.id,
      displayName: models.model_display_name,
      modelType: models.model_type,
      description: models.description,
      provider: models.provider
    }).from(models),
    getAllToolGroups(),
    getAllTags(),
    getTagsByAgentId(agentId),
    getKnowledgeItems({ agentId })
  ]);




  if (!agentWithModels) {
    return notFound();
  }

  const initialData = {
    id: agentId,
    agentDisplayName: agentWithModels.agent_display_name,
    systemPrompt: agentWithModels.system_prompt,
    description: agentWithModels.description ?? undefined,
    modelId: agentWithModels.modelId,
    alternateModelIds: agentWithModels.alternateModelIds,
    toolGroupIds: agentWithModels.toolGroupIds || [],
    tagIds: agentTags.map(tag => tag.id),
    visibility: agentWithModels.visibility || 'public',
    artifactsEnabled: agentWithModels.artifacts_enabled,
    imageUrl: agentWithModels.thumbnail_url ?? undefined,
    customization: agentWithModels.customization as any
  };

  return (
    <div className="container mx-auto px-2 ">
      <AgentForm 
        mode="edit"
        userId={session?.user?.id}
        models={modelsList}
        toolGroups={toolGroups}
        tags={tags}
        initialData={initialData}
        knowledgeItems={knowledgeItems }
      />
    </div>
  );
}
