import AgentInfoForm from "@/components/agents/settings/agent-info-form";
import AgentKnowledgeForm from "@/components/agents/settings/agent-knowledge-form";
import AgentModelsForm from "@/components/agents/settings/agent-models-form";
import SystemPromptForm from "@/components/agents/settings/system-prompt-form";
import AgentToolsForm from "@/components/agents/settings/agent-tools-form"; // Import AgentToolsForm
import AgentDeleteSection from "@/components/agents/settings/AgentDeleteSection"; // Import AgentDeleteSection
import { selectAllModels } from "@/db/repository";
import { selectAgentKnowledgeBySlug, selectAgentModelsBySlug } from "@/db/repository/agent-relations.repository";
import { getToolsForAgentAction } from "@/db/actions/agent-relations.actions";
import { selectAgentBySlug } from "@/db/repository/agent.repository";
import { getAllToolsAction } from "@/db/actions/tool.actions";
import { Suspense } from "react";
import { ModelInfo } from "../../create/create-agent-form";
import { Tool } from "@/db/schema/tool";

type Params = { "agent-slug": string };

type PageProps = {
  params: Promise<Params>;
};


// --- Main Page Component ---
export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];

  const agentData = await selectAgentBySlug(agentSlug);

  if (!agentData) {
    return <div>Agent not found.</div>;
  }

  const agentModels = await selectAgentModelsBySlug(agentSlug);
  const allModelsData = await selectAllModels();

  const allModels: ModelInfo[] = allModelsData.map(model => ({
    id: model.id,
    model: model.model,
    description: model.description,
    createdAt: model.createdAt?.toISOString(),
    updatedAt: model.updatedAt?.toISOString(),
  }));

  const knowledgeItems = await selectAgentKnowledgeBySlug(agentSlug);

  const agentToolsResult = await getToolsForAgentAction(agentData.id);
  const allToolsResult = await getAllToolsAction();

  let currentAgentTools: Tool[] = [];
  if (agentToolsResult.success) {
    currentAgentTools = agentToolsResult.data;
  } else {
    console.error("Failed to fetch agent tools:", agentToolsResult.error);
  }

  let allAvailableTools: Tool[] = [];
  if (allToolsResult.success) {
    allAvailableTools = allToolsResult.data;
  } else {
    console.error("Failed to fetch all available tools:", allToolsResult.error);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 py-8">

      <Suspense fallback={<div>Loading agent details...</div>}>
        <AgentInfoForm agent={agentData} />
      </Suspense>

      <Suspense fallback={<div>Loading agent models...</div>}>
        <AgentModelsForm
        agentModels={agentModels}
        agentId={agentData.id}
        allModels={allModels}
        />
      </Suspense>

      <Suspense fallback={<div>Loading agent tools...</div>}>
        <AgentToolsForm
          agentId={agentData.id}
          currentAgentTools={currentAgentTools}
          allAvailableTools={allAvailableTools}
        />
      </Suspense>

      <Suspense fallback={<div>Loading system prompt...</div>}>
        <SystemPromptForm agent={agentData} />
      </Suspense>

    

      <Suspense fallback={<div>Loading knowledge items...</div>}>
        <AgentKnowledgeForm
        knowledgeItems={knowledgeItems}
        agentId={agentData.id}
        />
      </Suspense>

    

      {/* Add the Delete Agent Section */}
      <Suspense fallback={<div>Loading delete section...</div>}>
        <AgentDeleteSection agentId={agentData.id} agentName={agentData.name} />
      </Suspense>

    </div>
  );
}
