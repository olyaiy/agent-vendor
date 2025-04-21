import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRecentAgents, getTopTagsAction, getBaseModelAgentsAction } from "@/db/actions/agent-actions";
import { AgentCard } from "@/components/agent-card";
import HeaderPadding from "@/components/header-padding";
import { Badge } from "@/components/ui/badge";
import { AgentSearchInput } from "@/components/agent-search-input"; // Import the search input
// import { FilterBar } from "@/components/filter-bar";

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
  // Adjust loading skeleton for grid layout on mobile
  return (
    <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-4 sm:overflow-x-auto py-2">
      {Array.from({ length: 6 }).map((_, index) => ( // Assuming 6 base models for 2 rows of 3
        <div key={index} className="flex flex-col items-center sm:flex-shrink-0 sm:w-24 animate-pulse">
          <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-md mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

// Define the ID for the base model tag
const BASE_MODEL_TAG_ID = "575527b1-803a-4c96-8a4a-58ca997f08bd";

// This component handles streaming agents one by one, optionally filtered by tag
// Update AgentsList to accept and use searchQuery
async function AgentsList({ tag, searchQuery }: { tag?: string, searchQuery?: string }) {
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
    // MODIFIED: grid-cols-2 for mobile, keeping sm and up as before
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"> 
      {filteredAgents.map((agent) => ( // Use filteredAgents
        <Suspense key={agent.id} fallback={<AgentItemLoading />}>
          {/* Assuming AgentCard can handle the agent object potentially including tags */}
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
  const searchQuery = typeof params?.search === 'string' ? params.search : undefined; // Read search query

  // Fetch top tags
  const tagsResult = await getTopTagsAction(5); // Fetch top 5 tags for filtering
  const topTags = tagsResult.success ? tagsResult.data || [] : [];

  // Fetch base model agents (no need for Suspense here as it's a small, fixed list)
  // We fetch this concurrently with other data fetches
  const baseModelsResultPromise = getBaseModelAgentsAction();

  return (
    <main className="container mx-auto py-8 px-4">
      <HeaderPadding />
    <AgentSearchInput /> {/* Render the search input */}
    {/* <FilterBar /> */}

{/* --- Base Models Section (Conditionally Rendered) --- */}
{!searchQuery && ( // Only show if there's no active search query
  <>
    <h2 className="text-2xl font-semibold mb-3 mt-6">⚡ Base Models</h2> {/* Added margin-top */}
    <Suspense fallback={<BaseModelsLoading />}>
      <BaseModelAgentsRow promise={baseModelsResultPromise} />
    </Suspense>
  </>
)}
{/* --- End Base Models Section --- */}
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
        <AgentsList tag={selectedTag} searchQuery={searchQuery} /> {/* Pass searchQuery */}
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
    // MODIFIED: Grid 3-col for mobile, flex row (scroll) for sm+
    <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-4 sm:overflow-x-auto pb-4 mb-6 border-b"> 
      {agents.map((agent) => (
        // MODIFIED: Remove fixed width/shrink for grid, apply only for sm+
        <Link href={`/${agent.id}`} key={agent.id} className="flex flex-col items-center group sm:flex-shrink-0 sm:w-24"> 
          {/* MODIFIED: Adjust image container width for grid, apply fixed width only for sm+ */}
          <div className="w-full sm:w-24 h-24 relative rounded-md overflow-hidden border group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-800">
            {agent.thumbnailUrl ? (
              <Image
                src={agent.thumbnailUrl}
                alt={agent.name}
                fill // Use fill to cover the container
                sizes="(max-width: 640px) 30vw, 96px" // Adjust sizes for grid vs fixed width
                className="object-cover" // Ensure image covers the area
              />
            ) : (
              // Placeholder if no thumbnail
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                No Image
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-1 font-medium group-hover:text-orange-300 transition-colors truncate w-full px-1">
            {agent.name}
          </p>
        </Link>
      ))}
    </div>
  );
}
