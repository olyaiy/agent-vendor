'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { StopIcon } from '@/components/util/icons';
import type { Message } from 'ai';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Button component for stopping message generation
 * 
 * Features:
 * - Animated pulsing effect to indicate active message streaming
 * - Stops message generation when clicked
 * - Preserves current message state
 */
function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1 sm:p-1.5 h-fit border dark:border-zinc-600 relative animate-pulse before:content-[''] before:absolute before:inset-0 before:rounded-full before:border before:border-zinc-400 dark:before:border-zinc-500 before:animate-[spin_3s_linear_infinite]"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

/**
 * Memoized version of the stop button to prevent unnecessary re-renders
 */
export const StopButton = memo(PureStopButton);
