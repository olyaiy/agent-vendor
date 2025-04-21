import { getTopTagsAction } from "@/db/actions/agent-actions"; // Removed getRecentAgents import
import HeaderPadding from "@/components/header-padding";
import { TagFilters } from "@/components/home/tag-filters";
import { AgentsGrid, AgentsLoading } from "@/components/home/agents-grid";
import { Suspense } from "react";
import { AgentSearch } from "@/components/home/agent-search"; // Assuming AgentSearch is reusable

// Define the props for the page component, including searchParams for filtering and pagination
type AgentsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Define the default page size
const PAGE_SIZE = 20;

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  // Await searchParams as it is now a Promise in Next.js 15
  const resolvedSearchParams = await searchParams;

  // Extract search parameters for tag, search query, and pagination
  const selectedTag = typeof resolvedSearchParams?.tag === 'string' ? resolvedSearchParams.tag : undefined;
  const searchQuery = typeof resolvedSearchParams?.search === 'string' ? resolvedSearchParams.search : undefined;
  const currentPage = Number(resolvedSearchParams?.page || '1'); // Default to page 1

  // Fetch top tags (or all tags if needed for this page - using top 20 for now)
  const tagsResult = await getTopTagsAction(20);
  const topTags = tagsResult.success ? tagsResult.data || [] : [];

  // Fetch paginated agents based on filters and current page
  // The AgentsGrid component now fetches its own data, so we just need to pass the parameters
  // const agentsResult = await getRecentAgents(selectedTag, searchQuery, currentPage, PAGE_SIZE);
  // const agents = agentsResult.success ? agentsResult.data.agents || [] : [];
  // const totalAgentCount = agentsResult.success ? agentsResult.data.totalCount : 0;


  return (
    <main className="container mx-auto pt-4 pb-8 px-4">
      <HeaderPadding />

      {/* Agent Search Bar */}
      <AgentSearch />

      {/* Render Tag Filters */}
      <TagFilters
        topTags={topTags}
        selectedTag={selectedTag}
        tagsResultSuccess={tagsResult.success}
        tagsResultError={!tagsResult.success ? tagsResult.error : undefined}
      />

      {/* Render the Agents Grid (handles its own data fetching and Suspense) */}
      {/* Pass pagination parameters to AgentsGrid */}
      <Suspense fallback={<AgentsLoading />}>
        <AgentsGrid
          tag={selectedTag}
          searchQuery={searchQuery}
          page={currentPage}
          pageSize={PAGE_SIZE}
          // agents={agents} // AgentsGrid now fetches internally
          // totalCount={totalAgentCount} // AgentsGrid now fetches internally
        />
      </Suspense>

    </main>
  );
}