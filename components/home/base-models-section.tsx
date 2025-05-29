import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBaseModelAgentsAction } from '@/db/actions/agent.actions';

// --- Loading Skeleton ---
function BaseModelsLoading() {
  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 overflow-x-auto pb-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center flex-shrink-0 animate-pulse">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 bg-muted/50 rounded-full mb-1 sm:mb-1.5"></div>
          <div className="h-1.5 sm:h-2 bg-muted/50 rounded w-6 sm:w-8 md:w-10"></div>
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
    return <p className="text-xs text-muted-foreground/70">Unable to load featured models</p>;
  }

  const agents = result.data || [];

  if (agents.length === 0) {
    return <p className="text-xs text-muted-foreground/70">No featured models available</p>;
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 overflow-x-auto pb-2 scrollbar-hide">
      {agents.map((agent) => (
        <Link 
          href={`/agent/${agent.slug || agent.id}`} 
          key={agent.id} 
          className="flex flex-col items-center group flex-shrink-0 pt-2"
        >
          {/* Responsive circular container */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 relative rounded-full overflow-hidden border border-border/30 bg-background shadow-sm transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md group-hover:scale-105">
            {(agent.avatarUrl || agent.thumbnailUrl) ? (
              <Image
                src={agent.avatarUrl || agent.thumbnailUrl!}
                alt={agent.name}
                fill
                sizes="(max-width: 640px) 40px, (max-width: 768px) 48px, (max-width: 1024px) 64px, (max-width: 1280px) 72px, 80px"
                className="object-cover transition-all duration-200 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-muted-foreground">
                <span className="text-sm sm:text-lg md:text-xl lg:text-2xl opacity-60">🤖</span>
              </div>
            )}
            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          {/* Responsive model name */}
          <p className="text-[9px] sm:text-[10px] md:text-xs text-center mt-1 sm:mt-1.5 font-medium text-muted-foreground/80 group-hover:text-muted-foreground transition-colors truncate max-w-[40px] sm:max-w-[48px] md:max-w-[64px] lg:max-w-[72px] xl:max-w-[80px]">
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
    <section className="mb-6 sm:mb-4">
      {/* Responsive section header */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">Base Models</h3>
        <div className="flex-1 h-px bg-border/30" />
      </div>
      
      <Suspense fallback={<BaseModelsLoading />}>
        <BaseModelAgentsRow promise={baseModelsResultPromise} />
      </Suspense>
    </section>
  );
}
