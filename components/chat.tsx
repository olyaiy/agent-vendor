'use client'
import React, { useState, useEffect } from 'react' // Import useEffect
import { useChat } from '@ai-sdk/react';
// Remove unused DbChat import
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent'; // Removed unused Model type import
import { ModelInfo } from "@/app/[agent-id]/settings/edit-agent-form"; // Import ModelInfo
import { authClient } from '@/lib/auth-client'; // Import authClient again
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
// Remove getChatTitleAction and useSWRConfig imports as they are now handled by the hook
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater'; // Import the custom hook

interface ChatProps {
  chatId: string;
  agent: Agent & { modelName: string; tags: Array<{ id: string; name: string }> };
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  models: ModelInfo[]; // Add models prop
  // selectedModelId and setSelectedModelId are managed internally
}


export default function Chat({
  agent,
  knowledgeItems,
  models, // Destructure models
  chatId,
  initialMessages,
  initialTitle
}: ChatProps) {
  // State for the selected model, initialized with the agent's primary model
  // State for the selected model, initialized with the agent's primary model DB UUID
  const [selectedModelId, setSelectedModelId] = useState<string>(agent.primaryModelId);
  // Use the custom hook to manage title state and update logic
  const { displayTitle, handleChatFinish } = useChatTitleUpdater(chatId, initialTitle);

  // Store the last visited agent ID in local storage
  useEffect(() => {
    if (agent?.id) {
      localStorage.setItem('lastVisitedAgentId', agent.id);
    }
  }, [agent?.id]);

  // Try using useSession hook from authClient
  const { data: session } = authClient.useSession(); // Assuming it returns { data: session } with session.user
  const user = session?.user; // Extract user from session

  
  const isOwner = agent.creatorId === user?.id; // Calculate isOwner using user from session


  // use the useChat hook to manage the chat state
  const {
    messages, 
    setMessages,
    handleSubmit, 
    input, 
    setInput,
    // append,
    status, 
    stop,
    reload
  } = useChat({
    id: chatId,
    body: {
      chatId: chatId,
      agentId: agent.id,
      systemPrompt: agent.systemPrompt,
      // Find the model string name corresponding to the selected UUID
      model: models.find(m => m.id === selectedModelId)?.model || agent.modelName // Fallback just in case
    },
    initialMessages,
    generateId: generateUUID,
    sendExtraMessageFields: true,
    // Use the handler function from the custom hook
    onFinish: handleChatFinish, 
  })

  // Remove the old useEffect for cleanup, as it's now handled within the hook

  // @ts-expect-error There's a version mismatch between UIMessage types
  const messagesProp: UIMessage[] = messages;

  return (
    <div className="grid grid-cols-12 min-w-0 h-full">
      {/* Main Chat Column */}
      <div className="flex flex-col min-w-0 h-full col-span-9 overflow-y-scroll">
        {/* Pass the fetched title to ChatHeader */}
        <ChatHeader
          hasMessages={messages.length > 0}
          agentName={agent.name}
          agentId={agent.id}
          chatTitle={displayTitle} // Pass the title here
        />
        {/* conditional rendering of messages and chat input */}
        {messages.length > 0 ? (
          <>
            <Messages
              chatId={chatId}
              status={status}
              messages={messagesProp}
              setMessages={setMessages}
              reload={reload}
              isReadonly={false}
              isArtifactVisible={false}
            />
            <ChatInput 
              chatId={chatId}
              agentId={agent.id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
            />
          </>
        ) : (
          <div className="flex items-center justify-center  h-full ">
            <div className="w-full flex flex-col mb-20 gap-10">
            <Greeting />
            
            <ChatInput 
              agentId={agent.id}
              chatId={chatId}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
            />
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Agent Details Column */}
      <div className="col-span-3 h-full max-h-full overflow-y-scroll sticky top-0 right-0">
        {/* Pass isOwner, knowledgeItems, selectedModelId, and setSelectedModelId down to AgentInfo */}
        <AgentInfo
          agent={agent}
          isOwner={isOwner}
          knowledgeItems={knowledgeItems}
          models={models} // Pass models down
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
        />
      </div>
    </div>
  )
}
