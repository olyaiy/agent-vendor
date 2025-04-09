'use client'
import React from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent } from '@/db/schema/agent';
import { authClient } from '@/lib/auth-client'; // Import authClient again

interface ChatProps {
  agent: Agent & { modelName: string };
  // No isOwner prop needed here anymore, it's calculated internally
}

export default function Chat({ agent }: ChatProps) {

  // Try using useSession hook from authClient
  const { data: session } = authClient.useSession(); // Assuming it returns { data: session } with session.user
  const user = session?.user; // Extract user from session

  // Debugging logs for isOwner calculation
  console.log("Chat - Agent Creator ID:", agent.creatorId);
  console.log("Chat - Current User ID:", user?.id);
  const isOwner = agent.creatorId === user?.id; // Calculate isOwner using user from session
  console.log("Chat - Calculated isOwner:", isOwner);

  const {
    id,
    messages, 
    setMessages,
    input, 
    handleInputChange, 
    handleSubmit, 
    status, 
    stop,
    reload
  } = useChat({
    body: {
      systemPrompt: agent.systemPrompt,
      model: agent.modelName
    }
  })

  

  // @ts-expect-error There's a version mismatch between UIMessage types
  const messagesProp: UIMessage[] = messages;

  return (
    <div className="grid grid-cols-12 min-w-0 h-dvh">
      {/* Main Chat Column */}
      <div className="flex flex-col min-w-0 h-dvh col-span-9">
        <ChatHeader hasMessages={messages.length > 0} agentName={agent.name} agentId={agent.id} />
        {/* conditional rendering of messages and chat input */}
        {messages.length > 0 ? (
          <>
            <Messages
              chatId={id}
              status={status}
              messages={messagesProp}
              setMessages={setMessages}
              reload={reload}
              isReadonly={false}
              isArtifactVisible={false}
            />
            <ChatInput 
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              status={status}
              stop={stop}
            />
          </>
        ) : (
          <div className="items-center justify-center flex h-full">
            <ChatInput 
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              status={status}
              stop={stop}
            />
          </div>
        )}
      </div>

      {/* Sidebar Agent Details Column */}
      <div className="col-span-3 h-dvh sticky top-0 right-0">
        {/* Pass isOwner down to AgentInfo */}
        <AgentInfo agent={agent} isOwner={isOwner} />
      </div>
    </div>
  )
}

