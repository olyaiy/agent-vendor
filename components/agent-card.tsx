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
type AgentWithTags = Pick<Agent, 'id' | 'name' | 'description' | 'thumbnailUrl' | 'avatarUrl' | 'creatorId' | 'visibility'> & {
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
    <Link href={`/${agent.id}`} className="block">
      <div className={`group rounded-lg overflow-hidden bg-background transition-all duration-300 hover:shadow-lg hover:border-border/80 hover:scale-105 ${className}`}>
        
   

      <div className="relative aspect-square overflow-hidden rounded-lg group-hover:border-1  border-1 border-amber-500/15 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-orange-800"> 
  
         {/* Agent Image */}
          <AgentImage
            thumbnailUrl={agent.thumbnailUrl}
            agentId={agent.id}
          />

          {agent.visibility !== 'public' && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                <EyeNoneIcon className="h-3 w-3 mr-1" />
                {agent.visibility}
              </Badge>
            </div>
          )}

          {/* Add dropdown menu */}
          <div className="absolute top-2 right-2 transition-opacity duration-200 cursor-pointer"> 
            <DropdownMenu>
              <DropdownMenuTrigger 
                className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsHorizontalIcon className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link 
                    href={`/${agent.id}/settings`} 
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


        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2 mb-2 text-foreground/90 hover:text-primary transition-colors duration-200">
            {agent.name}
          </h3>
          {agent.description && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-3 hover:text-muted-foreground/90 transition-colors duration-200">
              {agent.description}
            </p>
          )}
          {/* Render Tags - MODIFIED to limit visible tags */}
          {agent.tags && agent.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center"> {/* Added items-center */}
              {visibleTags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  variant="outline" 
                  className="text-[10px] sm:text-xs font-medium text-muted-foreground/80 hover:text-muted-foreground/90 transition-colors duration-200"
                >
                  {tag.name}
                </Badge>
              ))}
              {hiddenTagsCount > 0 && (
                <Badge 
                  variant="secondary" // Use a slightly different variant for the count
                  className="text-[10px] sm:text-xs font-medium" // Match text size
                >
                  +{hiddenTagsCount}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}