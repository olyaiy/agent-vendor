import AgentInfoForm from "@/components/agents/settings/agent-info-form";
import AgentKnowledgeForm from "@/components/agents/settings/agent-knowledge-form";
import SystemPromptForm from "@/components/agents/settings/system-prompt-form";
import { selectAgentKnowledgeBySlug, selectAgentModelsBySlug, selectAgentTagsBySlug } from "@/db/repository/agent-relations.repository";
import { selectAgentBySlug } from "@/db/repository/agent.repository";
import { Suspense } from "react";

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

  // 3. Fetch Agent Models (Removed as unused for now)
  // const agentModels = await selectAgentModelsBySlug(agentSlug);

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




