'use client';

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import Link from 'next/link';
import { InferSelectModel } from "drizzle-orm";
import { agents, models } from "@/lib/db/schema";
import { AgentCardSettings } from "./agent-card-settings";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

interface AgentCardProps {
  agent: Omit<InferSelectModel<typeof agents>, 'model'> & {
    models?: InferSelectModel<typeof models>[] | null;
    toolGroups?: { id: string; name: string; display_name: string; description: string | null }[] | null;
    tags?: { id: string; name: string; createdAt: Date; updatedAt: Date }[] | null;
  };
  userId?: string;
  onClick?: (agentId: string) => void;
  stepNumber?: number;
}

export function AgentCard({ agent, userId, onClick, stepNumber }: AgentCardProps) {
  const handleClick = () => {
    if (onClick) onClick(agent.id);
  };

  const isCreator = userId === agent.creatorId;

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
          
          {stepNumber && (
            <div className="absolute -top-3 -left-3 z-20">
              <motion.div
                className="size-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-blue-500/30 border-2 border-white/25 dark:border-black/25"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                whileHover={{ y: -2, scale: 1.1 }}
              >
                {stepNumber}
              </motion.div>
            </div>
          )}
          
          <div className="aspect-[4/3] w-full mb-1 rounded-lg bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-700 dark:to-gray-900 relative">
            {agent.thumbnail_url ? (
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                <Image
                  src={agent.thumbnail_url}
                  alt={agent.agent_display_name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ) : (
              <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-700 rounded-lg"></div>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-semibold mb-1 line-clamp-1">{agent.agent_display_name}</h3>
      
          <div className="flex flex-col gap-1 mt-auto ">

            { agent.description && (
              <p className="text-xs text-muted-foreground mb-1 line-clamp-2 flex-1">
                {agent.description}
              </p>
            )}

            {/* Combined Tags and Tool Groups display */}
            {((agent.tags && agent.tags.length > 0) || (agent.toolGroups && agent.toolGroups.length > 0)) && (
              <div className="flex flex-wrap items-start gap-1 max-w-full max-h-[42px] overflow-hidden">
                {/* Display tags first */}
                {agent.tags && agent.tags.slice(0, 2).map((tag) => (
                  <Badge 
                    key={`tag-${tag.id}`} 
                    variant="secondary" 
                    className="text-[10px] px-2 py-0 h-5 truncate max-w-28"
                  >
                    {tag.name}
                  </Badge>
                ))}
                
                {/* More tags indicator */}
                {agent.tags && agent.tags.length > 2 && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] px-2 py-0 h-5"
                  >
                    +{agent.tags.length - 2}
                  </Badge>
                )}
                
                {/* Display tool groups */}
                {agent.toolGroups && agent.toolGroups.slice(0, 2).map((toolGroup) => (
                  <Badge 
                    key={`tool-${toolGroup.id}`} 
                    variant="outline" 
                    className="text-[10px] px-2 py-0 h-5 truncate max-w-28 border-dashed"
                  >
                    {toolGroup.display_name}
                  </Badge>
                ))}
                
                {/* More tool groups indicator */}
                {agent.toolGroups && agent.toolGroups.length > 2 && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-2 py-0 h-5 border-dashed"
                  >
                    +{agent.toolGroups.length - 2}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {isCreator ? (
                <AgentCardSettings 
                  agentId={agent.id}
                  userId={userId}
                  creatorId={agent.creatorId}
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.open(`/agents/${agent.id}/view`, '_blank');
                  }}
                  className="p-1.5 rounded-md hover:bg-muted inline-block"
                  aria-label="Open agent in new tab"
                >
                  <ExternalLink size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
} 