import { getUserChatsAction } from '@/db/actions/chat-actions';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { ChatHistoryClient } from '@/components/chat/chat-history-client';

// Define the expected shape of searchParams
interface HistoryPageProps {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}

// Define a loading component
function HistoryLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <Skeleton className="h-10 w-full md:w-1/2" /> {/* Search Input Skeleton */}
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" /> // Chat Item Skeleton
        ))}
      </div>
      <Skeleton className="h-10 w-64 mx-auto" /> {/* Pagination Skeleton */}
    </div>
  );
}


export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  // Parse search params, providing defaults
  const resolvedParams = await searchParams || {};
  const query = resolvedParams.query ?? null;
  const page = parseInt(resolvedParams.page ?? '1', 10);

  // Fetch initial data using the server action
  // Note: Error handling within the action returns { success: false, message: ... }
  // We might want more robust error display here (e.g., showing a toast or error message)
  const result = await getUserChatsAction({ searchQuery: query, page });

  // Handle potential fetch errors gracefully
  if (!result.success || !result.data) { // Add check for result.data
    // TODO: Implement better error display, maybe using toast notifications
    const errorMessage = result.message ?? "An unknown error occurred.";
    console.error("Failed to load chat history:", errorMessage);
    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-red-500">Error loading chat history.</p>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
    );
  }

  // Now TypeScript knows result.data exists here
  const { chats, totalCount } = result.data;

  return (
    <div className="flex-1 overflow-hidden">
       {/* Suspense boundary for client component hydration */}
       <Suspense fallback={<HistoryLoadingSkeleton />}>
            <ChatHistoryClient
                initialChats={chats}
                initialTotalCount={totalCount}
                initialPage={page}
                initialQuery={query}
            />
       </Suspense>
    </div>
  );
}