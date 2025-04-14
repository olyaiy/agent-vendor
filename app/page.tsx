import { Suspense } from "react";
import Link from "next/link"; // Added
import { getRecentAgents, getTopTagsAction } from "@/db/actions/agent-actions"; // Added getTopTagsAction
import { AgentCard } from "@/components/agent-card";
import HeaderPadding from "@/components/header-padding";
import { Badge } from "@/components/ui/badge"; // Added

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

// This component handles streaming agents one by one, optionally filtered by tag
async function AgentsList({ tag }: { tag?: string }) { // Added tag prop
  const result = await getRecentAgents(tag); // Pass tag to action
  
  if (!result.success) {
    return <p className="text-red-500">Error loading agents: {result.error}</p>;
  }
  
  const agents = result.data || [];
  
  if (agents.length === 0 && tag) {
    return <p className="text-gray-500">No agents found with the tag &quot;{tag}&quot;.</p>;
  }
  if (agents.length === 0) {
    return <p className="text-gray-500">No recent agents found.</p>;
  }
  
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

// Define PageProps type to include searchParams
type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function Home({ searchParams }: PageProps) { // Add searchParams prop
  const selectedTag = typeof searchParams?.tag === 'string' ? searchParams.tag : undefined;

  // Fetch top tags
  const tagsResult = await getTopTagsAction(5);
  const topTags = tagsResult.success ? tagsResult.data || [] : [];

  return (
    <main className="container mx-auto py-8 px-4">
      <HeaderPadding />
      <h1 className="text-3xl font-bold mb-4">Recent Agents</h1>

      {/* Tag Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/">
          <Badge variant={!selectedTag ? 'default' : 'outline'} className="cursor-pointer">
            All
          </Badge>
        </Link>
        {tagsResult.success ? (
          topTags.map(tag => (
            <Link key={tag.id} href={`/?tag=${encodeURIComponent(tag.name)}`}>
              <Badge
                variant={selectedTag === tag.name ? 'default' : 'outline'}
                className="cursor-pointer"
              >
                {tag.name}
              </Badge>
            </Link>
          ))
        ) : (
          <p className="text-sm text-red-500">Error loading tags: {tagsResult.error}</p>
        )}
      </div>
      
      {/* Wrap the data fetching component in Suspense for progressive hydration */}
      <Suspense fallback={<AgentsLoading />}>
        {/* Pass the selected tag to AgentsList */}
        <AgentsList tag={selectedTag} />
      </Suspense>
    </main>
  );
}
