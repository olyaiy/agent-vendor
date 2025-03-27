import { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from '@/components/chat/message';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useMemo, memo} from 'react';
import equal from 'fast-deep-equal';
import type { Agent } from '@/lib/db/schema';
import { UseChatHelpers } from '@ai-sdk/react';

/**
 * Interface defining the props for the Messages component
 * @property {string} chatId - Unique identifier for the current chat
 * @property {boolean} isLoading - Flag indicating if a message is currently being processed/loaded
 * @property {Array<Message>} messages - The chat messages to be displayed
 * @property {Function} setMessages - State setter function to update messages
 * @property {Function} reload - Function to reload/regenerate the chat conversation
 * @property {boolean} isReadonly - Flag to prevent message interaction when true
 * @property {boolean} isArtifactVisible - Flag for artifact visibility that affects render optimization
 * @property {Array<any>} toolCallData - Optional array of tool invocation data
 * @property {Object} customization - Optional customization object for agent style information
 */
interface MessagesProps {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  toolCallData?: Array<any>;
  agent: Agent;
}

/**
 * PureMessages - Core implementation of the Messages component
 * 
 * This component handles rendering the chat interface, including:
 * - Empty state with Overview component
 * - List of messages with their voting state
 * - Loading/thinking indicators
 * - Auto-scrolling to the latest message
 * - Tool sections for AI interactions
 * 
 * The component is designed to be memoized for performance optimization.
 */
function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
  toolCallData,
  agent,
}: MessagesProps) {

  // Custom hook that provides refs for container and end element
  // to enable automatic scrolling to the bottom when new messages arrive
  const { scrollRef } = useAutoScroll({
    content: messages.length > 0 
      ? `${messages[messages.length - 1].id}-${messages[messages.length - 1].content?.toString().length ?? 0}` 
      : null,
    offset: 32,         // Match previous scroll offset
    smooth: true        // Enable smooth scrolling
  });
  
  
  // Process the last tool data from the provided data array for conditional rendering of the "thinking..." message.
  const lastToolData = useMemo(() => {
    if (!toolCallData || !Array.isArray(toolCallData) || toolCallData.length === 0) return null;

    const lastItem = toolCallData[toolCallData.length - 1];
    
    // Ensure the item has the expected format
    if (!lastItem || typeof lastItem !== 'object' || !('type' in lastItem)) return null;
    
    if (lastItem.type !== 'tool_call') return null;

    const toolCallDetails = lastItem.data;
    return {
      state: 'call' as const,
      toolCallId: toolCallDetails.toolCallId,
      toolName: toolCallDetails.toolName,
      args: toolCallDetails.args ? JSON.parse(toolCallDetails.args) : undefined
    };
  }, [toolCallData]);




  return (
    <div
      ref={scrollRef}
      className="flex flex-col min-w-0 gap-6 absolute inset-0 overflow-y-auto pt-4 px-4 md:px-8"
    >
      {/* Render each message with its associated metadata and interactions */}
      {messages.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          // Only show loading state on the last message when it's an AI response being generated
          isLoading={status === 'streaming' && messages.length - 1 === index}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          agentImageUrl={agent.avatar_url || agent.thumbnail_url || undefined}
        />
      ))}

      {/* Show thinking message when waiting for first assistant response */}
      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && 
        !lastToolData && <ThinkingMessage />
      }
    </div>
  );
}

/**
 * Messages - Memoized version of the chat messages component
 * 
 * The component is wrapped with React.memo and uses a custom comparison function
 * to optimize rendering performance by preventing unnecessary re-renders.
 * 
 * The comparison logic handles several scenarios:
 * 1. If artifact is visible in both prev and next props, skip re-render
 * 2. Always re-render when loading state changes
 * 3. Always re-render during continuous loading
 * 4. Re-render when message count changes
 * 5. Re-render when message content changes (using deep equality)
 * 7. Re-render when tool data changes (using deep equality)
 */
export const Messages = memo(PureMessages, (prevProps: MessagesProps, nextProps: MessagesProps) => {
  
  const shouldRerender = (() => {
    // Skip re-render if artifact is visible in both states
    if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

    // Force re-render if loading state changes
    if (prevProps.status !== nextProps.status) return false;
    // Continue rendering during loading state to show progress
    if (prevProps.status && nextProps.status) return false;
    // Re-render if messages are added or removed
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    // Deep comparison of messages to detect  changes
    if (!equal(prevProps.messages, nextProps.messages)) return false;
    // Re-render if tool data changes
    if (!equal(prevProps.toolCallData, nextProps.toolCallData)) return false;

    // Skip re-render if none of the above conditions are met
    return true;
  })();
  
  
  return shouldRerender;
});
