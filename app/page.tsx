import { getTopTagsAction } from "@/db/actions/agent-actions";
import HeaderPadding from "@/components/header-padding";
import { AgentSearch } from "@/components/home/agent-search";
import { TagFilters } from "@/components/home/tag-filters";
import { BaseModelsSection } from "@/components/home/base-models-section";
import { AgentsGrid } from "@/components/home/agents-grid";


type PageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};



export default async function Home({ searchParams }: PageProps) {


  const params = await searchParams;
  const selectedTag = typeof params?.tag === 'string' ? params.tag : undefined;
  const searchQuery = typeof params?.search === 'string' ? params.search : undefined; // Read search query

  // Fetch top tags
  const tagsResult = await getTopTagsAction(5); // Fetch top 5 tags for filtering
  const topTags = tagsResult.success ? tagsResult.data || [] : [];


  return (
    <main className="container mx-auto pt-4 pb-8 px-4">
      <HeaderPadding />

      {/* Base Models Section */}
      <BaseModelsSection searchQuery={searchQuery} />

      {/* Search Bar */}
      <AgentSearch /> 



      {/* Render Tag Filters */}
      <TagFilters
        topTags={topTags}
        selectedTag={selectedTag}
        tagsResultSuccess={tagsResult.success}
        tagsResultError={!tagsResult.success ? tagsResult.error : undefined}
      />

      {/* Render the Agents Grid (handles its own data fetching and Suspense) */}
      <AgentsGrid tag={selectedTag} searchQuery={searchQuery} />

    </main>
  );
}
