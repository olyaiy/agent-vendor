'use client';

import { useState } from "react";
import { type InferSelectModel } from "drizzle-orm";
import { type agents, type models } from "@/lib/db/schema";
import { AgentCard } from "./agent-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RecentAgentsScrollProps {
  agents: (Omit<InferSelectModel<typeof agents>, 'model'> & {
    models?: InferSelectModel<typeof models>[] | null;
    toolGroups?: { id: string; name: string; display_name: string; description: string | null }[] | null;
    tags?: { id: string; name: string; createdAt: Date; updatedAt: Date }[] | null;
  })[];
  userId?: string;
}

export function RecentAgentsScroll({ agents, userId }: RecentAgentsScrollProps) {
  // State for current page - moved before conditional return
  const [currentPage, setCurrentPage] = useState(0);
  
  // If no agents, don't render this component
  if (!agents.length) return null;
  
  // Items per page
  const ITEMS_PER_PAGE = 4;
  
  // Calculate total pages
  const totalPages = Math.ceil(agents.length / ITEMS_PER_PAGE);
  
  // Cookie name for storing recently used agents
  const RECENT_AGENTS_COOKIE = 'recent-agents';
  
  // Function to update the recent agents cookie when an agent is clicked
  const handleAgentClick = (agentId: string) => {
    // Get current recent agents from cookie
    const recentAgentsCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${RECENT_AGENTS_COOKIE}=`));
    
    let recentAgentIds: string[] = [];
    
    if (recentAgentsCookie) {
      recentAgentIds = recentAgentsCookie.split('=')[1].split(',');
    }
    
    // Remove the clicked agent if it already exists in the list
    recentAgentIds = recentAgentIds.filter(id => id !== agentId);
    
    // Add the clicked agent to the beginning of the list
    recentAgentIds.unshift(agentId);
    
    const MAX_RECENT_AGENTS = 20;
    if (recentAgentIds.length > MAX_RECENT_AGENTS) {
      recentAgentIds = recentAgentIds.slice(0, MAX_RECENT_AGENTS);
    }
    
    // Set the cookie with the updated list
    // Set cookie to expire in 30 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    document.cookie = `${RECENT_AGENTS_COOKIE}=${recentAgentIds.join(',')}; path=/; expires=${expiryDate.toUTCString()}`;
  };

  // Calculate visible agents for current page
  const visibleAgents = agents.slice(
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
        <h2 className="text-lg font-semibold">Recently Used</h2>
        
        <div className="flex items-center space-x-2">
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleAgents.map((agent) => (
          <div key={agent.id} className="">
            <AgentCard 
              agent={agent}
              userId={userId}
              onClick={handleAgentClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
} 