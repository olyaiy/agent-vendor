"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Agent } from "@/db/schema/agent";
import { SparklesIcon } from "@/components/utils/icons";

interface AgentCardProps {
  agent: Agent;
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
    <Link href={`/${agent.id}`} className="block">
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