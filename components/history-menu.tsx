"use client"

import { History } from "lucide-react"
import Link from "next/link"
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import { getUserRecentChatsAction } from "@/db/actions/chat-actions";
// Remove unused useState import
import useSWR from 'swr'; // Import useSWR

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

// This component will now handle fetching its own data using SWR
export function HistoryMenu() {
  // Use SWR to fetch and manage history items
  const { data: historyItems, error, isLoading } = useSWR<HistoryDisplayItem[]>(
    SWR_KEY_RECENT_CHATS,
    fetcher
    // Optional SWR config can go here
  );

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
          <SidebarMenuSubItem>
            <span className="text-xs p-2">Loading...</span>
          </SidebarMenuSubItem>
        )}
        {error && ( // Display error message from SWR
          <SidebarMenuSubItem>
            <span className="text-xs p-2 text-red-500">Error: {error.message}</span>
          </SidebarMenuSubItem>
        )}
        {!isLoading && !error && (!historyItems || historyItems.length === 0) && ( // Check if historyItems is undefined or empty
            <SidebarMenuSubItem>
                 <span className="text-xs p-2">No history yet.</span>
            </SidebarMenuSubItem>
        )}
        {!isLoading && !error && historyItems && historyItems.map((item) => ( // Render items if data exists
          <SidebarMenuSubItem key={item.id}>
            <SidebarMenuSubButton asChild>
              <Link href={item.url} className="flex items-center justify-start">
                <span className="text-xs truncate">{item.title}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}
