import HeaderPadding from "@/components/header-padding";
import { AgentSearch } from "@/components/home/agent-search";
import { TagFilters } from "@/components/home/tag-filters";
import { BaseModelsSection } from "@/components/home/base-models-section";
import { AgentsGrid, AgentsLoading } from "@/components/home/agents-grid";
import { Suspense } from "react";
import { getTopTagsAction } from "@/db/actions/tag.actions";



type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};



export default async function Home({ searchParams }: PageProps) {


  const params = await searchParams;
  const selectedTag = typeof params?.tag === 'string' ? params.tag : undefined;
  const searchQuery = typeof params?.search === 'string' ? params.search : undefined; // Read search query
  const page = typeof params?.page === 'string' ? parseInt(params.page) : 1; // Default to page 1
  const pageSize = typeof params?.pageSize === 'string' ? parseInt(params.pageSize) : 12; // Default page size

  // Fetch top tags
  const tagsResult = await getTopTagsAction(20); // Fetch top 5 tags for filtering
  const topTags = tagsResult.success ? tagsResult.data || [] : [];


  return (
    <main className="container mx-auto pt-4 pb-8 px-4">
      <HeaderPadding />

      {/* Search Bar */}
      <AgentSearch /> 

      {/* Render Tag Filters */}
      <TagFilters
        topTags={topTags}
        selectedTag={selectedTag}
        tagsResultSuccess={tagsResult.success}
        tagsResultError={!tagsResult.success ? tagsResult.error : undefined}
      />

      {/* Base Models Section */}
      <BaseModelsSection searchQuery={searchQuery} />

      {/* Render the Agents Grid (handles its own data fetching and Suspense) */}
      <Suspense fallback={<AgentsLoading />}>
        <AgentsGrid tag={selectedTag} searchQuery={searchQuery} page={page} pageSize={pageSize} />
      </Suspense>

    </main>
  );
}
