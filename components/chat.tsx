'use client'
import React, { useState } from 'react' // Import useState
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent'; // Import Knowledge type
import { authClient } from '@/lib/auth-client'; // Import authClient again
import { Greeting } from './chat/greeting';

interface ChatProps {
  chatId: string;
  agent: Agent & { modelName: string };
  knowledgeItems: Knowledge[]; // Add knowledgeItems prop
  // selectedModelId and setSelectedModelId are managed internally, not passed as props
}

export default function Chat({ agent, knowledgeItems, chatId }: ChatProps) { // Destructure knowledgeItems
  // State for the selected model, initialized with the agent's primary model
  const [selectedModelId, setSelectedModelId] = useState<string>(agent.modelName);

  // Try using useSession hook from authClient
  const { data: session } = authClient.useSession(); // Assuming it returns { data: session } with session.user
  const user = session?.user; // Extract user from session

  const isOwner = agent.creatorId === user?.id; // Calculate isOwner using user from session


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
      systemPrompt: agent.systemPrompt,
      model: selectedModelId // Use the state variable for the model
    }
  })

  

  // @ts-expect-error There's a version mismatch between UIMessage types
  const messagesProp: UIMessage[] = messages;

  return (
    <div className="grid grid-cols-12 min-w-0 h-full">
      {/* Main Chat Column */}
      <div className="flex flex-col min-w-0 h-full col-span-9 overflow-y-scroll">
        <ChatHeader hasMessages={messages.length > 0} agentName={agent.name} agentId={agent.id} />
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
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
        />
      </div>
    </div>
  )
}
