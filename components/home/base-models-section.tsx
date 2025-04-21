import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBaseModelAgentsAction } from "@/db/actions/agent-actions";

// --- Loading Skeleton ---
function BaseModelsLoading() {
  // Adjust loading skeleton for grid layout on mobile
  return (
    <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-4 sm:overflow-x-auto pb-2">
      {Array.from({ length: 6 }).map((_, index) => ( // Assuming 6 base models for 2 rows of 3
        <div key={index} className="flex flex-col items-center sm:flex-shrink-0 sm:w-24 animate-pulse">
          <div className="w-full sm:w-24 h-24 bg-gray-200 rounded-md mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}

// --- Row Rendering Component ---

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
    <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-4 sm:overflow-x-auto pb-4  ">
      {agents.map((agent, index) => (
        // MODIFIED: Remove fixed width/shrink for grid, apply only for sm+
        <Link href={`/${agent.id}`} key={agent.id} className={`flex flex-col items-center group sm:flex-shrink-0 sm:w-24 ${index >= 6 ? 'hidden sm:block' : ''}`}>
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
          {/* <p className="text-xs text-center mt-1 font-medium group-hover:text-orange-300 transition-colors truncate w-full px-1">
            {agent.name}
          </p> */}
        </Link>
      ))}
    </div>
  );
}

// --- Main Section Component ---

type BaseModelsSectionProps = {
  searchQuery?: string;
};

/**
 * Server component responsible for fetching and rendering the Base Models section.
 * Conditionally renders based on the presence of a search query.
 */
export function BaseModelsSection({ searchQuery }: BaseModelsSectionProps) {
  // Only show if there's no active search query
  if (searchQuery) {
    return null;
  }

  // Fetch base model agents (no need for Suspense here as it's a small, fixed list)
  // We fetch this concurrently with other data fetches
  const baseModelsResultPromise = getBaseModelAgentsAction();

  return (
    <>
      <h2 className="text-2xl font-semibold mb-3 mt-0">⚡ Base Models</h2> {/* Added margin-top */}
      <Suspense fallback={<BaseModelsLoading />}>
        <BaseModelAgentsRow promise={baseModelsResultPromise} />
      </Suspense>
    </>
  );
}
