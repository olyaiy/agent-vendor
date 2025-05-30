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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            duration: 0.6,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="flex flex-col items-center space-y-6 w-full max-w-sm"
        >
          {/* Agent Avatar */}
          {(agent.avatarUrl || agent.thumbnailUrl) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border/50 shadow-xl bg-gradient-to-br from-background to-muted"
            >
              <Image
                src={agent.avatarUrl || agent.thumbnailUrl || ''}
                alt={`${agent.name} avatar`}
                width={96}
                height={96}
                className="object-cover"
              />
            </motion.div>
          )}
          
          {/* Agent Name */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-2xl font-bold text-center text-foreground tracking-tight"
          >
            {agent.name}
          </motion.h1>
          
          {/* Agent Description */}
          {agent.description && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="text-sm text-muted-foreground text-center max-w-[280px] leading-6 px-2"
            >
              {agent.description}
            </motion.p>
          )}

          {/* Tags */}
          {agent.tags && agent.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="flex flex-wrap justify-center gap-2 max-w-[300px]"
            >
              {agent.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full border border-border/30"
                >
                  {tag.name}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ 
            delay: 0.8, 
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="text-center space-y-3 mt-8 w-full max-w-sm"
        >
          <div className="text-xl font-semibold text-foreground leading-7">
            {agent.welcomeMessage || "Hello there!"}
          </div>
          <div className="text-base text-muted-foreground leading-6">
            How can I help you today?
          </div>
          
          {/* Subtle call-to-action hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="pt-4"
          >
            <div className="text-xs text-muted-foreground/80 flex items-center justify-center gap-2">
              <span>💬</span>
              <span>Start typing to begin our conversation</span>
            </div>
          </motion.div>
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