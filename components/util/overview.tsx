import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

import { MessageIcon, VercelIcon } from './icons';
import type { Agent, AgentCustomization } from '@/lib/db/schema';

export const Overview = ({ agent }: { agent: Agent }) => {
  const { title, content, showPoints, points } = (agent.customization as AgentCustomization).overview;

  return (
    <motion.div
      key="overview"
      className=" w-full mx-auto  overflow-scroll"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center mx-auto">
        {(agent.thumbnail_url || agent.agent_display_name) && (
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
        
        
     
        
        {content && (
          <p className="text-base text-muted-foreground">{content}</p>
        )}
        
        {showPoints && points.length > 0 && (
          <div>
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
