'use client'
import React, { useState, useEffect, useRef } from 'react' // Import useState, useEffect, useRef
import { useChat } from '@ai-sdk/react';
// Remove unused DbChat import
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent'; // Import Knowledge type
import { authClient } from '@/lib/auth-client'; // Import authClient again
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
import { getChatTitleAction } from '@/db/actions/chat-actions'; // Import the new action
import { useSWRConfig } from 'swr'; // Import useSWRConfig

interface ChatProps {
  chatId: string;
  agent: Agent & { modelName: string };
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null; // Add initialTitle prop
  knowledgeItems: Knowledge[]; // Add knowledgeItems prop
  // selectedModelId and setSelectedModelId are managed internally, not passed as props
}


export default function Chat({
  agent,
  knowledgeItems,
  chatId,
  initialMessages,
  initialTitle // Destructure initialTitle
}: ChatProps) { // Destructure knowledgeItems
  // State for the selected model, initialized with the agent's primary model
  const [selectedModelId, setSelectedModelId] = useState<string>(agent.modelName);
  // State for the chat title
  const [displayTitle, setDisplayTitle] = useState<string | null | undefined>(initialTitle);
  // Ref to store the retry timeout ID
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Get the mutate function from SWR config
  const { mutate } = useSWRConfig();
  // Define the SWR key (consistent with HistoryMenu)
  const SWR_KEY_RECENT_CHATS = 'userRecentChats';


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
    onFinish: async () => {
      // Clear any existing retry timeout before starting a new fetch sequence
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Fetch the updated title when AI finishes
      if (chatId) {
        try {
          const updatedTitle = await getChatTitleAction(chatId);
          
          if (updatedTitle === 'New Conversation') {
            // If title is still the default, set a timer to retry
            // First retry attempt after 3 seconds
            console.log('Title is "New Conversation", scheduling first retry (3s)...');
            retryTimeoutRef.current = setTimeout(async () => {
              try {
                console.log('Executing first retry fetch...');
                const firstRetryTitle = await getChatTitleAction(chatId);
                console.log('First retry fetch result:', firstRetryTitle);

                if (firstRetryTitle === 'New Conversation') {
                  // If still "New Conversation", schedule second retry after 5 seconds
                  console.log('Title still "New Conversation", scheduling second retry (5s)...');
                  retryTimeoutRef.current = setTimeout(async () => {
                    try {
                      console.log('Executing second retry fetch...');
                      const secondRetryTitle = await getChatTitleAction(chatId);
                      console.log('Second retry fetch result:', secondRetryTitle);
                      setDisplayTitle(secondRetryTitle); // Update with the final result
                      // Trigger SWR mutation for history menu
                      if (secondRetryTitle !== 'New Conversation') {
                        mutate(SWR_KEY_RECENT_CHATS);
                      }
                    } catch (secondRetryError) {
                      console.error("Failed to fetch updated chat title on second retry:", secondRetryError);
                    } finally {
                      retryTimeoutRef.current = null; // Clear ref after second retry execution
                    }
                  }, 3000); // Wait 3 seconds for the second retry
                } else {
                  // If first retry was successful, update title
                  setDisplayTitle(firstRetryTitle);
                  // Trigger SWR mutation for history menu
                  mutate(SWR_KEY_RECENT_CHATS);
                  retryTimeoutRef.current = null; // Clear ref as retry sequence is complete
                }
              } catch (firstRetryError) {
                console.error("Failed to fetch updated chat title on first retry:", firstRetryError);
                // Clear ref even if first retry fails
                retryTimeoutRef.current = null; 
              }
            }, 3000); // Wait 2 seconds for the first retry
          } else {
            // If initial title is valid, update immediately
            setDisplayTitle(updatedTitle);
            // Trigger SWR mutation for history menu
            mutate(SWR_KEY_RECENT_CHATS);
          }
        } catch (error) {
          console.error("Failed to fetch updated chat title:", error);
          // Optionally handle the error, e.g., show a toast notification
        }
      }
    },
  })

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

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
