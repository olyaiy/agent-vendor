import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBaseModelAgentsAction } from '@/db/actions/agent.actions';

// --- Loading Skeleton ---
function BaseModelsLoading() {
  return (
    <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-4 sm:overflow-x-auto pb-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center sm:flex-shrink-0 sm:w-24 animate-pulse">
          <div className="w-full sm:w-24 h-24 bg-muted rounded-lg mb-2 border"></div>
          <div className="h-2 bg-muted rounded w-12"></div>
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
  avatarUrl: string | null;
  slug: string | null;
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
    return <p className="text-sm text-muted-foreground">Error loading featured models: {result.error}</p>;
  }

  const agents = result.data || [];

  if (agents.length === 0) {
    return <p className="text-sm text-muted-foreground">No featured models found.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-row sm:gap-4 sm:overflow-x-auto pb-4">
      {agents.map((agent, index) => (
        <Link 
          href={`/agent/${agent.slug || agent.id}`} 
          key={agent.id} 
          className={`flex flex-col items-center group sm:flex-shrink-0 sm:w-24 ${index >= 6 ? 'hidden sm:block' : ''}`}
        >
          <div className="w-full sm:w-24 h-24 relative rounded-lg overflow-hidden border border-border bg-muted/30 shadow-sm transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md group-hover:scale-[1.02]">
            {(agent.avatarUrl || agent.thumbnailUrl) ? (
              <Image
                src={agent.avatarUrl || agent.thumbnailUrl!}
                alt={agent.name}
                fill
                sizes="(max-width: 640px) 30vw, 96px"
                className="object-cover transition-all duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                <span className="text-2xl opacity-30">🤖</span>
              </div>
            )}
          </div>
          <p className="text-xs text-center mt-2 font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate w-full px-1">
            {agent.name}
          </p>
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

  // Fetch base model agents
  const baseModelsResultPromise = getBaseModelAgentsAction();

  return (
    <section className="mb-6">
      <h3 className="text-lg font-medium mb-3">Featured Models</h3>
      <Suspense fallback={<BaseModelsLoading />}>
        <BaseModelAgentsRow promise={baseModelsResultPromise} />
      </Suspense>
    </section>
  );
}
