"use client"

import { History } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getUserRecentChatsAction, deleteChatAction, renameChatAction } from "@/db/actions/chat-actions"
import useSWR, { useSWRConfig } from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { authClient } from '@/lib/auth-client'
import { toast } from "sonner"
import { HistoryItem } from './history-item'
import { ErrorBoundary } from './ui/error-boundary'

interface HistoryDisplayItem {
  id: string;
  title: string;
  url: string;
  agentSlug: string | null;
}

const SWR_KEY_RECENT_CHATS = 'userRecentChats';

const fetcher = async (): Promise<HistoryDisplayItem[]> => {
  const result = await getUserRecentChatsAction(5);
  if (result.success && result.data) {
    return result.data
      .filter(chat => chat.agentSlug)
      .map(chat => ({
        id: chat.id,
        title: chat.title,
        url: `/agent/${chat.agentSlug}/${chat.id}`,
        agentSlug: chat.agentSlug
      }));
  } else {
    throw new Error(result.message || 'Failed to fetch history');
  }
};

function HistoryMenuContent() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: historyItems, error, isLoading: historyLoading } = useSWR<HistoryDisplayItem[]>(
    !sessionPending && session ? SWR_KEY_RECENT_CHATS : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      keepPreviousData: true,
    }
  );
  
  const { mutate } = useSWRConfig();
  const pathname = usePathname();
  const router = useRouter();
  
  const [optimisticActiveUrl, setOptimisticActiveUrl] = useState<string | null>(null);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset optimistic state when pathname changes
  useEffect(() => {
    setOptimisticActiveUrl(null);
  }, [pathname]);

  // Memoized function to determine if item is active
  const isItemActive = useCallback((itemUrl: string) => {
    if (optimisticActiveUrl) {
      return optimisticActiveUrl === itemUrl;
    }
    return pathname === itemUrl;
  }, [optimisticActiveUrl, pathname]);

  // Optimized navigation handler
  const handleNavigate = useCallback((url: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOptimisticActiveUrl(url);
    router.push(url);
  }, [router]);

  // Optimized delete handler
  const handleDelete = useCallback((chatId: string) => {
    setChatToDeleteId(chatId);
    setIsConfirmDeleteDialogOpen(true);
  }, []);

  // Optimized rename handler
  const handleRename = useCallback(async (chatId: string, newTitle: string) => {
    const originalItems = historyItems ? [...historyItems] : [];
    const optimisticData = historyItems?.map(chat =>
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ) ?? [];
    
    mutate(SWR_KEY_RECENT_CHATS, optimisticData, false);

    try {
      const result = await renameChatAction({ chatId, newTitle });
      if (!result.success) {
        toast.error(result.message || "Failed to rename chat.");
        mutate(SWR_KEY_RECENT_CHATS, originalItems, false);
      } else {
        toast.success("Chat renamed.");
      }
    } catch (err: unknown) {
      console.error("Rename chat error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred while renaming.";
      toast.error(message);
      mutate(SWR_KEY_RECENT_CHATS, originalItems, false);
    }
  }, [historyItems, mutate]);

  // Optimized delete confirmation handler
  const handleConfirmDelete = useCallback(async () => {
    if (!chatToDeleteId) return;
    setIsDeleting(true);

    const originalItems = historyItems ? [...historyItems] : [];
    const optimisticData = historyItems?.filter(chat => chat.id !== chatToDeleteId) ?? [];
    mutate(SWR_KEY_RECENT_CHATS, optimisticData, false);

    try {
      const result = await deleteChatAction(chatToDeleteId);
      if (!result.success) {
        toast.error(result.message || "Failed to delete chat.");
        mutate(SWR_KEY_RECENT_CHATS, originalItems, false);
      } else {
        toast.success("Chat deleted.");
      }
    } catch (err: unknown) {
      console.error("Delete chat error:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred while deleting.";
      toast.error(message);
      mutate(SWR_KEY_RECENT_CHATS, originalItems, false);
    } finally {
      setIsConfirmDeleteDialogOpen(false);
      setChatToDeleteId(null);
      setIsDeleting(false);
    }
  }, [chatToDeleteId, historyItems, mutate]);

  // Memoized chat title for delete dialog
  const chatToDeleteTitle = useMemo(() => 
    historyItems?.find(chat => chat.id === chatToDeleteId)?.title || 'this chat',
    [historyItems, chatToDeleteId]
  );

  // Loading states
  if (sessionPending) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SidebarMenuSubItem><span className="text-xs p-2">Loading session...</span></SidebarMenuSubItem>
      </motion.div>
    );
  }

  if (!session) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SidebarMenuSubItem><span className="text-xs p-2">Sign in to view history.</span></SidebarMenuSubItem>
      </motion.div>
    );
  }

  if (historyLoading && !historyItems) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SidebarMenuSubItem><span className="text-xs p-2">Loading history...</span></SidebarMenuSubItem>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SidebarMenuSubItem><span className="text-xs p-2 text-red-500">Error: {error.message}</span></SidebarMenuSubItem>
      </motion.div>
    );
  }

  if (!historyItems || historyItems.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <SidebarMenuSubItem><span className="text-xs p-2">No history yet.</span></SidebarMenuSubItem>
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence mode="popLayout">
        {historyItems.map((item, index) => (
          <HistoryItem
            key={item.id}
            item={item}
            isActive={isItemActive(item.url)}
            index={index}
            onNavigate={handleNavigate}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        ))}
      </AnimatePresence>

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
            <AlertDialogCancel onClick={() => setChatToDeleteId(null)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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

export function HistoryMenu() {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip="History">
        <Link href="/history">
          <History size={18} />
          <span>History</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub>
        <ErrorBoundary>
          <HistoryMenuContent />
        </ErrorBoundary>
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}
