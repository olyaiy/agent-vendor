import React, { Suspense } from 'react';
import { getRecentAgents, getPopularAgents } from '@/db/actions/agent.actions';
import { AgentCard } from "@/components/agent-card";
import { PaginationControls } from '@/components/agents/pagination-controls';

// Tag ID used to identify base-model agents – only needed for debugging/logging.
const BASE_MODEL_TAG_ID = "575527b1-803a-4c96-8a4a-58ca997f08bd";

// --- Loading Skeletons ---

// Loading component for the overall agents data fetch
export function AgentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-muted/50 rounded w-48 animate-pulse"></div>
        <div className="h-4 bg-muted/30 rounded w-72 animate-pulse"></div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <AgentItemLoading key={i} />
        ))}
      </div>
    </div>
  );
}

// Loading component for an individual agent card
function AgentItemLoading() {
  return (
    <div className="group rounded-lg overflow-hidden bg-background border border-border/30 animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-muted/50 rounded-t-lg"></div>
      
      {/* Content skeleton */}
      <div className="p-3 space-y-3">
        <div className="h-5 bg-muted/50 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-muted/30 rounded w-full"></div>
          <div className="h-3 bg-muted/30 rounded w-2/3"></div>
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 bg-muted/30 rounded-full w-12"></div>
          <div className="h-5 bg-muted/30 rounded-full w-16"></div>
        </div>
      </div>
    </div>
  );
}

// --- Main Grid Component ---

// Previously we filtered out agents tagged as a "Base Model" using a hard-coded tag ID.
// That prevented legitimate results (especially when the user explicitly filters by that tag)
// from ever showing in the main grid. We now surface all agents and rely on UI/UX to avoid
// duplication with the separate "Base Models" row.

type AgentsGridProps = {
  tag?: string;
  searchQuery?: string;
  page: number;
  pageSize: number;
  sortBy?: 'recent' | 'popular';
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
export async function AgentsGrid({ tag, searchQuery, page, pageSize, sortBy = 'popular' }: AgentsGridProps) {
  const fetchFn = sortBy === 'recent' ? getRecentAgents : getPopularAgents;
  const result = await fetchFn(tag, searchQuery, page, pageSize);

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-sm">Error loading agents: {result.error}</p>
      </div>
    );
  }

  const { agents, totalCount } = result.data;

  // --- Debug logging: list every base-model agent returned from the query ---
  const baseModelAgents = agents.filter(agent =>
    agent.tags.some(tag => tag.id === BASE_MODEL_TAG_ID)
  );
  if (baseModelAgents.length) {
    console.log('[AgentsGrid] Base-model agents present:', baseModelAgents.map(a => ({ id: a.id, name: a.name, slug: a.slug })));
  }

  // Handle empty states with better messaging
  if (agents.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl opacity-20">🤖</div>
        {searchQuery && tag ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">No agents found</h3>
                         <p className="text-sm text-muted-foreground/70">
               No agents match &ldquo;{searchQuery}&rdquo; with the tag &ldquo;{tag}&rdquo;
             </p>
          </div>
        ) : searchQuery ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">No search results</h3>
                         <p className="text-sm text-muted-foreground/70">
               No agents found matching &ldquo;{searchQuery}&rdquo;
             </p>
          </div>
        ) : tag ? (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">No agents found</h3>
                         <p className="text-sm text-muted-foreground/70">
               No agents found with the tag &ldquo;{tag}&rdquo;
             </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-muted-foreground">No agents available</h3>
            <p className="text-sm text-muted-foreground/70">
              Be the first to create an agent!
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Section header with improved styling */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Explore Agents
          </h1>
          <div className="flex-1 h-px bg-border/30" />
          <span className="text-sm text-muted-foreground/70 font-medium">
            {totalCount} {totalCount === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        {(searchQuery || tag) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         {searchQuery && (
               <span>Searching for &ldquo;{searchQuery}&rdquo;</span>
             )}
             {searchQuery && tag && <span>•</span>}
             {tag && (
               <span>Tagged with &ldquo;{tag}&rdquo;</span>
             )}
          </div>
        )}
      </div>
      
      {/* Grid container with improved spacing and responsive design */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {agents.map((agent) => (
          <Suspense key={agent.id} fallback={<AgentItemLoading />}>
            <AgentCard 
              agent={agent} 
              className=""
            />
          </Suspense>
        ))}
      </div>
      
      {/* Pagination controls with better spacing */}
      <div className="pt-4">
        <PaginationControls totalCount={totalCount} pageSize={pageSize} />
      </div>
    </section>
  );
}
