"use client"

import { History, MoreHorizontal } from "lucide-react" // Added MoreHorizontal
import { usePathname, useRouter } from "next/navigation" // Add this import for URL awareness
import Link from "next/link"
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
import { getUserRecentChatsAction, deleteChatAction } from "@/db/actions/chat-actions"; // Added deleteChatAction
import useSWR, { useSWRConfig } from 'swr'; // Added useSWRConfig
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { useState, useEffect } from 'react'; // Import useState for optimistic updates
import { authClient } from '@/lib/auth-client'; // Import authClient
// TODO: Consider adding a toast notification for errors, e.g., import { toast } from "sonner";

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
  const [isDeleting, setIsDeleting] = useState(false); // To disable delete button during operation

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

    // Optimistic update
    const optimisticData = historyItems?.filter(chat => chat.id !== chatToDeleteId) ?? [];
    mutate(SWR_KEY_RECENT_CHATS, optimisticData, false); // false means don't revalidate yet

    try {
      const result = await deleteChatAction(chatToDeleteId);
      if (!result.success) {
        // Revert optimistic update on failure and revalidate
        // toast.error(result.message || "Failed to delete chat."); // Example toast
        console.error("Failed to delete chat:", result.message);
        mutate(SWR_KEY_RECENT_CHATS); // Revalidate to get actual server state
      } else {
        // On success, the optimistic update is good.
        // SWR will revalidate based on its config (e.g., on focus, interval)
        // Or you can explicitly revalidate if desired: mutate(SWR_KEY_RECENT_CHATS);
        // toast.success("Chat deleted successfully."); // Example toast
      }
    } catch (err) {
      // Handle network or unexpected errors
      // toast.error("An unexpected error occurred."); // Example toast
      console.error("Error during deleteChatAction:", err);
      mutate(SWR_KEY_RECENT_CHATS); // Revalidate
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setChatToDeleteId(null);
      setIsDeleting(false);
      setHoveredItemId(null); // Ensure hover state is cleared
    }
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
                onMouseEnter={() => setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className="relative group" // Added group for potential group-hover styling
              >
                <SidebarMenuSubItem className="p-0"> {/* Remove padding from SubItem if Button takes full space */}
                  <div className="flex items-center justify-between w-full">
                    <SidebarMenuSubButton
                      asChild
                      className={`flex-grow ${isActive ? 'bg-slate-800/50' : ''} ${isHovered ? 'pr-8' : ''}`} // Add paddingRight if hovered to make space for icon
                      // Reset padding if using a full-width button inside
                    >
                      <a
                        href={item.url}
                        className={`flex items-center justify-start w-full text-left py-1.5 px-2 ${isActive ? 'text-white font-medium' : ''}`}
                        onClick={(e) => handleHistoryItemClick(item.url, e)}
                      >
                        <span className="text-xs truncate">{item.title}</span>
                      </a>
                    </SidebarMenuSubButton>

                    {/* 3-Dot Menu and Popover (visible on hover or if popover is open) */}
                    <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center"
                        onClick={(e) => e.stopPropagation()} // Prevent click on parent link
                      >
                        <Popover onOpenChange={(open) => {
                          // If popover is closing, ensure hover state is also cleared if mouse left
                          if (!open && !isHovered) setHoveredItemId(null);
                        }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0.5 text-muted-foreground hover:text-foreground data-[state=open]:bg-slate-700"
                              onClick={(e) => {
                                e.stopPropagation(); // Keep this to prevent unintended side-effects like navigation
                                // e.preventDefault(); // REMOVED: Radix PopoverTrigger needs default behavior to open
                              }}
                            >
                              <MoreHorizontal size={15} />
                              <span className="sr-only">Chat options for {item.title}</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-40 p-1"
                            side="right"
                            align="start"
                            sideOffset={5}
                            onClick={(e) => e.stopPropagation()} // Prevent closing history dropdown
                          >
                            <Button
                              variant="ghost"
                              className="w-full h-auto text-sm justify-start px-2 py-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 focus-visible:bg-red-500/10 focus-visible:text-red-400"
                              onClick={() => {
                                setChatToDeleteId(item.id);
                                setIsConfirmDeleteDialogOpen(true);
                              }}
                            >
                              Delete Chat
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
