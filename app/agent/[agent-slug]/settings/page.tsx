import AgentInfoForm from "@/components/agents/settings/agent-info-form";
import AgentKnowledgeForm from "@/components/agents/settings/agent-knowledge-form";
import AgentModelsForm from "@/components/agents/settings/agent-models-form";
import SystemPromptForm from "@/components/agents/settings/system-prompt-form";
import { selectAllModels } from "@/db/repository";
import { selectAgentKnowledgeBySlug, selectAgentModelsBySlug } from "@/db/repository/agent-relations.repository";
import { selectAgentBySlug } from "@/db/repository/agent.repository";
import { Suspense } from "react";
import { ModelInfo } from "../../create/create-agent-form";

type Params = { "agent-slug": string }; // Define the shape of the resolved params

type PageProps = {
  params: Promise<Params>; // Keep the Promise type
};


// --- Main Page Component ---
export default async function Page({ params }: PageProps) {
  // 1. Await the params promise
  const resolvedParams = await params;
  const agentSlug = resolvedParams["agent-slug"];

  // 2. Fetch Agent Details using the resolved slug
  const agentData = await selectAgentBySlug(agentSlug); // Use selectAgentBySlug

  // 3. Fetch Agent Models
  const agentModels = await selectAgentModelsBySlug(agentSlug);
  const allModelsData = await selectAllModels(); // Fetch raw data

  // Transform the raw model data to match the ModelInfo type expected by the form
  const allModels: ModelInfo[] = allModelsData.map(model => ({
    id: model.id,
    model: model.model,
    description: model.description,
    // Convert Date objects to ISO strings or handle potential undefined values
    createdAt: model.createdAt?.toISOString(),
    updatedAt: model.updatedAt?.toISOString(),
  }));

  // 4. Fetch Knowledge Items (Removed as unused for now)
  const knowledgeItems = await selectAgentKnowledgeBySlug(agentSlug);



  // 5. Fetch Tags (Removed as unused for now)
  // const tags = await selectAgentTagsBySlug(agentSlug);

  // Handle case where agent is not found
  if (!agentData) {
    return <div>Agent not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 py-8">

      {/* Agent Basic Info */}
      <Suspense fallback={<div>Loading agent details...</div>}>
        <AgentInfoForm agent={agentData} />
      </Suspense>

      {/* Agent Models */}
      <Suspense fallback={<div>Loading agent details...</div>}>
        <AgentModelsForm
        agentModels={agentModels} 
        agentId={agentData.id} 
        allModels={allModels}
        />
      </Suspense>

      {/* System Prompt Form */}
      <Suspense fallback={<div>Loading agent details...</div>}>
        <SystemPromptForm agent={agentData} />
      </Suspense>

      {/* Agent Knowledge Items */}
      <Suspense fallback={<div>Loading agent details...</div>}>
        <AgentKnowledgeForm 
        knowledgeItems={knowledgeItems} 
        agentId={agentData.id} 
        />
      </Suspense>






      {/* Other sections */}
      {/* Knowledge Items go here */}
      {/* Agent Models go here */}
      {/* Agent Tags go here */}
      {/* All Tags go here */}
    </div>
  );
}




