import type { Message } from 'ai';
import { ChatRequestOptions } from '@ai-sdk/ui-utils';
import {
  TooltipProvider,

} from '../ui/tooltip';
import { memo } from 'react';
import { CopyButton } from '../ui/copy-button';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';




export function PureMessageActions({
  message,
  isLoading,
  reload,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
  reload?: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
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
      <div className="flex flex-row gap-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
        {textFromParts && (
          <CopyButton
            content={textFromParts}
            copyMessage="Copied to clipboard!"
          />
        )}
        {reload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => reload()}
                disabled={isLoading}
                aria-label="Regenerate response"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regenerate response</TooltipContent>
          </Tooltip>
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