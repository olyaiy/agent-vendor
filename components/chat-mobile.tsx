'use client'
import React, { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { MobileAgentHeader } from './chat/MobileAgentHeader'; // Use the mobile header
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
import { ModelInfo } from "@/app/[agent-id]/settings/edit-agent-form";
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater';

// Interface identical to ChatProps for now
interface ChatMobileProps {
  chatId: string;
  agent: Agent & { modelName: string; tags: Array<{ id: string; name: string }> };
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[]; // Keep knowledge for potential future use, even if not displayed
  models: ModelInfo[];
}

export default function ChatMobile({
  agent,
  // knowledgeItems, // Keep prop (unused in mobile)
  models,
  chatId,
  initialMessages,
  initialTitle
}: ChatMobileProps) {
  // State and hooks copied from Chat.tsx
  const [selectedModelId] = useState<string>(agent.primaryModelId); // setSelectedModelId unused
  const { handleChatFinish } = useChatTitleUpdater(chatId, initialTitle); // displayTitle unused

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
      model: models.find(m => m.id === selectedModelId)?.model || agent.modelName
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
      <div className="flex-grow overflow-y-auto">
        {messages.length > 0 ? (
          <Messages
            chatId={chatId}
            status={status}
            messages={messagesProp}
            setMessages={setMessages}
            reload={reload}
            isReadonly={false}
            isArtifactVisible={false}
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
      <div className="mt-auto p-2 border-t border-border"> {/* Added padding and border */}
        <ChatInput
          chatId={chatId}
          agentId={agent.id}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          // Pass messages length to potentially adjust input style if needed
          hasMessages={messages.length > 0}
        />
      </div>
    </div>
  )
}