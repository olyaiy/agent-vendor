'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

// Define the GroupChat type based on what we get from the repository
interface GroupChatAgent {
  agentId: string;
  agentName: string | null;
  thumbnailUrl: string | null;
}

interface GroupChat {
  id: string;
  title: string;
  createdAt: Date;
  visibility: 'public' | 'private' | 'link';
  agents: GroupChatAgent[];
}

interface GroupChatsCarouselProps {
  groupChats: GroupChat[];
}

export function GroupChatsCarousel({ groupChats }: GroupChatsCarouselProps) {
  // State for current page
  const [currentPage, setCurrentPage] = useState(0);
  
  // If no group chats, don't render this component
  if (!groupChats.length) return null;
  
  // Items per page
  const ITEMS_PER_PAGE = 4;
  
  // Calculate total pages
  const totalPages = Math.ceil(groupChats.length / ITEMS_PER_PAGE);

  // Calculate visible group chats for current page
  const visibleGroupChats = groupChats.slice(
    currentPage * ITEMS_PER_PAGE, 
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Navigate to previous page
  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };

  // Navigate to next page
  const goToNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : prev));
  };

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">👥 My Group Chats</h2>
        
        <div className="hidden sm:flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPrevPage} 
            disabled={currentPage === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextPage} 
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile: Horizontal scrollable row */}
      <div className="sm:hidden overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex gap-4 w-max">
          {groupChats.map((groupChat) => (
            <div key={groupChat.id} className="w-[250px] flex-shrink-0">
              <GroupChatCard groupChat={groupChat} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid with pagination */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleGroupChats.map((groupChat) => (
          <div key={groupChat.id}>
            <GroupChatCard groupChat={groupChat} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupChatCard({ groupChat }: { groupChat: GroupChat }) {
  const { id, title, agents } = groupChat;
  const formattedDate = new Date(groupChat.createdAt).toLocaleDateString();
  
  // Determine how many agents to show and if we need a "more" indicator
  const hasMoreAgents = agents.length > 4;
  const displayAgents = hasMoreAgents ? agents.slice(0, 3) : agents.slice(0, 4);
  const moreAgentsCount = hasMoreAgents ? agents.length - 3 : 0;

  return (
    <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-muted/40">
      <Link href={`/group-chat/${id}`} className="h-full flex flex-col">
        <CardHeader className="p-4 pb-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base truncate flex-1" title={title}>
              {title}
            </h3>
            <div className="px-2 py-1 rounded-full bg-muted/30 text-xs font-medium">
              {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/60" />
            Created {formattedDate}
          </p>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 flex-1 flex flex-col">
          <div className="relative mt-2 flex-1">
            <div className="grid grid-cols-2 gap-2 h-full">
              {displayAgents.map((agent, index) => (
                <div 
                  key={agent.agentId} 
                  className="aspect-square relative overflow-hidden rounded-xl group-hover:scale-[1.02] transition-transform duration-300"
                >
                  {agent.thumbnailUrl ? (
                    <div className="relative w-full h-full  items-start justify-start">
                      <Image
                        src={agent.thumbnailUrl}
                        alt={agent.agentName || "Agent"}
                        fill
                        sizes="(max-width: 768px) 100px, 150px"
                        className="object-contain rounded-xl border-2 border-muted"
                      />
                      {agent.agentName && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-4">
                          <p className="text-[10px] text-white truncate">
                            {agent.agentName}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted rounded-xl">
                      <Users className="h-6 w-6 text-muted-foreground/70" />
                    </div>
                  )}
                </div>
              ))}
              
              {hasMoreAgents && (
                <div className="aspect-square relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300">
                  <div className="text-center">
                    <p className="text-primary-foreground font-semibold text-lg">
                      +{moreAgentsCount}
                    </p>
                    <p className="text-primary-foreground/80 text-[10px] font-medium">
                      more agents
                    </p>
                  </div>
                </div>
              )}
              
              {/* Fill empty slots with placeholders when less than 4 agents and no "more" indicator */}
              {!hasMoreAgents && displayAgents.length < 4 && 
                Array.from({ length: 4 - displayAgents.length }).map((_, index) => (
                  <div 
                    key={`empty-${index}`} 
                    className="aspect-square bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-muted/20"
                  />
                ))
              }
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-2">
          <div className="w-full flex items-center justify-between">
            <div className="text-xs text-muted-foreground/70">
              Click to open chat
            </div>
            <div className="text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform duration-300">
              View →
            </div>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
} 