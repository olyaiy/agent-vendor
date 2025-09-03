'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@/components/utils/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from '@/components/chat/markdown';


interface MessageReasoningProps {
  isLoading: boolean;
  reasoningText: string;
  hideReasoning?: boolean;
}

export function MessageReasoning({
  isLoading,
  reasoningText,
  hideReasoning = false,
}: MessageReasoningProps) {
  // Ensure reasoning text is always a plain string (fallback to JSON when needed)
  const normalizedReasoning = typeof reasoningText === 'string' ? reasoningText : JSON.stringify(reasoningText);
  
  const [isExpanded, setIsExpanded] = useState(true);
  const prevIsLoadingRef = useRef(isLoading);

  // Auto-collapse when reasoning finishes (isLoading changes from true to false)
  useEffect(() => {
    if (prevIsLoadingRef.current === true && isLoading === false) {
      setIsExpanded(false);
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);
  
  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium">Reasoning</div>
          <div className="flex gap-1 items-center">
            <motion.div
              className="size-1.5 rounded-full bg-primary"
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0
              }}
            />
            <motion.div
              className="size-1.5 rounded-full bg-primary"
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.15
              }}
            />
            <motion.div
              className="size-1.5 rounded-full bg-primary"
              animate={{
                scale: [0.5, 1, 0.5],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium">Reasoned for a few seconds</div>
          <div
            className="cursor-pointer"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDownIcon />
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && !hideReasoning && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
          >
            <Markdown messageRole="assistant">{normalizedReasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
