import type { Message } from 'ai';
import {
  TooltipProvider,

} from '../ui/tooltip';
import { memo } from 'react';
import { CopyButton } from '../ui/copy-button';




export function PureMessageActions({
  message,
  isLoading,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
}) {
  if (isLoading) return null;
  if (message.role === 'user') return null;

  const textFromParts = message.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        {textFromParts && (
          <CopyButton
            content={textFromParts}
            copyMessage="Copied to clipboard!"
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);