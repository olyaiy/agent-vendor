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
import { motion, AnimatePresence } from 'framer-motion';

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
      scrollToBottom();
    }
    
    // Update ref with current messages
    prevMessagesRef.current = messages;
  }, [messages, scrollToBottom]);

  const messageListVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 } 
    }
  };

  return (
    <motion.div 
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto pt-4 pb-2 w-full px-4 md:px-8 scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
      ref={scrollRef}
      initial="hidden"
      animate="visible"
      variants={messageListVariants}
    >
      {/* {messages.length === 0 && <Greeting />} */}

      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.3,
            ease: "easeOut" 
          }}
        >
          <PreviewMessage
            chatId={chatId}
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
          />
        </motion.div>
      ))}

      <AnimatePresence>
        {status === 'submitted' &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ThinkingMessage />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Scroll to bottom button - appears when streaming and not at bottom */}
      <AnimatePresence>
        {status === 'streaming' && isNotAtBottomDebounced && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-8 z-10"
          >
            <Button
              onClick={scrollToBottom}
              className="rounded-full p-2 shadow-md backdrop-blur-sm"
              size="icon"
              variant="secondary"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="shrink-0 min-w-[24px] min-h-[24px]" />
    </motion.div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});