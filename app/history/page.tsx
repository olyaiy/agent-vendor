import { getUserChatsAction } from '@/db/actions/chat-actions';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { ChatHistoryClient } from '@/components/chat/chat-history-client';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
  // Check authentication
  const session = await auth.api.getSession({
    headers: await headers()
  });

  // Parse search params, providing defaults
  const resolvedParams = await searchParams || {};
  const query = resolvedParams.query ?? null;
  const page = parseInt(resolvedParams.page ?? '1', 10);

  // Fetch initial data using the server action (only if authenticated)
  const result = session ? await getUserChatsAction({ searchQuery: query, page }) : { success: false, data: null };

  // Create mock history items for the background when not authenticated
  const mockChats = Array(10).fill(null).map((_, i) => ({
    id: `mock-${i}`,
    title: `Mock Chat ${i + 1}`,
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString(),
  }));

  // Create the history content (either real or mock)
  const historyContent = (
    <div className="flex-1 overflow-hidden">
      {!session ? (
        // Mock history for background when not authenticated
        <div className="p-4 md:p-6">
          <div className="mb-4 flex justify-between items-center">
            <div className="w-64 h-10 bg-muted rounded-md"></div>
            <div className="w-32 h-10 bg-muted rounded-md"></div>
          </div>
          <div className="space-y-3">
            {mockChats.map((chat) => (
              <div 
                key={chat.id} 
                className="p-4 border border-border rounded-lg flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{chat.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Last updated: {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="h-6 w-24 bg-muted rounded"></div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <div className="w-64 h-10 bg-muted rounded-md"></div>
          </div>
        </div>
      ) : (
        // Real history content when authenticated
        <Suspense fallback={<HistoryLoadingSkeleton />}>
          <ChatHistoryClient
            initialChats={result?.data?.chats || []}
            initialTotalCount={result?.data?.totalCount || 0}
            initialPage={page}
            initialQuery={query}
          />
        </Suspense>
      )}
    </div>
  );

  // If not authenticated, show the sign-in overlay
  if (!session) {
    return (
      <div className="relative max-h-screen overflow-hidden">
        {/* Blurred background showing mock history */}
        <div className="filter blur-sm pointer-events-none opacity-50">
          {historyContent}
        </div>
        
        {/* Auth overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-8 max-w-md w-full mx-4 border border-border">
            <div className="text-center space-y-4 mb-6">
              <h2 className="text-2xl font-bold">Sign in to access</h2>
              <p className="text-muted-foreground">
                View and manage your chat history by signing in to your account
              </p>
            </div>
            <GoogleSignInButton className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Handle potential fetch errors gracefully
  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Please sign in to enable chat history</p>
          <p className="text-sm text-muted-foreground">Sign in to view and manage your previous chats.</p>
        </div>
        <GoogleSignInButton className="w-full max-w-xs" />
      </div>
    );
  }

  return historyContent;
}