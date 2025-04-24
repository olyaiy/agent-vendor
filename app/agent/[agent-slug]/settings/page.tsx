import { Suspense } from 'react'; // Import Suspense
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth"; // Assuming auth setup

// --- Component Import ---
import { EditAgentForm } from "@/components/agents/edit-agent-form";

// --- Repository Function Imports ---
// Import ONLY the function needed for the initial fetch
import { AgentWithModelAndTags, selectAgentWithModelBySlug } from "@/db/repository/agent.repository";
// Import functions needed for the loader component
import { selectKnowledgeByAgentSlug } from "@/db/repository/agent.repository"; // Using existing non-optimized version
import { selectAllModels } from "@/db/repository/model.repository";
import { selectAllTags, selectTagsByAgentId } from "@/db/repository/tag.repository";

// --- Type Imports (Ensure paths are correct) ---
import type { Model, Knowledge, Tag } from '@/db/schema/agent';

// --- Loading Component (Can be defined here or imported) ---
function LoadingSpinner() {
  return <div className="p-4 text-center">Loading settings form...</div>;
}

// --- Type Definitions ---
type Params = { "agent-slug": string };

type PageProps = {
  params: Promise<Params>; // Use Promise for Next.js 15
};

// --- Main Page Component ---
export default async function Page({ params }: PageProps) {
  // 1. Await Params (Required for Next.js 15)
  console.log("Page: Awaiting params...");
  const awaitedParams = await params;
  const slug = awaitedParams["agent-slug"];
  console.log(`Page: Got slug: ${slug}`);


  // 3. Fetch *Essential* Agent Data First
  console.log(`Page: Fetching core agent data for ${slug}...`);
  // Use the optimized repo function that gets agent + primary model + agent tags
  const agent = await selectAgentWithModelBySlug(slug);
  console.log(`Page: Core agent data fetched.`);


  // 4. Validation / Authorization
  if (!agent) {
    console.log(`Page: Agent not found for slug ${slug}.`);
    notFound();
  }

  // 5. Render Page Shell + Suspense Boundary
  console.log(`Page: Rendering structure for ${agent.name}...`);
  return (
    <> {/* Using Fragment */}
      {/* You can add headers/layout structure here if needed */}
      <h1 className="text-2xl font-bold mb-4">Edit Agent: {agent.name} (Loading...)</h1>

      <Suspense fallback={<LoadingSpinner />}>
        {/* Render the loader component, passing essential data */}
        {/* The key prop helps React differentiate if slug changes, triggering refetch */}
        <AgentSettingsDataLoader key={slug} agent={agent} slug={slug} />
      </Suspense>
    </>
  );
}


// --- Async Loader Component (Can be in the same file or separate) ---
type LoaderProps = {
    agent: AgentWithModelAndTags; // Receive the validated core agent data
    slug: string;
};

async function AgentSettingsDataLoader({ agent, slug }: LoaderProps) {
  console.log(`Loader: Fetching remaining data for agent ${agent.id}...`);

  // Fetch remaining data concurrently using Promise.all
  // Using existing, non-optimized, non-cached functions as requested
  const [
    knowledge,
    allModels,
    allTags,
    agentTags // Fetch the agent's tags again using ID (less efficient than reusing, but per minimal change request)
  ] = await Promise.all([
    selectKnowledgeByAgentSlug(slug), // Uses the existing function which might be less optimal
    selectAllModels(),
    selectAllTags(),
    selectTagsByAgentId(agent.id) // Fetch tags associated with the agent
  ]);
  console.log(`Loader: Remaining data fetched for agent ${agent.id}.`);

  // Data Transformation for the form props
  const allTagsOptions = allTags.map(t => ({ value: t.id, label: t.name }));
  const currentTagsOptions = agentTags.map(t => ({ value: t.id, label: t.name }));

  // Render the actual form component with all the data
  return (
    <>
        <h1 className="text-2xl font-bold mb-4">Edit Agent: {agent.name} (Loaded)</h1> {/* Update title when loaded */}
        {/* <EditAgentForm
            agent={agent}
            models={allModels}
            knowledge={knowledge}
            allTags={allTagsOptions}
            currentTags={currentTagsOptions} // Use the tags fetched by ID
        /> */}
    </>
  );
}