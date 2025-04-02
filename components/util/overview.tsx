import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import { MessageIcon, VercelIcon } from './icons';
import type { Agent, AgentCustomization } from '@/lib/db/schema';

// Define a minimal type for group agent display
interface GroupAgentDisplayInfo {
  id: string;
  agent_display_name: string | null;
  avatar_url?: string | null;
  thumbnail_url?: string | null;
}

export const Overview = ({ 
  agent, 
  isGroupChat, 
  groupAgents,
  groupChatTitle 
}: { 
  agent: Agent;
  isGroupChat?: boolean;
  groupAgents?: GroupAgentDisplayInfo[]; // Use the minimal type here
  groupChatTitle?: string;
}) => {
  const customization = agent.customization as AgentCustomization | undefined;
  const overviewData = customization?.overview ?? { title: '', content: '', showPoints: false, points: [] };
  const { content, showPoints, points } = overviewData;

  return (
    <motion.div
      key="overview"
      className=" w-full mx-auto  overflow-scroll"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center mx-auto items-center">
        {/* Display Group Chat Title if available */}  
        {isGroupChat && groupChatTitle && (
          <h1 className="text-3xl font-bold tracking-tight">
            {groupChatTitle}
          </h1>
        )}
        
        {/* Display Group Agent Avatars */}  
        {isGroupChat && groupAgents && groupAgents.length > 0 && (
          <div className="flex -space-x-4 rtl:space-x-reverse">
            {groupAgents.map((groupAgent) => (
              <div key={groupAgent.id} className="relative w-12 h-12 min-w-12 min-h-12 overflow-hidden rounded-full border-2 border-background shrink-0">
                <Image
                  src={groupAgent.avatar_url || groupAgent.thumbnail_url || '/placeholder.png'} // Added placeholder
                  alt={groupAgent.agent_display_name || "Agent"}
                  fill
                  sizes="48px"
                  className="object-cover"
                  quality={80}
                  unoptimized={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Display Single Agent Info if NOT a group chat */}  
        {!isGroupChat && (agent.thumbnail_url || agent.agent_display_name) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {agent.thumbnail_url && (
              <div className="relative w-20 h-20 min-w-20 min-h-20 overflow-hidden rounded-full  shrink-0">
                <Image
                  src={agent.avatar_url || agent.thumbnail_url}
                  alt={agent.agent_display_name || "Agent"}
                  fill
                  sizes="(max-width: 640px) 80px, 80px"
                  className="object-cover"
                  priority
                  quality={90}
                  unoptimized={false}
                />
              </div>
            )}
            
            {agent.agent_display_name && (
              <h1 className="text-3xl font-bold tracking-tight mt-2 sm:mt-0">
                {agent.agent_display_name}
              </h1>
            )}
          </div>
        )}
        
        {/* Shared Content and Points */}  
        {content && (
          <p className="text-base text-muted-foreground max-w-xl">{content}</p>
        )}
        
        {showPoints && points && points.length > 0 && (
          <div className="max-w-xl w-full">
            <ul className="list-disc list-inside text-left mt-2 space-y-2 text-muted-foreground">
              {points.map((point, index) => (
                <li key={index} className="pl-1">{point}</li>
              ))} 
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};
