"use client"

import { History, MoreHorizontal, Check, X } from "lucide-react" // Added MoreHorizontal, Check, X
import { usePathname, useRouter } from "next/navigation" // Add this import for URL awareness
import Link from "next/link"
import { Input } from "@/components/ui/input" // Added Input
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover" // Added Popover
import { Button } from "@/components/ui/button" // Added Button
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog" // Added AlertDialog components
import { getUserRecentChatsAction, deleteChatAction, renameChatAction } from "@/db/actions/chat-actions"; // Added deleteChatAction, renameChatAction
import useSWR, { useSWRConfig } from 'swr'; // Added useSWRConfig
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { useState, useEffect } from 'react'; // Import useState for optimistic updates
import { authClient } from '@/lib/auth-client'; // Import authClient
import { toast } from "sonner"; // Assuming sonner for toasts

// Interface for the data structure expected by the component's rendering logic
interface HistoryDisplayItem {
  id: string;
  title: string;
  url: string;
  agentSlug: string | null; // Add agentSlug
}

// Define the SWR key
const SWR_KEY_RECENT_CHATS = 'userRecentChats';

// Define the fetcher function for SWR
const fetcher = async (): Promise<HistoryDisplayItem[]> => {
  const result = await getUserRecentChatsAction(5); // Fetch last 5 chats
  if (result.success && result.data) {
    // Map the data, constructing the new URL format
    return result.data
      .filter(chat => chat.agentSlug) // Filter out chats without a slug (shouldn't happen ideally)
      .map(chat => ({
        id: chat.id,
        title: chat.title,
        // Construct the URL using agentSlug and chatId
        url: `/agent/${chat.agentSlug}/${chat.id}`,
        agentSlug: chat.agentSlug // Keep slug if needed elsewhere, though url is primary use
      }));
  } else {
    // Throw an error if fetching failed or data is missing
    throw new Error(result.message || 'Failed to fetch history');
  }
};

// Animation variants for list items
const listItemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0, 
    y: -8, 
    scale: 0.95,
    transition: { 
      duration: 0.2 
    }
  }
};

