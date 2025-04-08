'use client'
import React from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';

export default function Chat() {
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
  } = useChat()

  // @ts-expect-error There's a version mismatch between UIMessage types
  const messagesProp: UIMessage[] = messages;

  return (
    <div className="grid grid-cols-12 min-w-0 h-dvh">
      {/* Main Chat Column */}
      <div className="flex flex-col min-w-0 h-dvh col-span-9">
        <ChatHeader hasMessages={messages.length > 0} />
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
        <AgentInfo />
      </div>
    </div>
  )
}

