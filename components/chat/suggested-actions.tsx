'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChatRequestOptions, CreateMessage, Message } from 'ai';
import { memo } from 'react';

interface SuggestedActionsProps {
  chatId: string;
  agentId: string;
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  suggestedPrompts?: string[];
}

function PureSuggestedActions({ chatId, append, agentId, suggestedPrompts = [] }: SuggestedActionsProps) {
  // Use provided suggestedPrompts if available, otherwise fall back to default actions
  const suggestedActions = suggestedPrompts.length > 0 
    ? suggestedPrompts.map(prompt => {
        const words = prompt.split(' ');
        const boldPart = words.slice(0, 3).join(' ');
        const regularPart = words.slice(3).join(' ');
        return {
          title: boldPart,
          label: regularPart,
          action: prompt,
        };
      })
    : [
      {
        title: 'What are the',
        label: 'advantages of using Next.js?',
        action: 'What are the advantages of using Next.js?',
      },
      {
        title: 'Write code to',
        label: `demonstrate djikstra's algorithm`,
        action: `Write code to demonstrate djikstra's algorithm`,
      },
      {
        title: 'Help me write',
        label: `an essay about silicon valley`,
        action: `Help me write an essay about silicon valley`,
      },
      {
        title: 'What is the',
        label: 'weather in San Francisco?',
        action: 'What is the weather in San Francisco?',
      },
    ];

  return (
    <div className="grid sm:grid-cols-2 gap-2 w-full overflow-hidden ">
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block overflow-hidden'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/${agentId}/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 sm:py-3.5 text-sm flex-1 gap-1 flex-col sm:flex-col w-full h-16 sm:h-24 justify-start items-start whitespace-normal"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            {suggestedAction.label && (
              <span className="text-muted-foreground break-words">
                {suggestedAction.label}
              </span>
            )}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
