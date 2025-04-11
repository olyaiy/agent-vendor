"use client"

import { History, PlusCircle } from "lucide-react"
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
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

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
  const { data: historyItems, error, isLoading, mutate } = useSWR<HistoryDisplayItem[]>(
    SWR_KEY_RECENT_CHATS,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );
  
  // Get the current pathname to determine active chat
  const pathname = usePathname();
  
  // State to track if we're in development mode
  const [isDev] = useState(() => process.env.NODE_ENV === 'development');
  
  // Function to add a test item for animation testing
  const addTestItem = useCallback(() => {
    if (!historyItems) return;
    
    // Create a temporary mock item
    const mockItem: HistoryDisplayItem = {
      id: `test-${Date.now()}`,
      title: `Test Chat ${new Date().toLocaleTimeString()}`,
      url: '#test-animation'
    };
    
    // Add the mock item to the beginning of the list
    const updatedItems = [mockItem, ...historyItems];
    
    // Update the list with the new mock item
    mutate(updatedItems, false);
    
    // Remove the mock item after 5 seconds
    setTimeout(() => {
      mutate(historyItems, false);
    }, 5000);
  }, [historyItems, mutate]);

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
        
        {/* Development-only test button */}
        {isDev && (
          <div className="mt-4 px-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addTestItem}
              className="w-full text-xs h-7 bg-slate-800/30 border-dashed border-slate-700"
            >
              <PlusCircle size={12} className="mr-1" />
              Test Animation
            </Button>
            <div className="text-[10px] text-slate-500 mt-1 text-center">
              Dev-only: Adds temporary mock item
            </div>
          </div>
        )}
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}