// This component will now handle fetching its own data using SWR
export function HistoryMenu() {
  // Get session state
  const { data: session, isPending: sessionPending } = authClient.useSession(); // Use isPending

  // Use SWR to fetch and manage history items, conditional on session
  const { data: historyItems, error, isLoading: historyLoading } = useSWR<HistoryDisplayItem[]>(
    // Only fetch if session exists and is loaded
    !sessionPending && session ? SWR_KEY_RECENT_CHATS : null, // Use sessionPending
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Keep previous data visible while loading new data after a mutation/revalidation
      keepPreviousData: true,
    }
  );
  
  const { mutate } = useSWRConfig(); // For SWR cache mutations
  const pathname = usePathname();
  const router = useRouter();
  
  // State for optimistic UI updates for active item
  const [optimisticActiveUrl, setOptimisticActiveUrl] = useState<string | null>(null);
  
  // States for delete functionality
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename states (for inline editing)
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);

  // Synchronize optimistic active URL state with actual pathname
  useEffect(() => {
    // When pathname changes, reset the optimistic state
    setOptimisticActiveUrl(null);
  }, [pathname]);
  
  // Handle click on history item for optimistic updates
  const handleHistoryItemClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default navigation
    
    // Set optimistic state immediately
    setOptimisticActiveUrl(url);
    
    // Manually navigate using router
    router.push(url);
  };
  
  // Helper function to determine if an item is active
  const isItemActive = (itemUrl: string) => {
    if (optimisticActiveUrl) {
      return optimisticActiveUrl === itemUrl;
    }
    return pathname === itemUrl;
  };

  const handleDeleteChat = async () => {
    if (!chatToDeleteId) return;
    setIsDeleting(true);

    const originalItems = historyItems ? [...historyItems] : [];
    const optimisticData = historyItems?.filter(chat => chat.id !== chatToDeleteId) ?? [];
    mutate(SWR_KEY_RECENT_CHATS, optimisticData, false);

    try {
      const result = await deleteChatAction(chatToDeleteId);
      if (!result.success) {
        toast.error(result.message || "Failed to delete chat.");
        mutate(SWR_KEY_RECENT_CHATS, originalItems, false); // Revert
      } else {
        toast.success("Chat deleted.");
      }
    } catch (err: unknown) {
      console.error("Delete chat error:", err);
      let message = "An unexpected error occurred while deleting.";
      if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
      mutate(SWR_KEY_RECENT_CHATS, originalItems, false); // Revert
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setChatToDeleteId(null);
      setIsDeleting(false);
      setHoveredItemId(null);
      if (editingChatId === chatToDeleteId) { // If deleting the item being edited
        setEditingChatId(null);
        setInlineEditValue('');
      }
    }
  };

  const handleSaveRename = async (chatId: string, originalTitle: string) => {
    const trimmedTitle = inlineEditValue.trim();

    if (trimmedTitle === originalTitle) {
      setEditingChatId(null);
      setInlineEditValue('');
      return;
    }
    if (!trimmedTitle) {
      toast.error("Title cannot be empty.");
      return;
    }
    if (trimmedTitle.length > 100) {
      toast.error("Title cannot exceed 100 characters.");
      return;
    }

    setIsSubmittingRename(true);
    const originalItems = historyItems ? [...historyItems] : [];
    const optimisticData = historyItems?.map(chat =>
      chat.id === chatId ? { ...chat, title: trimmedTitle, url: chat.url } : chat // Ensure URL is preserved
    ) ?? [];
    mutate(SWR_KEY_RECENT_CHATS, optimisticData, false);

    try {
      const result = await renameChatAction({ chatId, newTitle: trimmedTitle });
      if (!result.success) {
        toast.error(result.message || "Failed to rename chat.");
        mutate(SWR_KEY_RECENT_CHATS, originalItems, false); // Revert
      } else {
        toast.success("Chat renamed.");
        // If the currently active chat was renamed, we might need to update the URL or optimisticActiveUrl
        // For now, SWR will handle data re-sync. If URL changes based on title, more logic needed.
        if (pathname.includes(chatId) && result.updatedChat) {
             // Potentially update optimisticActiveUrl if title affects URL generation,
             // but current URL structure is /agent/{agentSlug}/{chatId} so title change doesn't affect it.
        }
      }
    } catch (err: unknown) {
      console.error("Rename chat error:", err);
      let message = "An unexpected error occurred while renaming.";
      if (err instanceof Error) {
        message = err.message;
      }
      toast.error(message);
      mutate(SWR_KEY_RECENT_CHATS, originalItems, false); // Revert
    } finally {
      setEditingChatId(null);
      setIsSubmittingRename(false);
      setInlineEditValue('');
    }
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setInlineEditValue('');
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="History">
          <Link href="/history">
            <History size={18} />
            <span>History</span>
          </Link>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {/* Session Loading State */}
          {sessionPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <SidebarMenuSubItem><span className="text-xs p-2">Loading session...</span></SidebarMenuSubItem>
            </motion.div>
          )}

          {/* Logged Out State */}
          {!sessionPending && !session && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <SidebarMenuSubItem><span className="text-xs p-2">Sign in to view history.</span></SidebarMenuSubItem>
            </motion.div>
          )}

          {/* Logged In State - History Loading */}
          {!sessionPending && session && historyLoading && !historyItems && ( // Show loading only if no items yet
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <SidebarMenuSubItem><span className="text-xs p-2">Loading history...</span></SidebarMenuSubItem>
            </motion.div>
          )}

          {/* Logged In State - History Error */}
          {!sessionPending && session && error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <SidebarMenuSubItem><span className="text-xs p-2 text-red-500">Error: {error.message}</span></SidebarMenuSubItem>
            </motion.div>
          )}

          {/* Logged In State - No History */}
          {!sessionPending && session && !historyLoading && !error && (!historyItems || historyItems.length === 0) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <SidebarMenuSubItem><span className="text-xs p-2">No history yet.</span></SidebarMenuSubItem>
            </motion.div>
          )}

          {/* Logged In State - History Items */}
          <AnimatePresence mode="popLayout">
            {!sessionPending && session && !error && historyItems && historyItems.map((item, index) => {
              const isActive = isItemActive(item.url);
              const isHovered = hoveredItemId === item.id;

              return (
              <motion.div
                key={item.id}
                custom={index}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={listItemVariants}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                layout
                onMouseEnter={() => { if (!editingChatId) setHoveredItemId(item.id);}}
                onMouseLeave={() => { if (!editingChatId) setHoveredItemId(null);}}
                className="relative group"
              >
                <SidebarMenuSubItem className="p-0">
                  <div className="flex items-center justify-between w-full min-h-[30px]"> {/* Ensure consistent height */}
                    {editingChatId === item.id ? (
                      // Inline Edit View
                      <div className="flex items-center w-full px-1.5 py-0.5"> {/* Adjusted padding for input */}
                        <Input
                          type="text"
                          value={inlineEditValue}
                          onChange={(e) => setInlineEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault(); // Prevent form submission if wrapped
                              handleSaveRename(item.id, item.title);
                            }
                            if (e.key === 'Escape') handleCancelRename();
                          }}
                          className="text-xs h-[26px] flex-grow mr-1 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 bg-transparent border-slate-600 hover:border-slate-500 focus:border-slate-400"
                          autoFocus
                          disabled={isSubmittingRename}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0.5 text-green-500 hover:text-green-400 disabled:text-muted-foreground"
                          onClick={() => handleSaveRename(item.id, item.title)}
                          disabled={isSubmittingRename || !inlineEditValue.trim() || inlineEditValue === item.title || inlineEditValue.length > 100}
                        >
                          <Check size={15} />
                          <span className="sr-only">Save</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0.5 text-red-500 hover:text-red-400 disabled:text-muted-foreground"
                          onClick={handleCancelRename}
                          disabled={isSubmittingRename}
                        >
                          <X size={15} />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </div>
                    ) : (
                      // Default Display View
                      <SidebarMenuSubButton
                        asChild
                        className={`flex-grow ${isActive ? 'bg-slate-800/50' : ''} ${isHovered && !editingChatId ? 'pr-7' : ''}`} // Space for 3-dot menu
                      >
                        <a
                          href={item.url}
                          className={`flex items-center justify-start w-full text-left py-1.5 px-2 ${isActive ? 'text-white font-medium' : ''}`}
                          onClick={(e) => handleHistoryItemClick(item.url, e)}
                        >
                          <span className="text-xs truncate" title={item.title}>{item.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    )}

                    {/* 3-Dot Menu (visible on hover AND not editing this item) */}
                    <AnimatePresence>
                    {isHovered && editingChatId !== item.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center" // Adjusted right positioning
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Popover onOpenChange={(open) => {
                           if (!open && isHovered && editingChatId !== item.id) {
                             // If popover closes and still hovering this item (and not editing), keep hover active
                           } else if (!open) {
                             setHoveredItemId(null); // Clear hover if popover closes for any other reason
                           }
                        }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0.5 text-muted-foreground hover:text-foreground data-[state=open]:bg-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal size={15} />
                              <span className="sr-only">Options for {item.title}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-1" // Adjusted width to auto for content
                            side="right"
                            align="start"
                            sideOffset={5}
                            onClick={(e) => e.stopPropagation()} // Prevent closing history dropdown
                          >
                            <Button // Rename Button
                              variant="ghost"
                              className="w-full h-auto text-sm justify-start px-2 py-1.5 text-foreground hover:bg-accent focus-visible:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent popover from closing if it's set to close on content click
                                setEditingChatId(item.id);
                                setInlineEditValue(item.title);
                                // Popover remains open as per user request
                              }}
                            >
                              Rename
                            </Button>
                            <Button // Delete Button
                              variant="ghost"
                              className="w-full h-auto text-sm justify-start px-2 py-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/10 focus-visible:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatToDeleteId(item.id);
                                setIsConfirmDeleteDialogOpen(true);
                              }}
                            >
                              Delete
                            </Button>
                          </PopoverContent>
                        </Popover>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </SidebarMenuSubItem>
              </motion.div>
            )})}
          </AnimatePresence>
        </SidebarMenuSub>
      </SidebarMenuItem>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chat
              &ldquo;{historyItems?.find(chat => chat.id === chatToDeleteId)?.title || 'this chat'}&rdquo;
              and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDeleteId(null)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 text-red-foreground hover:bg-red-700 focus-visible:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
