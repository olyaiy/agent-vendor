'use client';

import { Message } from 'ai';
import { Button } from './ui/button';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Textarea } from './ui/textarea';
import { deleteTrailingMessages } from '@/db/actions/chat-actions';
import { UseChatHelpers } from '@ai-sdk/react';
import { Loader2 } from 'lucide-react';

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  reload,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [draftContent, setDraftContent] = useState<string>(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="border-2 border-border rounded-md shadow-md">
        <Textarea
          data-testid="message-editor"
          ref={textareaRef}
          className="bg-background/80 rounded-md p-4 border-none focus:ring-1 focus:ring-primary transition-all duration-300 ease-in-out !text-base min-h-[140px] resize-none"
          value={draftContent}
          onChange={handleInput}
          placeholder="Edit your message..."
        />
      </div>

      <div className="flex flex-row gap-4 justify-end">
        <Button
          variant="outline"
          className="h-10 px-6 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 transition-colors duration-200 ease-in-out"
          onClick={() => {
            setMode('view');
          }}
        >
          Cancel
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-10 px-6 rounded-md text-sm font-medium bg-primary shadow-sm hover:bg-primary/90 hover:shadow-md text-primary-foreground transition-all duration-200 ease-in-out"
          disabled={isSubmitting || !draftContent.trim()}
          onClick={async () => {
            setIsSubmitting(true);

            await deleteTrailingMessages({
              id: message.id,
            });

            // @ts-expect-error todo: support UIMessage in setMessages
            setMessages((messages) => {
              const index = messages.findIndex((m) => m.id === message.id);

              if (index !== -1) {
                const updatedMessage = {
                  ...message,
                  content: draftContent,
                  parts: [{ type: 'text', text: draftContent }],
                };

                return [...messages.slice(0, index), updatedMessage];
              }

              return messages;
            });

            setMode('view');
            reload();
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sending
            </span>
          ) : (
            'Re-Send'
          )}
        </Button>
      </div>
    </div>
  );
}