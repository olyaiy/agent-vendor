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
  // const knowledgeItems = await selectAgentKnowledgeBySlug(agentSlug);

  // 5. Fetch Tags (Removed as unused for now)
  // const tags = await selectAgentTagsBySlug(agentSlug);

  // Handle case where agent is not found
  if (!agentData) {
    // TODO: Implement a proper not-found handling mechanism
    // For now, just return a message or redirect
    return <div>Agent not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1>Settings</h1>
      {/* Static content renders immediately */}
      <pre>{JSON.stringify(resolvedParams, null, 2)}</pre>
      <pre>{JSON.stringify(agentData, null, 2)}</pre>

      {/* Agent Details go here */}
      {/* Suspense now correctly wraps the component doing the async work */}
      <Suspense fallback={<div>Loading agent details...</div>}>
        {/* Pass the fetched agentData */}
        <SystemPromptForm agent={agentData} />
      </Suspense>


      
      {/* Other sections */}
      {/* Knowledge Items go here */}
      {/* Agent Models go here */}
      {/* Agent Tags go here */}
      {/* All Tags go here */}
    </div>
  );
}




