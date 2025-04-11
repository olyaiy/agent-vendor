'use client'
import React, { useState } from 'react' // Import useState
import { useChat } from '@ai-sdk/react';
import useSWR from 'swr'; // Import useSWR
import type { Chat as DbChat } from '@/db/schema/chat'; // Import DB Chat type
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent'; // Import Knowledge type
import { authClient } from '@/lib/auth-client'; // Import authClient again
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';

interface ChatProps {
  chatId: string;
  agent: Agent & { modelName: string };
  initialMessages?: Array<UIMessage>;
  knowledgeItems: Knowledge[]; // Add knowledgeItems prop
  // selectedModelId and setSelectedModelId are managed internally, not passed as props
}

// Simple fetcher function for SWR
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    // Specifically handle 404 Not Found by returning null
    if (res.status === 404) {
      return null; // Indicate resource not found yet, not an error
    }
    // For other errors, create and throw an error object
    const error = new Error('An error occurred while fetching the data.');
    // @ts-expect-error - Adding custom properties info/status to Error object
    error.info = res.statusText;
    // @ts-expect-error - Adding custom properties info/status to Error object
    error.status = res.status;
    throw error;
  }
  return res.json();
});


export default function Chat({ 
  agent, 
  knowledgeItems, 
  chatId, 
  initialMessages 
}: ChatProps) { // Destructure knowledgeItems
  // State for the selected model, initialized with the agent's primary model
  const [selectedModelId, setSelectedModelId] = useState<string>(agent.modelName);


  
  // Fetch chat data using SWR
  const { data: chatData, error: chatError, mutate } = useSWR<DbChat | null>( // Allow null type, add mutate
    chatId ? `/api/chat/${chatId}` : null, // API endpoint URL, conditional on chatId
    fetcher,
    {
      revalidateOnFocus: true, // Optional: Revalidate when window gets focus
      onError: (err) => { // Log actual SWR errors
        console.error("SWR Error fetching chat data:", err);
      }
    }
  );

  // Log chatError if it occurs (fixes linter warning)
  if (chatError) {
    console.error("Error loading chat data:", chatError);
  }

  // Determine the title to display
  const displayTitle = chatData?.title;

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
      agentId: agent.id,
      systemPrompt: agent.systemPrompt,
      model: selectedModelId // Use the state variable for the model
    },
    initialMessages,
    generateId: generateUUID,
    sendExtraMessageFields: true,
    onFinish: () => {
      // Revalidate the chat data (e.g., to fetch updated title) when AI finishes
      mutate(); 
    },
  })

  

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
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
        />
      </div>
    </div>
  )
}
