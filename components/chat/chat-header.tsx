'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/util/icons';
import { useSidebar } from '@/components/ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VisibilityType, VisibilitySelector } from '@/components/util/visibility-selector';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  agentId,
  agent_display_name,
  thumbnail_url,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  agentId: string;
  agent_display_name?: string;
  thumbnail_url?: string | null;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 768;

  const SettingsIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EllipsisIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-4 gap-2 z-50">
      {/* Left side: Sidebar toggle and Logo (when collapsed) */}
      <div className="flex items-center">
        {(!open || windowWidth < 768) && <SidebarToggle />}
        {!open && <Logo className="ml-2" spanClassName={isMobile ? "text-sm" : "text-base"} />}
      </div>
      
      {/* Right side: All other elements aligned to the right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 md:h-8 shrink-0"
                  onClick={() => {
                    router.push(`/${agentId}`);
                    router.refresh();
                  }}
                >
                  <PlusIcon size={8} /> New Chat
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">New Chat</TooltipContent>
            </Tooltip>

            {!isReadonly && (
              <VisibilitySelector
                chatId={chatId}
                selectedVisibilityType={selectedVisibilityType}
                className="shrink-0"
              />
            )}

            {!isReadonly && (
              <div className="shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 md:h-9 min-w-10 md:px-3 flex items-center justify-center gap-2"
                      asChild
                    >
                      <Link href={`/agents/${agentId}/edit`} className="flex items-center gap-2">
                        <Avatar className="size-6 border border-border relative">
                          {thumbnail_url ? (
                            <div className="w-8 h-8 relative overflow-hidden rounded-full">
                              <Image
                                src={thumbnail_url}
                                alt={agent_display_name || "Agent"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <AvatarFallback className="text-xs">{agent_display_name?.charAt(0) || "A"}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="font-medium text-sm hidden md:inline-block">
                          {agent_display_name || "Agent"}
                        </span>
                        <SettingsIcon />
                        <span className="sr-only">Agent Settings</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Agent Settings</TooltipContent>
                </Tooltip>
              </div>
            )}
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <>
            {!isReadonly && (
              <Button 
                onClick={() => {
                  router.push(`/${agentId}`);
                  router.refresh();
                }}
                variant="outline"
                className="h-8"
              >
                <div className="flex items-center">
                  <PlusIcon size={8} /> 
                  <span className="ml-2">New Chat</span>
                </div>
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <EllipsisIcon />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                
                
                {!isReadonly && (
                  <DropdownMenuItem asChild>
                    <Link href={`/agents/${agentId}/edit`} className="flex items-center">
                      <Avatar className="size-4 border border-border relative mr-2">
                        {thumbnail_url ? (
                          <div className="w-8 h-8 relative overflow-hidden rounded-full mr-2 flex-shrink-0">
                            <Image
                              src={thumbnail_url}
                              alt={agent_display_name || "Agent"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <AvatarFallback className="text-xs">{agent_display_name?.charAt(0) || "A"}</AvatarFallback>
                        )}
                      </Avatar>
                      <span>Agent Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                
                {!isReadonly && (
                  <DropdownMenuItem className="p-0">
                    <div className="w-full">
                      <VisibilitySelector
                        chatId={chatId}
                        selectedVisibilityType={selectedVisibilityType}
                        className="w-full"
                      />
                    </div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId && 
         prevProps.agent_display_name === nextProps.agent_display_name &&
         prevProps.thumbnail_url === nextProps.thumbnail_url;
});
