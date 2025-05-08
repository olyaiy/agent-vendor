'use client';

import { useState, useEffect, useCallback, useTransition, useRef } from 'react'; // Added useRef
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // For delete confirmation
import { toast } from "sonner"; // For notifications
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import { getUserChatsAction, deleteChatAction, renameChatAction } from '@/db/actions/chat-actions'; // Added delete & rename
import { ChatListItem } from '@/components/chat/chat-list-item';
import type { Chat } from '@/db/schema/chat';

// Define the type for the chat data we expect from the action
// Define the type for the chat data we expect from the action, including agentSlug and last message details
type ChatHistoryItem = Pick<Chat, 'id' | 'title' | 'createdAt' | 'agentId'> & {
  agentSlug: string | null; // Add agentSlug
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
  const [searchInputValue, setSearchInputValue] = useState<string>(initialQuery ?? '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // States for inline editing and deleting
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');
  const [isSubmittingRename, setIsSubmittingRename] = useState<false>(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  const [chatToDeleteTitle, setChatToDeleteTitle] = useState<string>(''); // For dialog
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<false>(false);
  
  // Ref to store original chats before optimistic update for potential revert
  const originalChatsRef = useRef<ChatHistoryItem[]>(initialChats);

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

  // Store original chats before optimistic updates
  useEffect(() => {
    originalChatsRef.current = chats;
  }, [chats]);

  const handleDeleteRequest = (chatId: string, title: string) => {
    setChatToDeleteId(chatId);
    setChatToDeleteTitle(title);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDeleteId) return;
    setIsDeleting(true);

    const optimisticChats = chats.filter(c => c.id !== chatToDeleteId);
    const oldTotalCount = totalCount;
    setChats(optimisticChats);
    setTotalCount(prev => prev -1);

    try {
      const result = await deleteChatAction(chatToDeleteId);
      if (!result.success) {
        toast.error(result.message || "Failed to delete chat.");
        setChats(originalChatsRef.current); // Revert
        setTotalCount(oldTotalCount); // Revert
      } else {
        toast.success(`Chat "${chatToDeleteTitle}" deleted.`);
        // If current page becomes empty and it's not page 1, go to previous page
        if (optimisticChats.length === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1); // This will trigger useEffect to fetch
        } else {
          // Re-fetch current page to ensure consistency, especially if last item on last page deleted
           fetchChats(debouncedSearchQuery, currentPage);
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
      setChats(originalChatsRef.current); // Revert
      setTotalCount(oldTotalCount); // Revert
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setChatToDeleteId(null);
      setChatToDeleteTitle('');
      setIsDeleting(false);
    }
  };

  const handleRenameRequest = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setInlineEditValue(currentTitle);
  };

  const handleInlineEditChange = (value: string) => {
    setInlineEditValue(value);
  };

  const handleSaveRename = async () => {
    if (!editingChatId || !inlineEditValue.trim()) return;
    const originalTitle = chats.find(c => c.id === editingChatId)?.title || '';
    const newTitle = inlineEditValue.trim();

    if (newTitle === originalTitle) {
      setEditingChatId(null);
      return;
    }
    if (newTitle.length > 100) {
      toast.error("Title cannot exceed 100 characters.");
      return;
    }

    setIsSubmittingRename(true);
    const optimisticChats = chats.map(c =>
      c.id === editingChatId ? { ...c, title: newTitle } : c
    );
    setChats(optimisticChats);

    try {
      const result = await renameChatAction({ chatId: editingChatId, newTitle });
      if (!result.success) {
        toast.error(result.message || "Failed to rename chat.");
        setChats(originalChatsRef.current); // Revert
      } else {
        toast.success(`Chat renamed to "${newTitle}".`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
      setChats(originalChatsRef.current); // Revert
    } finally {
      setEditingChatId(null);
      setIsSubmittingRename(false);
    }
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setInlineEditValue('');
  };


  return (
    <>
      <div className="flex flex-col h-full p-4 md:p-6 space-y-4">
        {/* Search Input */}
        <Input
          placeholder="Search chat titles and messages..."
          value={searchInputValue}
          onChange={(e) => setSearchInputValue(e.target.value)}
          className="max-w-lg"
        />

        {/* Pagination Controls (Top) */}
        {totalCount > 0 && !isLoading && !isPending && (
          <div className="flex justify-center items-center space-x-2 pt-4">
            <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" onClick={handleNextPage} disabled={currentPage >= totalPages}>Next</Button>
          </div>
        )}

        {/* Chat List Area */}
        <div className="flex-1 overflow-y-auto space-y-0"> {/* Changed space-y-3 to space-y-0 as ChatListItem has border-b */}
          {(isLoading || isPending) ? (
            [...Array(pageSize)].map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" /> // Adjusted skeleton height
            ))
          ) : chats.length > 0 ? (
            chats.map((chat) => {
              const isEditingThisItem = editingChatId === chat.id;
              return (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  onDeleteRequest={handleDeleteRequest}
                  onRenameRequest={handleRenameRequest}
                  isEditingThisItem={isEditingThisItem}
                  currentEditValue={isEditingThisItem ? inlineEditValue : chat.title} // Pass current title if not editing for initial display in input
                  onEditValueChange={handleInlineEditChange}
                  onSaveEdit={handleSaveRename} // This will use editingChatId from state
                  onCancelEdit={handleCancelRename}
                  isSubmittingEdit={isSubmittingRename && isEditingThisItem}
                />
              );
            })
          ) : (
            <div className="text-center text-muted-foreground pt-10">
              No chat history found{searchInputValue ? ` matching "${searchInputValue}"` : ''}.
            </div>
          )}
        </div>

        {/* Pagination Controls (Bottom) */}
        {totalCount > 0 && !isLoading && !isPending && (
          <div className="flex justify-center items-center space-x-2 pt-4">
            <Button variant="outline" onClick={handlePreviousPage} disabled={currentPage <= 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" onClick={handleNextPage} disabled={currentPage >= totalPages}>Next</Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chat
              &ldquo;{chatToDeleteTitle}&rdquo; and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 text-red-foreground hover:bg-red-700 focus-visible:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}