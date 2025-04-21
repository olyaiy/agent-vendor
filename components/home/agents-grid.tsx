import React, { Suspense } from 'react';
import { getRecentAgents } from "@/db/actions/agent-actions";
import { AgentCard } from "@/components/agent-card";
import { PaginationControls } from '@/components/agents/pagination-controls'; // Import pagination controls

// --- Loading Skeletons ---

// Loading component for the overall agents data fetch
export function AgentsLoading() {
  // Updated loading message to reflect pagination
  return <p className="text-gray-500">Loading agents data for the current page...</p>;
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

// Define the ID for the base model tag (no longer used for filtering in this component)
// const BASE_MODEL_TAG_ID = "575527b1-803a-4c96-8a4a-58ca997f08bd";

type AgentsGridProps = {
  tag?: string;
  searchQuery?: string;
  page: number; // Added page prop
  pageSize: number; // Added pageSize prop
  // We will fetch data inside this component, so we don't need to pass agents and totalCount directly
  // agents: Array<{
  //   id: string;
  //   name: string;
  //   description: string | null;
  //   thumbnailUrl: string | null;
  //   avatarUrl: string | null;
  //   creatorId: string;
  //   tags: { id: string; name: string }[];
  //   createdAt: Date;
  //   visibility: string;
  // }>;
  // totalCount: number; // Added totalCount prop
};

/**
 * Server component responsible for fetching, filtering, and displaying the main grid of agents with pagination.
 * Uses Suspense for streaming.
 */
export async function AgentsGrid({ tag, searchQuery, page, pageSize }: AgentsGridProps) {
  // Fetch paginated data using the updated action
  const result = await getRecentAgents(tag, searchQuery, page, pageSize);

  if (!result.success) {
    return <p className="text-red-500">Error loading agents: {result.error}</p>;
  }

  const { agents, totalCount } = result.data;

  // Removed the base model filtering logic as per the requirement for the /agents page

  // Use fetched agents for checks and rendering
  // Updated "No agents found" messages
  if (agents.length === 0) {
    if (searchQuery && tag) {
      return <p className="text-gray-500">{`No agents found matching "${searchQuery}" with the tag "${tag}".`}</p>;
    } else if (searchQuery) {
      return <p className="text-gray-500">{`No agents found matching "${searchQuery}".`}</p>;
    } else if (tag) {
      return <p className="text-gray-500">{`No agents found with the tag "${tag}".`}</p>;
    } else {
      // Default case: No tag, no search, no agents found
      return <p className="text-gray-500">No agents found.</p>;
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-4 mt-8">Explore Agents</h1> {/* Changed heading and added margin */}
      {/* Grid container with per-item Suspense for streaming */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {agents.map((agent) => (
          <Suspense key={agent.id} fallback={<AgentItemLoading />}>
            <AgentCard agent={agent} />
          </Suspense>
        ))}
      </div>
      {/* Render pagination controls */}
      <PaginationControls totalCount={totalCount} pageSize={pageSize} />
    </>
  );
}
