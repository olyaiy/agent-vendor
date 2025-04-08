'use client'
import React from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';


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


  return (
    <div className="flex flex-col min-w-0 h-dvh">


    {messages.length > 0 && (
      <Messages
        chatId={id}
        status={status}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={false}
        isArtifactVisible={false}
      />
      )}

    <ChatInput 
    // status={"streaming"}
      value={input}
      onChange={handleInputChange}
      onSubmit={handleSubmit}
      status={status}
      stop={stop}
    />
  
</div>
  )
}

