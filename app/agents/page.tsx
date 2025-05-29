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

  return (
    <main className="container mx-auto pt-4 pb-8 px-4">
      <HeaderPadding />

      {/* Agent Search Bar */}
      <AgentSearch />

      {/* Render Tag Filters */}
      <TagFilters
        selectedTag={selectedTag}
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