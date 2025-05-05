'use client';

import type { Message } from 'ai';
import { ChatRequestOptions } from '@ai-sdk/ui-utils';
import {
  TooltipProvider,
} from '../ui/tooltip';
import { memo, useState } from 'react';
import { CopyButton } from '../ui/copy-button';
import { Button } from '../ui/button';
import { Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { deleteMessageAction } from '@/db/actions/chat-actions';

import { cn } from '@/lib/utils';
import { UseChatHelpers } from '@ai-sdk/react';
import { toast } from 'sonner';
import markdownToTxt from 'markdown-to-txt';
import { useIsMobile } from '@/hooks/use-mobile';

export function PureMessageActions({
  message,
  isLoading,
  reload,
  setMessages,
  setMode,
  isReadonly,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload?: (chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  setMode?: (mode: 'view' | 'edit') => void;
  isReadonly?: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) return null;

  const textFromParts = message.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => markdownToTxt(part.text))
    .join('\n')
    .trim();

  const handleDelete = async () => {
    if (!message.id) return;
    
    // Optimistic UI update
    setIsDeleting(true);
    
    // Optimistically remove message from UI
    setMessages((currentMessages) => 
      currentMessages.filter((msg) => msg.id !== message.id)
    );
    
    // Call server action
    const result = await deleteMessageAction(message.id);
    
    if (!result.success) {
      // Revert optimistic update on failure
      setMessages((currentMessages) => {
        // Check if message is already in the list
        if (!currentMessages.some(msg => msg.id === message.id)) {
          return [...currentMessages, message].sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
        }
        return currentMessages;
      });
      
      toast.error(result.message || "Failed to delete message");
    }
    
    setIsDeleting(false);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={
          isMobile
            ? "flex flex-row gap-2 opacity-50"
            : "flex flex-row gap-2 opacity-0 group-hover/message:opacity-80 transition-opacity"
        }
      >
        {message.role === 'user' && setMode && !isReadonly && (
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
              <Button
                data-testid="message-edit-button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setMode('edit')}
                aria-label="Edit message"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit message</TooltipContent>
          </Tooltip>
        )}
        
        {textFromParts && (
          <CopyButton
            content={textFromParts}
            copyMessage="Copied to clipboard!"
          />
        )}
        
        {reload && message.role === 'assistant' && (
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
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
        
        <Tooltip>
          <TooltipTrigger asChild className="cursor-pointer">
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-6", {
                "text-destructive hover:text-destructive cursor-pointer": isDeleting
              })}
              onClick={handleDelete}
              disabled={isLoading || isDeleting}
              aria-label="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete message</TooltipContent>
        </Tooltip>
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