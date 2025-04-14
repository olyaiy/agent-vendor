"use client"

import { History } from "lucide-react"
import { usePathname, useRouter } from "next/navigation" // Add this import for URL awareness
import Link from "next/link"
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { getUserRecentChatsAction } from "@/db/actions/chat-actions";
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion'; // Import AnimatePresence
import { useState, useEffect } from 'react'; // Import useState for optimistic updates
import { authClient } from '@/lib/auth-client'; // Import authClient

// Interface for the data structure expected by the component's rendering logic
interface HistoryDisplayItem {
  id: string;
  title: string;
  url: string;
}

// Define the SWR key
const SWR_KEY_RECENT_CHATS = 'userRecentChats';

// Define the fetcher function for SWR
const fetcher = async (): Promise<HistoryDisplayItem[]> => {
  const result = await getUserRecentChatsAction(5); // Fetch last 5 chats
  if (result.success && result.data) {
    return result.data.map(chat => ({
      id: chat.id,
      title: chat.title,
      url: `/${chat.agentId}/${chat.id}` // Construct the URL
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
      revalidateOnReconnect: true
    }
  );
  
  // Get the current pathname and router
  const pathname = usePathname();
  const router = useRouter();
  
  // State for optimistic UI updates
  const [optimisticActiveUrl, setOptimisticActiveUrl] = useState<string | null>(null);
  
  // Synchronize optimistic state with actual pathname
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

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="History">
        <Link href="/history">
          <History size={18} />
          <span>History</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub>
        {/* Session Loading State */}
        {sessionPending && ( // Use sessionPending
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarMenuSubItem>
              <span className="text-xs p-2">Loading session...</span>
            </SidebarMenuSubItem>
          </motion.div>
        )}

        {/* Logged Out State */}
        {!sessionPending && !session && ( // Use sessionPending
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarMenuSubItem>
              <span className="text-xs p-2">Sign in to view history.</span>
            </SidebarMenuSubItem>
          </motion.div>
        )}

        {/* Logged In State - History Loading */}
        {!sessionPending && session && historyLoading && ( // Use sessionPending
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarMenuSubItem>
              <span className="text-xs p-2">Loading history...</span>
            </SidebarMenuSubItem>
          </motion.div>
        )}

        {/* Logged In State - History Error */}
        {!sessionPending && session && error && ( // Use sessionPending
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarMenuSubItem>
              <span className="text-xs p-2 text-red-500">Error: {error.message}</span>
            </SidebarMenuSubItem>
          </motion.div>
        )}

        {/* Logged In State - No History */}
        {!sessionPending && session && !historyLoading && !error && (!historyItems || historyItems.length === 0) && ( // Use sessionPending
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarMenuSubItem>
              <span className="text-xs p-2">No history yet.</span>
            </SidebarMenuSubItem>
          </motion.div>
        )}

        {/* Logged In State - History Items */}
        <AnimatePresence mode="popLayout">
          {!sessionPending && session && !historyLoading && !error && historyItems && historyItems.map((item, index) => { // Use sessionPending
            // Determine if this chat is active using the helper function
            const isActive = isItemActive(item.url);

            return (
            <motion.div
              key={item.id}
              custom={index}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={listItemVariants}
              transition={{
                delay: index * 0.05, // Stagger effect
                duration: 0.35,
              }}
              layout
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.15 }
              }}
            >
              <SidebarMenuSubItem>
                {/* Apply active styling conditionally */}
                <SidebarMenuSubButton asChild className={isActive ? 'bg-slate-800/50' : ''}>
                  <a
                    href={item.url}
                    className={`flex items-center justify-start ${isActive ? 'text-white font-medium' : ''}`}
                    onClick={(e) => handleHistoryItemClick(item.url, e)}
                  >
                    <span className="text-xs truncate">{item.title}</span>
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </motion.div>
          )})}
        </AnimatePresence>
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}
