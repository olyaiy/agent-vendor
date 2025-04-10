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
import { getUserRecentChatsAction } from "@/db/actions/chat-actions"
import { useEffect, useState } from "react";

// Interface for the data structure expected by the component's rendering logic
interface HistoryDisplayItem {
  id: string;
  title: string;
  url: string;
}

// This component will now handle fetching its own data
export function HistoryMenu() {
  // State to hold the fetched history items
  const [historyItems, setHistoryItems] = useState<HistoryDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserRecentChatsAction(5); // Fetch last 5 chats
        if (result.success && result.data) {
          const formattedItems = result.data.map(chat => ({
            id: chat.id,
            title: chat.title,
            url: `/chat/${chat.id}` // Construct the URL
          }));
          setHistoryItems(formattedItems);
        } else {
          throw new Error(result.message || 'Failed to fetch history');
        }
      } catch (err) {
        console.error("Error fetching history:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, []); // Empty dependency array ensures this runs once on mount


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
        {error && (
          <SidebarMenuSubItem>
            <span className="text-xs p-2 text-red-500">Error: {error}</span>
          </SidebarMenuSubItem>
        )}
        {!isLoading && !error && historyItems.length === 0 && (
            <SidebarMenuSubItem>
                 <span className="text-xs p-2">No history yet.</span>
            </SidebarMenuSubItem>
        )}
        {!isLoading && !error && historyItems.map((item) => (
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