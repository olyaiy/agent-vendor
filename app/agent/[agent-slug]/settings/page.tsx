import { selectAgentKnowledgeBySlug, selectAgentModelsBySlug } from "@/db/repository/agent-relations.repository";
import { selectAgentBySlug } from "@/db/repository/agent.repository";
import { AgentModel, Knowledge } from "@/db/schema/agent";
import { Suspense } from "react";

type Params = { "agent-slug": string }; // Define the shape of the resolved params

type PageProps = {
  params: Promise<Params>; // Keep the Promise type
};

// --- Main Page Component ---
export default async function Page({ params }: PageProps) {
  // 1. Await the params promise
  const resolvedParams = await params;

  // 2. Fetch Agent Details using the resolved slug
  const agentSlug = resolvedParams["agent-slug"];

  // 3. Fetch Agent Models
  const agentModels = await selectAgentModelsBySlug(agentSlug);

  // 4. Fetch Knowledge Items
  const knowledgeItems = await selectAgentKnowledgeBySlug(agentSlug);



  return (
    <div>
      <h1>Settings</h1>
      {/* Static content renders immediately */}
      <pre>{JSON.stringify(resolvedParams, null, 2)}</pre>

      {/* Agent Details go here */}
      {/* Suspense now correctly wraps the component doing the async work */}
      <Suspense fallback={<div>Loading agent details (will take 3s)...</div>}>
        <AgentDisplay 
        agentSlug={agentSlug} 
        agentModels={agentModels} 
        knowledgeItems={knowledgeItems}
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






// --- Quick & Dirty Agent Display Component ---
// Defined in the same file for testing purposes
interface AgentDisplayProps {
  agentSlug: string;
  agentModels: AgentModel[];
  knowledgeItems: Knowledge[];
}
async function AgentDisplay({ agentSlug, agentModels, knowledgeItems }: AgentDisplayProps) {
  // Fetch agent data INSIDE this component
  const agent = await selectAgentBySlug(agentSlug);

  // Simulate delay INSIDE this component
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (!agent) {
    return <p>Agent not found.</p>;
  }

  // Render the result
  return (
    <>
      <pre>{JSON.stringify(agent, null, 2)}</pre>
      <pre>{JSON.stringify(agentModels, null, 2)}</pre>
      <pre>{JSON.stringify(knowledgeItems, null, 2)}</pre>
    </>
  );
}
