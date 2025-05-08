'use client'
import React, { useEffect, useRef } from 'react' // Import useRef
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { MobileAgentHeader } from './chat/MobileAgentHeader'; // Use the mobile header
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
// Removed unused ModelInfo import
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater';

// Define the type for models associated with the agent (same as in chat.tsx)
interface AgentSpecificModel {
  agentId: string;
  modelId: string;
  role: 'primary' | 'secondary';
  model: string; // The actual model name, e.g., 'claude-3-haiku'
  description?: string | null;
  id: string; // Alias for modelId
}

interface ChatMobileProps {
  chatId: string;
  agent: Agent; // Removed modelName and tags (assuming tags aren't used directly here)
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[]; // Keep knowledge for potential future use
  agentModels: AgentSpecificModel[]; // Use the new prop type
}

export default function ChatMobile({
  agent,
  // knowledgeItems, // Still unused in mobile rendering logic
  agentModels, // Use agentModels prop
  chatId,
  initialMessages,
  initialTitle
}: ChatMobileProps) {

  // Find the primary model from the agentModels prop
  const primaryModel = agentModels.find(m => m.role === 'primary');
  // Get the name of the primary model, fallback if needed
  const primaryModelName = primaryModel ? primaryModel.model : (agentModels.length > 0 ? agentModels[0].model : '');
  // Removed unused selectedModelId state

  const { handleChatFinish } = useChatTitleUpdater(chatId, initialTitle); // displayTitle unused

  // Ref for the mobile scroll container
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null); // Added ref

  useEffect(() => {
    if (agent?.id) {
      localStorage.setItem('lastVisitedAgentId', agent.id);
    }
  }, [agent?.id]);

  // const { data: session } = authClient.useSession(); // session unused
  // const user = session?.user; // user unused
  // isOwner might not be needed if sidebar is gone, but keep for consistency for now
  // const isOwner = agent.creatorId === user?.id; // isOwner unused

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    status,
    stop,
    reload
  } = useChat({
    id: chatId,
    body: {
      chatId: chatId,
      agentId: agent.id,
      systemPrompt: agent.systemPrompt,
      model: primaryModelName // Use the determined primary model name
    },
    initialMessages,
    generateId: generateUUID,
    sendExtraMessageFields: true,
    onFinish: handleChatFinish,
    onError: (error) => {
      console.log('Error from useChat (Mobile):', error);
      if (error && error.message && (error.message.includes('Unauthorized') || error.message.includes('401'))) {
        // @ts-expect-error Same type mismatch as in Chat.tsx
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: generateUUID(),
            role: 'assistant',
            ui: (
              <div className="p-4 bg-red-100 border border-red-300 rounded-md text-red-800">
                <p className="mb-2">Please sign in to chat!</p>
                <GoogleSignInButton className="w-full" />
              </div>
            )
          }
        ]);
      }
    }
  })

  // @ts-expect-error There's a version mismatch between UIMessage types
  const messagesProp: UIMessage[] = messages;

  return (
    // Use flex column for the entire mobile view height
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      <MobileAgentHeader agent={agent} hasMessages={messages.length > 0} />

      {/* Messages Area - takes remaining space and scrolls */}
      {/* Attach the ref here */}
      <div ref={mobileScrollContainerRef} className="flex-grow overflow-y-auto">
        {messages.length > 0 ? (
          <Messages
            chatId={chatId}
            status={status}
            messages={messagesProp}
            setMessages={setMessages}
            reload={reload}
            isReadonly={false}
            isArtifactVisible={false}
            // Pass the ref down
            externalScrollContainerRef={mobileScrollContainerRef}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-full px-4 flex flex-col mb-4 gap-4"> {/* Adjusted padding/gap */}
              <Greeting />
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Area - fixed at the bottom */}
      <div className="mt-auto ">
        <ChatInput
          chatId={chatId}
          agentSlug={agent.slug || ''}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          className=" px-2 bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]"
          isMobile={true} 
          minHeight={12}
          // Removed hasMessages prop
        />
      </div>
    </div>
  )
}