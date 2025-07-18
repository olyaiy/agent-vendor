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
import { GearIcon, ChatBubbleIcon, EyeNoneIcon } from "@radix-ui/react-icons";
import { DrawingPinFilledIcon } from "@radix-ui/react-icons";
import { AgentImage } from "@/components/agent-image";
import { Badge } from "@/components/ui/badge";

// Define the structure for a tag as returned by the query
type AgentTagInfo = { id: string; name: string };

// Define the expected agent structure including tags for this component
type AgentWithTags = Pick<Agent, 'id' | 'name' | 'description' | 'slug' | 'thumbnailUrl' | 'avatarUrl' | 'creatorId' | 'visibility'> & {
  tags?: AgentTagInfo[]; // Tags are optional as not all contexts might provide them
};

interface AgentCardProps {
  agent: AgentWithTags;
  className?: string;
}

const MAX_VISIBLE_TAGS = 3; // Define the maximum number of tags to show

export function AgentCard({ agent, className = "" }: AgentCardProps) {
  const visibleTags = agent.tags ? agent.tags.slice(0, MAX_VISIBLE_TAGS) : [];
  const hiddenTagsCount = agent.tags ? Math.max(0, agent.tags.length - MAX_VISIBLE_TAGS) : 0;

  return (
    <Link href={`/agent/${agent.slug}`} className="block group h-full">
      <div className={`rounded-lg overflow-hidden bg-background transition-all duration-300 hover:scale-[1.02] h-full flex flex-col ${className}`}>
        
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/20 to-muted/40 flex-shrink-0 rounded-lg"> 
          {/* Agent Image */}
          <AgentImage
            thumbnailUrl={agent.thumbnailUrl}
            agentId={agent.id}
          />

          {/* Visibility badge */}
          {agent.visibility !== 'public' && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-border/50 text-xs">
                <EyeNoneIcon className="h-3 w-3 mr-1" />
                {agent.visibility}
              </Badge>
            </div>
          )}

          {/* Dropdown menu with improved styling */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"> 
            <DropdownMenu>
              <DropdownMenuTrigger 
                className="p-1.5 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background border border-border/50 transition-all duration-200 hover:shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsHorizontalIcon className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link 
                    href={`/agent/${agent.slug}/settings`} 
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GearIcon className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
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

          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-3 flex flex-col flex-grow space-y-3">
          <h3 className="text-base font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
            {agent.name}
          </h3>
          
          <p className="text-sm text-muted-foreground/80 line-clamp-2 group-hover:text-muted-foreground transition-colors duration-200 flex-grow">
            {agent.description || "No description available"}
          </p>
          
          {/* Tags with improved styling */}
          <div className="flex flex-wrap gap-1.5 items-center min-h-[28px]">
            {agent.tags && agent.tags.length > 0 ? (
              <>
                {visibleTags.map((tag) => (
                  <Badge 
                    key={tag.id} 
                    variant="outline" 
                    className="text-[10px] sm:text-xs font-medium border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors duration-200"
                  >
                    {tag.name}
                  </Badge>
                ))}
                {hiddenTagsCount > 0 && (
                  <Badge 
                    variant="secondary"
                    className="text-[10px] sm:text-xs font-medium bg-muted/50"
                  >
                    +{hiddenTagsCount}
                  </Badge>
                )}
              </>
            ) : (
              <div className="h-[20px]" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}