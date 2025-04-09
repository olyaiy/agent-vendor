import { Suspense } from "react";
import { getRecentAgents } from "@/db/actions/agent-actions";
import { AgentCard } from "@/components/agent-card";
import HeaderPadding from "@/components/header-padding";


// Loading component for the agents data
function AgentsLoading() {
  return <p className="text-gray-500">Loading agents data...</p>;
}

// Individual agent loading component
function AgentItemLoading() {
  return (
    <div className="border rounded-md p-4 w-full max-w-sm animate-pulse">
      <div className="aspect-square bg-gray-200 mb-4 rounded-md"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// This component handles streaming agents one by one
async function AgentsList() {
  const result = await getRecentAgents();
  
  if (!result.success) {
    return <p className="text-red-500">Error loading agents: {result.error}</p>;
  }
  
  const agents = result.data || [];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {agents.map((agent) => (
        <Suspense key={agent.id} fallback={<AgentItemLoading />}>
          <AgentCard agent={{...agent, visibility: 'public'}} />
        </Suspense>
      ))}
    </div>
  );
}

export default function Home() {

  return (
    <main className="container mx-auto py-8 px-4">

      <HeaderPadding />
      <h1 className="text-3xl font-bold mb-6">Recent Agents</h1>
      
      {/* Wrap the data fetching component in Suspense for progressive hydration */}
      <Suspense fallback={<AgentsLoading />}>
        <AgentsList />
      </Suspense>
    </main>
  );
}
