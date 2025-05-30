import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Agent } from '@/db/schema/agent';

interface GreetingProps {
  agent?: Agent & { tags: Array<{ id: string; name: string }> };
  isMobile?: boolean;
}

export const Greeting = ({ agent, isMobile = false }: GreetingProps) => {
  // Mobile layout with agent info
  if (isMobile && agent) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center space-y-4"
        >
          {/* Agent Avatar */}
          {(agent.avatarUrl || agent.thumbnailUrl) && (
            <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-border shadow-lg">
              <Image
                src={agent.avatarUrl || agent.thumbnailUrl || ''}
                alt={`${agent.name} avatar`}
                width={112}
                height={112}
                className="object-cover"
              />
            </div>
          )}
          
          {/* Agent Name */}
          <h1 className="text-xl font-semibold text-center text-foreground">
            {agent.name}
          </h1>
          
          {/* Agent Description */}
          {agent.description && (
            <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
              {agent.description}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-2"
        >
          <div className="text-lg font-medium">
            {agent.welcomeMessage || "Hello there!"}
          </div>
          <div className="text-sm text-muted-foreground">
            How can I help you today?
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop layout or fallback
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center "
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Hello there!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        How can I help you today?
      </motion.div>
    </div>
  );
};