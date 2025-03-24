'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import Link from 'next/link';
import { InferSelectModel } from "drizzle-orm";
import { agents, models } from "@/lib/db/schema";
import { AgentCardSettings } from "./agent-card-settings";
import { formatCurrency } from "@/lib/utils";
import { Settings, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MyAgentCardProps {
  agent: Omit<InferSelectModel<typeof agents>, 'model'> & {
    models?: InferSelectModel<typeof models>[] | null;
    toolGroups?: { id: string; name: string; display_name: string; description: string | null }[] | null;
    tags?: { id: string; name: string; createdAt: Date; updatedAt: Date }[] | null;
    totalSpent?: number;
  };
  userId?: string;
  onClick?: (agentId: string) => void;
}

// New component for card actions
function AgentCardActions({ agentId, userId, creatorId }: { agentId: string; userId?: string; creatorId?: string | null }) {
  const router = useRouter();
  
  return (
    <div className="flex flex-col gap-3">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="py-2 px-3 bg-white/90 hover:bg-white text-black rounded-full flex items-center gap-2 shadow-sm backdrop-blur-sm transition-all"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                router.push(`/${agentId}`);
              }}
              aria-label="Chat with agent"
            >
              <MessageCircle className="size-4 shrink-0" />
              <span className="text-xs font-medium">Chat</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Chat with Agent</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="py-2 px-3 bg-white/90 hover:bg-white text-black rounded-full flex items-center gap-2 shadow-sm backdrop-blur-sm transition-all"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                router.push(
                  userId === creatorId 
                    ? `/agents/${agentId}/edit` 
                    : `/agents/${agentId}/view`
                );
              }}
              aria-label="Agent settings"
            >
              <Settings className="size-4 shrink-0" />
              <span className="text-xs font-medium">Settings</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Agent Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function MyAgentCard({ agent, userId, onClick }: MyAgentCardProps) {
  const handleClick = () => {
    if (onClick) onClick(agent.id);
  };

  return (
    <div className="w-full">
      <Link href={`/${agent.id}`} onClick={handleClick}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer relative group min-w-[180px] max-w-[400px] w-full mx-auto flex flex-col">
          {agent.visibility !== 'public' && (
            <div className="absolute top-2 right-2 z-10">
              <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-muted">
                {agent.visibility}
              </Badge>
            </div>
          )}
          
          <div className="aspect-[4/3] w-full mb-1 rounded-lg bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 relative overflow-hidden">
            {agent.thumbnail_url ? (
              <div className="absolute inset-0 overflow-hidden rounded-t-lg">
                <Image
                  src={agent.thumbnail_url}
                  alt={agent.agent_display_name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-700 rounded-lg"></div>
            )}
            
            {/* Overlay that appears on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <AgentCardActions 
                agentId={agent.id}
                userId={userId}
                creatorId={agent.creatorId}
              />
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-semibold mb-1 line-clamp-1">{agent.agent_display_name}</h3>
      
          <div className="flex flex-col gap-1 mt-auto">
            {agent.description && (
              <p className="text-xs text-muted-foreground mb-1 flex-1">
                {agent.description.length > 40 
                  ? `${agent.description.substring(0, 40)}...` 
                  : agent.description}
              </p>
            )}

            {/* Display spending information */}
            <div className="flex items-center space-x-1 text-xs mb-2">
              <span className="font-medium text-muted-foreground">Estimated Earnings:</span>
              <span className={`font-medium ${typeof agent.totalSpent === 'number' && agent.totalSpent > 0 ? 'text-indigo-500 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                {typeof agent.totalSpent === 'number' ? formatCurrency(agent.totalSpent) : '$0.00'}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
} 