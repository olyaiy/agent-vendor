'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this path is correct
import { getUserChatsAction } from '@/db/actions/chat-actions';
import { ChatListItem } from '@/components/chat/chat-list-item'; // We will create this next
import type { Chat } from '@/db/schema/chat'; // Import Chat type if needed for props

// Define the type for the chat data we expect from the action
// Define the type for the chat data we expect from the action, including last message details
type ChatHistoryItem = Pick<Chat, 'id' | 'title' | 'createdAt' | 'agentId'> & {
  lastMessageParts: unknown | null;
  lastMessageRole: string | null;
};

interface ChatHistoryClientProps {
  initialChats: ChatHistoryItem[];
  initialTotalCount: number;
  initialPage: number;
  initialQuery: string | null;
}

export function ChatHistoryClient({
  initialChats,
  initialTotalCount,
  initialPage,
  initialQuery,
}: ChatHistoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition(); // For smoother UI updates

  // State for the component
  const [chats, setChats] = useState<ChatHistoryItem[]>(initialChats);
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [searchInputValue, setSearchInputValue] = useState<string>(initialQuery ?? ''); // Input's value
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Debounce the search input value
  const debouncedSearchQuery = useDebounce(searchInputValue, 300);

  const pageSize = 10; // As defined in the plan
  const totalPages = Math.ceil(totalCount / pageSize);

  // Function to fetch chats from the server action
  const fetchChats = useCallback(async (query: string | null, page: number) => {
    setIsLoading(true);
    try {
      const result = await getUserChatsAction({ searchQuery: query, page });
      if (result.success && result.data) {
        setChats(result.data.chats);
        setTotalCount(result.data.totalCount);
        setCurrentPage(page); // Ensure page state matches fetched page
      } else {
        console.error("Failed to fetch chats:", result.message);
        // TODO: Show error toast to user
        setChats([]); // Clear chats on error
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      // TODO: Show error toast to user
      setChats([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies: getUserChatsAction is stable

  // Effect to update URL and fetch data when debounced query or page changes
  useEffect(() => {
    const currentQuery = searchParams.get('query') ?? '';
    const currentPageFromUrl = parseInt(searchParams.get('page') ?? '1', 10);

    // Determine if a fetch is needed based on debounced query or page change
    // Compare debounced query with URL query, and current page state with URL page
    const queryChanged = debouncedSearchQuery !== currentQuery;
    const pageChanged = currentPage !== currentPageFromUrl; // Compare state page with URL page

    // Only fetch if the debounced query has changed from the URL query,
    // or if the component's current page state differs from the URL page (meaning pagination was clicked)
    if (queryChanged || pageChanged) {
        // Update URL first
        const newParams = new URLSearchParams(searchParams.toString());
        if (debouncedSearchQuery) {
            newParams.set('query', debouncedSearchQuery);
        } else {
            newParams.delete('query');
        }
        // If query changed, reset to page 1. Otherwise, use the current page state.
        const targetPage = queryChanged ? 1 : currentPage;
        newParams.set('page', targetPage.toString());

        // Use startTransition for non-urgent updates
        startTransition(() => {
             router.push(`/history?${newParams.toString()}`, { scroll: false });
             // Fetch data based on the *new* state reflected in the URL
             fetchChats(debouncedSearchQuery, targetPage);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, currentPage, router, searchParams, fetchChats]); // Add currentPage and searchParams

  // Handlers for pagination
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1); // Update state, useEffect will handle URL update and fetch
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1); // Update state, useEffect will handle URL update and fetch
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 space-y-4">
      {/* Search Input */}
      <Input
        placeholder="Search chat titles and messages..."
        value={searchInputValue}
        onChange={(e) => setSearchInputValue(e.target.value)}
        className="max-w-lg"
      />

      {/* Chat List Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {(isLoading || isPending) ? (
          // Loading Skeleton
          [...Array(pageSize)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))
        ) : chats.length > 0 ? (
          // Chat List
          chats.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} />
          ))
        ) : (
          // No Results
          <div className="text-center text-muted-foreground pt-10">
            No chat history found{searchInputValue ? ` matching "${searchInputValue}"` : ''}.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalCount > 0 && !isLoading && !isPending && (
         <div className="flex justify-center items-center space-x-2 pt-4">
            <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
            >
                Previous
            </Button>
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
            >
                Next
            </Button>
         </div>
      )}
    </div>
  );
}