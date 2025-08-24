import HeaderPadding from "@/components/header-padding";
import { AgentSearch } from "@/components/home/agent-search";
import { TagFilters } from "@/components/home/tag-filters";
import { AgentsGrid, AgentsLoading } from "@/components/home/agents-grid";
import { Suspense } from "react";

type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedTag = typeof params?.tag === 'string' ? params.tag : undefined;
  const searchQuery = typeof params?.search === 'string' ? params.search : undefined;
  const page = typeof params?.page === 'string' ? parseInt(params.page) : 1;
  const pageSize = typeof params?.pageSize === 'string' ? parseInt(params.pageSize) : 12;

  return (
    <main className="container mx-auto pt-4 pb-8 px-4">
      <HeaderPadding />

      {/* Search Bar */}
      <AgentSearch /> 

      {/* Render Tag Filters with its own Suspense boundary */}
      <Suspense fallback={<TagFiltersLoading />}>
        <TagFilters selectedTag={selectedTag} />
      </Suspense>

      {/* Render the Agents Grid (handles its own data fetching and Suspense) */}
      <Suspense fallback={<AgentsLoading />}>
        <AgentsGrid tag={selectedTag} searchQuery={searchQuery} page={page} pageSize={pageSize} />
      </Suspense>
    </main>
  );
}

// Loading component for tag filters
function TagFiltersLoading() {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-4 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 w-16 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
      ))}
    </div>
  );
}
