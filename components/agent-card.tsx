"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { SparklesIcon } from "@/components/utils/icons";
import type { Agent } from "@/db/schema/agent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { GearIcon, PinTopIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { DrawingPinFilledIcon } from "@radix-ui/react-icons";

interface AgentCardProps {
  agent: Pick<Agent, 'id' | 'name' | 'description' | 'thumbnailUrl' | 'avatarUrl' | 'creatorId'>;
  className?: string;
}

export function AgentCard({ agent, className = "" }: AgentCardProps) {
  // Generate a unique gradient for agent when no thumbnail is available
  const [gradientStyle, setGradientStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    // Generate a deterministic gradient based on agent ID
    const generateGradient = (id: string) => {
      // Create a simple hash from the ID string
      const hash = Array.from(id).reduce(
        (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0,
        0
      );
      
      // Use the hash to create two hue values (0-360)
      const hue1 = Math.abs(hash % 360);
      const hue2 = Math.abs((hash * 13) % 360);
      
      // Create a gradient with those hues
      return {
        background: `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%))`,
      };
    };

    setGradientStyle(generateGradient(agent.id));
  }, [agent.id]);

  return (
    <Link href={`/agent/${agent.id}`} className="block">
      <div className={`group rounded-lg overflow-hidden bg-background transition-all duration-300 hover:shadow-lg hover:border-border/80 hover:scale-105 ${className}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg">
          {agent.thumbnailUrl ? (
            <Image
              src={agent.thumbnailUrl}
              alt={agent.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div 
              style={gradientStyle} 
              className="w-full h-full flex items-center justify-center"
            >
              <SparklesIcon size={32} />
            </div>
          )}
          
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