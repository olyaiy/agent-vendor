import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';

// import { Greeting } from './greeting';
import { memo, useEffect, useRef } from 'react';

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
}

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  
  // Track previous messages state for comparison
  const prevMessagesRef = useRef<UIMessage[]>([]);
  
  // Custom hook that provides refs for container and end element
  // to enable automatic scrolling to the bottom when new messages arrive
  const { scrollRef, isAtBottom, scrollToBottom } = useAutoScroll({
    content: messages.length > 0 
      ? `${messages[messages.length - 1].id}-${messages[messages.length - 1].content?.toString().length ?? 0}-${messages[messages.length - 1].reasoning?.length ?? 0}` 
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
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto pt-4 pb-2 w-full px-4 md:px-8 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
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
          className="fixed bottom-40 right-[26%]   z-10"
        >
          <Button
            onClick={scrollToBottom}
            className="rounded-full p-2 shadow-md backdrop-blur-sm opacity-90"
            size="icon"
            variant="secondary"
          >
            <ChevronDown className="h-4 w-4" />
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
  
  return true;
});