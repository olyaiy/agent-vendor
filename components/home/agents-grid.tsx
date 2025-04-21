import React, { Suspense } from 'react';
import { getRecentAgents } from "@/db/actions/agent-actions";
import { AgentCard } from "@/components/agent-card";

// --- Loading Skeletons ---

// Loading component for the overall agents data fetch
export function AgentsLoading() {
  return <p className="text-gray-500">Loading agents data...</p>;
}

// Loading component for an individual agent card
function AgentItemLoading() {
  return (
    <div className="border rounded-md p-4 w-full max-w-sm animate-pulse">
      <div className="aspect-square bg-gray-200 mb-4 rounded-md"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// --- Main Grid Component ---

// Define the ID for the base model tag (needed for filtering)
const BASE_MODEL_TAG_ID = "575527b1-803a-4c96-8a4a-58ca997f08bd";

type AgentsGridProps = {
  tag?: string;
  searchQuery?: string;
};

/**
 * Server component responsible for fetching, filtering, and displaying the main grid of agents.
 * Uses Suspense for streaming.
 */
export async function AgentsGrid({ tag, searchQuery }: AgentsGridProps) {
  const result = await getRecentAgents(tag, searchQuery); // Pass tag and searchQuery to action

  if (!result.success) {
    return <p className="text-red-500">Error loading agents: {result.error}</p>;
  }

  const agents = result.data || [];

  // Filter out base models only for the default view (no tag selected AND no search query)
  const filteredAgents = (tag === undefined && searchQuery === undefined)
    ? agents.filter(agent =>
        // Check if the agent has the base model tag
        !agent.tags?.some(t => t.id === BASE_MODEL_TAG_ID)
      )
    : agents; // Otherwise (tag selected OR search active), show all fetched agents

  // Use filteredAgents for checks and rendering
  // Updated "No agents found" messages
  if (filteredAgents.length === 0) {
    if (searchQuery && tag) {
      return <p className="text-gray-500">{`No agents found matching "${searchQuery}" with the tag "${tag}".`}</p>;
    } else if (searchQuery) {
      return <p className="text-gray-500">{`No agents found matching "${searchQuery}".`}</p>;
    } else if (tag) {
      return <p className="text-gray-500">{`No agents found with the tag "${tag}".`}</p>;
    } else {
      // Base case: No tag, no search, but base models might have been filtered out
      const message = agents.length > 0 && filteredAgents.length === 0
        ? "No other recent agents found (excluding base models)."
        : "No recent agents found.";
      return <p className="text-gray-500">{message}</p>;
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-4 mt-8">Explore Agents</h1> {/* Changed heading and added margin */}
      {/* Grid container with per-item Suspense for streaming */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredAgents.map((agent) => (
          <Suspense key={agent.id} fallback={<AgentItemLoading />}>
            <AgentCard agent={agent} />
          </Suspense>
        ))}
      </div>
    </>
  );
}
