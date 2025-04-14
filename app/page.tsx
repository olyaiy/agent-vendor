import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image"; // Added for agent thumbnails
import { getRecentAgents, getTopTagsAction, getBaseModelAgentsAction } from "@/db/actions/agent-actions"; // Added getBaseModelAgentsAction
import { AgentCard } from "@/components/agent-card";
import HeaderPadding from "@/components/header-padding";
import { Badge } from "@/components/ui/badge";

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

// Loading component for the base models row
function BaseModelsLoading() {
  return (
    <div className="flex flex-row gap-4 overflow-x-auto py-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center flex-shrink-0 w-24 animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-md mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
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

// Update PageProps type to use Promise for searchParams
type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: PageProps) {
  // Await the searchParams promise
  const params = await searchParams;
  const selectedTag = typeof params?.tag === 'string' ? params.tag : undefined;

  // Fetch top tags
  const tagsResult = await getTopTagsAction(5); // Fetch top 5 tags for filtering
  const topTags = tagsResult.success ? tagsResult.data || [] : [];

  // Fetch base model agents (no need for Suspense here as it's a small, fixed list)
  // We fetch this concurrently with other data fetches
  const baseModelsResultPromise = getBaseModelAgentsAction();

  return (
    <main className="container mx-auto py-8 px-4">
      <HeaderPadding />

      {/* --- Base Models Section --- */}
      <h2 className="text-2xl font-semibold mb-3">Featured Base Models</h2>
      <Suspense fallback={<BaseModelsLoading />}>
        <BaseModelAgentsRow promise={baseModelsResultPromise} />
      </Suspense>
      {/* --- End Base Models Section --- */}

      <h1 className="text-3xl font-bold mb-4 mt-8">Explore Agents</h1> {/* Changed heading and added margin */}

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

      {/* Wrap the main agent list data fetching component in Suspense */}
      <Suspense fallback={<AgentsLoading />}>
        {/* Pass the selected tag to AgentsList */}
        <AgentsList tag={selectedTag} />
      </Suspense>
    </main>
  );
}


// --- New Component to Render Base Models ---

// Define the expected shape of a base model agent for the row
type BaseModelAgent = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
};

// Define the expected shape of the promise result
type BaseModelResult = Promise<{
  success: boolean;
  data?: BaseModelAgent[];
  error?: string;
}>;

async function BaseModelAgentsRow({ promise }: { promise: BaseModelResult }) {
  const result = await promise;

  if (!result.success) {
    return <p className="text-sm text-red-500">Error loading featured models: {result.error}</p>;
  }

  const agents = result.data || [];

  if (agents.length === 0) {
    return <p className="text-sm text-gray-500">No featured models found.</p>;
  }

  return (
    <div className="flex flex-row gap-4 overflow-x-auto pb-4 mb-6 border-b"> {/* Added padding and border */}
      {agents.map((agent) => (
        <Link href={`/${agent.id}`} key={agent.id} className="flex flex-col items-center flex-shrink-0 w-24 group">
          <div className="w-24 h-24 relative rounded-md overflow-hidden border group-hover:border-blue-500 transition-colors">
            {agent.thumbnailUrl ? (
              <Image
                src={agent.thumbnailUrl}
                alt={agent.name}
                fill // Use fill to cover the container
                sizes="96px" // ~ w-24
                className="object-cover" // Ensure image covers the area
              />
            ) : (
              // Placeholder if no thumbnail
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 font-medium text-gray-700 group-hover:text-blue-600 transition-colors truncate w-full px-1">
            {agent.name}
          </p>
        </Link>
      ))}
    </div>
  );
}
