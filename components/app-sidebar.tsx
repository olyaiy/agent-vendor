'use client';

import type { User } from 'next-auth';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { HistoryIcon, PlusIcon } from 'lucide-react';
import { SidebarHistory } from './layout/sidebar-history';

import { cn } from '@/lib/utils';
import { Separator } from '@radix-ui/react-separator';
import { SidebarToggle } from './layout/sidebar-toggle';
import useSWR from 'swr';
import { Logo } from './logo';
import { UserNav } from './layout/sidebar-user-nav';
import { useEffect, useState } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Function to get the most recent agent ID from cookies
function getMostRecentAgentId(defaultAgentId: string): string {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') return defaultAgentId;
  
  // Get recent agents from cookie
  const recentAgentsCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('recent-agents='));
  
  if (!recentAgentsCookie) return defaultAgentId;
  
  // Parse the cookie value to get the array of agent IDs
  const recentAgentIds = recentAgentsCookie.split('=')[1].split(',');
  
  // Return the first/most recent agent ID, or fall back to default
  return recentAgentIds.length > 0 ? recentAgentIds[0] : defaultAgentId;
}

export function AppSidebar({ user: initialUser }: { user: User | undefined | null }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const params = useParams();
  const pathname = usePathname();
  const defaultAgentId = typeof params.agentId === 'string' ? params.agentId : '5a2c146b-7017-4deb-8b76-ff1034c11ba7';
  const [mostRecentAgentId, setMostRecentAgentId] = useState<string>(defaultAgentId);
  const chatId = params['chat-id'] as string | undefined;
  const isHistoryPage = pathname === '/chats';

  // Use SWR to fetch and keep user data updated
  const { data: userData } = useSWR<User | null>('/api/user', fetcher, {
    fallbackData: initialUser || null,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  // Use the SWR data or fall back to the initial user prop
  const user = userData || initialUser;
  
  // Update the most recent agent ID on component mount and when pathname changes
  useEffect(() => {
    setMostRecentAgentId(getMostRecentAgentId(defaultAgentId));
  }, [defaultAgentId, pathname]);

  // Function to handle the new chat button click
  const handleNewChatClick = () => {
    setOpenMobile(false);
    
    // Get current agent ID from URL path when not on history/edit pages
    const currentAgentId = pathname.split('/')[1]; // Extract from URL like /[agentId]

    if (currentAgentId && !isHistoryPage && !pathname.includes('/edit')) {
      // Navigate to current agent's chat page
      router.push(`/${currentAgentId}`);
    } else if (pathname.includes('/agents/') && pathname.includes('/edit')) {
      // Existing edit page handling
      const agentIdMatch = pathname.match(/\/agents\/([^\/]+)\/edit/);
      router.push(`/${agentIdMatch?.[1] || mostRecentAgentId}`);
    } else {
      // Use the most recent agent instead of the default one
      router.push(`/${mostRecentAgentId}`);
    }
    
    router.refresh();
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader className="p-2 my-2">
        <SidebarMenu>
          <div className="absolute top-4 right-2 aspect-square">
            <SidebarToggle />
          </div>
          <div className="flex my-0 flex-row justify-between items-center">
            <Logo />
          </div>
          <Separator className="my-1 bg-primary/10   h-px rounded-full" />
        </SidebarMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={`/${mostRecentAgentId}`}
              className={cn(
                "w-full flex items-center justify-start gap-2 h-10 px-2 text-sm",
                isHistoryPage && "bg-muted border-primary/50 text-primary",
                "hover:bg-accent hover:text-accent-foreground",
                "rounded-md text-sm font-medium transition-colors"
              )}
              onClick={() => {
                setOpenMobile(false);
                router.refresh();
              }}
            >
              New Chat
              <PlusIcon size={16} />
            </Link>
          </TooltipTrigger>
          <TooltipContent align="end">New Chat</TooltipContent>
        </Tooltip>
        
        
      </SidebarHeader>
      <SidebarContent className="custom-sidebar-scrollbar">
        <SidebarHistory user={user} currentConversationId={chatId} />
        {user && (
          <div className="px-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start gap-2 h-8 px-2 text-sm ",
                    isHistoryPage && "bg-background border-primary/50 text-primary hover:bg-muted"
                  )}
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/chats');
                  }}
                >
                  <HistoryIcon size={14} />
                  <span>View All Chats</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">All Conversations</TooltipContent>
            </Tooltip>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter><UserNav variant="sidebar" user={user} /></SidebarFooter>
    </Sidebar>
  );
}
