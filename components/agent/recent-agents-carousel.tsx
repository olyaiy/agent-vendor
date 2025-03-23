'use client';

import { type InferSelectModel } from "drizzle-orm";
import { type agents, type models } from "@/lib/db/schema";
import { AgentCard } from "./agent-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RecentAgentsScrollProps {
  agents: (Omit<InferSelectModel<typeof agents>, 'model'> & {
    models?: InferSelectModel<typeof models>[] | null;
    toolGroups?: { id: string; name: string; display_name: string; description: string | null }[] | null;
    tags?: { id: string; name: string; createdAt: Date; updatedAt: Date }[] | null;
  })[];
  userId?: string;
}

export function RecentAgentsScroll({ agents, userId }: RecentAgentsScrollProps) {
  // If no agents, don't render this component
  if (!agents.length) return null;
  
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

  return (
    <div className="w-full ">
      <div className="mb-2">
        <h2 className="text-lg font-semibold">Recently Used</h2>
      </div>
      
      <ScrollArea className="w-full">
      <ScrollBar orientation="horizontal" />
        <div className="flex space-x-4 pb-4">
          {agents.map((agent) => (
            <div key={agent.id} className="">
              <AgentCard 
                agent={agent}
                userId={userId}
                onClick={handleAgentClick}
              />
            </div>
          ))}
        </div>
        
      </ScrollArea>
    </div>
  );
} 