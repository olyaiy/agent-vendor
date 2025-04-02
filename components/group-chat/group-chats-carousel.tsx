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
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/group-chat/${id}`}>
        <CardHeader className="p-4 pb-2">
          <h3 className="font-medium truncate" title={title}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            Created {formattedDate}
          </p>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-1 mt-2">
            {displayAgents.map((agent, index) => (
              <div key={agent.agentId} className="aspect-square relative overflow-hidden rounded-md">
                {agent.thumbnailUrl ? (
                  <Image
                    src={agent.thumbnailUrl}
                    alt={agent.agentName || "Agent"}
                    fill
                    sizes="(max-width: 768px) 100px, 150px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {hasMoreAgents && (
              <div className="aspect-square relative overflow-hidden rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-medium">
                  +{moreAgentsCount} more
                </span>
              </div>
            )}
            
            {/* Fill empty slots with placeholders when less than 4 agents and no "more" indicator */}
            {!hasMoreAgents && displayAgents.length < 4 && 
              Array.from({ length: 4 - displayAgents.length }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square bg-muted rounded-md" />
              ))
            }
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <div className="w-full text-sm text-muted-foreground">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
} 