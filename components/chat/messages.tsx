import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';

// import { Greeting } from './greeting';
import React, { memo, useEffect, useRef } from 'react'; // Import React

import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-react';
import { Greeting } from './greeting';

interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  hideReasoning?: boolean;
  // Allow null for the external ref prop type
  externalScrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
  // Destructure the new prop
  hideReasoning,
  externalScrollContainerRef,
}: MessagesProps) {

  // Track previous messages state for comparison
  const prevMessagesRef = useRef<UIMessage[]>([]);

  // Custom hook that provides refs for container and end element
  // to enable automatic scrolling to the bottom when new messages arrive
  const { scrollRef, isAtBottom, scrollToBottom } = useAutoScroll({
    // Pass the external ref to the hook
    // @ts-expect-error - Type 'RefObject<HTMLDivElement | null>' is not assignable to type 'RefObject<HTMLDivElement>'. We handle this inside the hook.
    externalRef: externalScrollContainerRef,
    content: messages.length > 0
      ? `${messages[messages.length - 1].id}-${messages[messages.length - 1].content?.toString().length ?? 0}-${messages[messages.length - 1].reasoningText?.length ?? 0}`
      : null,
    offset: 32,
    smooth: true
  });

  // Debounce the "not at bottom" state to prevent flickering of the button
  const isNotAtBottomDebounced = useDebounce(!isAtBottom, 300);

  // Force scroll to bottom when a new user message is added
  useEffect(() => {
    const prevMessages = prevMessagesRef.current;

    // Check if a new user message was added
    if (
      messages.length > prevMessages.length &&
      messages.length > 0 &&
      messages[messages.length - 1].role === 'user'
    ) {
      // Always scroll to bottom when user adds a new message
      // console.log('[Messages] New user message detected. Forcing scroll to bottom.');
      scrollToBottom();
    }

    // Update ref with current messages
    prevMessagesRef.current = messages;
  }, [messages, scrollToBottom]);



  return (
    <div
      className="flex flex-col min-w-0 gap-4 sm:gap-6 flex-1 overflow-y-auto pt-4 pb-2 w-full  md:px-8 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
      // Keep attaching the internal ref returned by the hook here
      ref={scrollRef}
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <div key={message.id}>
          <PreviewMessage
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            hideReasoning={hideReasoning}
          />
        </div>
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && (
          <div>
            <ThinkingMessage />
          </div>
        )}

{
      // status === 'streaming' &&
       isNotAtBottomDebounced && (
        <div
          className=" absolute left-2 top-16 md:left-auto md:top-auto md:fixed md:bottom-40 md:right-[26%] z-10 pt-2 sm:pt-0"
        >
          <Button
            onClick={scrollToBottom}
            className="rounded-full sm:p-2 size-8 sm:size-auto border border-border shadow-md backdrop-blur-sm opacity-80"
            size="icon"
            variant="secondary"
          >
            <ChevronDown className="sm:size-4 size-3" />
          </Button>
        </div>
      )}




      <div className="shrink-0 min-w-[24px] min-h-[24px]" />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  // Proper comparison for all props
  if (prevProps.isArtifactVisible !== nextProps.isArtifactVisible) return false;
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  // Add comparison for the new prop
  if (prevProps.externalScrollContainerRef !== nextProps.externalScrollContainerRef) return false;
  if (prevProps.hideReasoning !== nextProps.hideReasoning) return false;

  return true;
});