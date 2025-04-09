"use client";


import Link from "next/link";
import type { Agent } from "@/db/schema/agent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { GearIcon,  ChatBubbleIcon } from "@radix-ui/react-icons";
import { DrawingPinFilledIcon } from "@radix-ui/react-icons";
import { AgentImage } from "@/components/agent-image";
import { generateAgentSlug } from "@/lib/utils";

interface AgentCardProps {
  agent: Pick<Agent, 'id' | 'name' | 'description' | 'thumbnailUrl' | 'avatarUrl' | 'creatorId'>;
  className?: string;
}

export function AgentCard({ agent, className = "" }: AgentCardProps) {
  return (
    <Link href={`/${generateAgentSlug(agent.name, agent.id)}`} className="block">
      <div className={`group rounded-lg overflow-hidden bg-background transition-all duration-300 hover:shadow-lg hover:border-border/80 hover:scale-105 ${className}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg">
          <AgentImage 
            thumbnailUrl={agent.thumbnailUrl}
            agentId={agent.id}
          />
          
          {/* Add dropdown menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors cursor-pointer">
                <DotsHorizontalIcon className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="cursor-pointer">
                  <GearIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <DrawingPinFilledIcon className="mr-2 h-4 w-4" />
                  Pin
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <ChatBubbleIcon className="mr-2 h-4 w-4" />
                  Add to Group Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-medium line-clamp-1 mb-1">{agent.name}</h3>
          {agent.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {agent.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
} 