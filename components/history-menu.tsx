"use client"

import { History } from "lucide-react"
import { usePathname } from "next/navigation" // Add this import for URL awareness
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
  // Use SWR to fetch and manage history items
  const { data: historyItems, error, isLoading } = useSWR<HistoryDisplayItem[]>(
    SWR_KEY_RECENT_CHATS,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  // Get the current pathname to determine active chat
  const pathname = usePathname();
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="History">
        <Link href="/history">
          <History size={18} />
          <span>History</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <SidebarMenuSubItem>
              <span className="text-xs p-2">Loading...</span>
            </SidebarMenuSubItem>
          </motion.div>
        )}
        {error && (
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
        {!isLoading && !error && (!historyItems || historyItems.length === 0) && (
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
        <AnimatePresence mode="popLayout">
          {!isLoading && !error && historyItems && historyItems.map((item, index) => {
            // Determine if this chat is active
            const isActive = pathname === item.url;
            
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
                  <Link
                    href={item.url}
                    className={`flex items-center justify-start ${isActive ? 'text-white font-medium' : ''}`}
                  >
                    <span className="text-xs truncate">{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </motion.div>
          )})}
        </AnimatePresence>
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}
