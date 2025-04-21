'use client'
import React, { useState, useEffect, useCallback } from 'react' // Import useEffect, useCallback
import { useChat } from '@ai-sdk/react'; // Removed unused Message type import
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
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'; // Import the sign-in button
// Remove getChatTitleAction and useSWRConfig imports as they are now handled by the hook
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater'; // Import the custom hook
import { modelDetails, ModelSettings } from '@/lib/models'; // Import modelDetails and ModelSettings

interface ChatProps {
  chatId: string;
  agent: Agent & { modelName: string; tags: Array<{ id: string; name: string }> };
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  models: ModelInfo[]; // Add models prop
  // selectedModelId and setSelectedModelId are managed internally
}

// Helper function to get initial settings based on model ID
const getInitialChatSettings = (modelId: string, availableModels: ModelInfo[]): Record<string, number> => {
  const selectedModelInfo = availableModels.find(m => m.id === modelId);
  if (selectedModelInfo) {
    const details = modelDetails[selectedModelInfo.model];
    const defaultSettings = details?.defaultSettings;
    if (defaultSettings) {
      const initialSettings: Record<string, number> = {};
      for (const key in defaultSettings) {
        const settingKey = key as keyof ModelSettings;
        const settingConfig = defaultSettings[settingKey];
        if (settingConfig) {
          initialSettings[settingKey] = settingConfig.default;
        }
      }
      return initialSettings;
    }
  }
  return {}; // Return empty if no settings found
};

export default function Chat({
  agent,
  knowledgeItems,
  models, // Destructure models
  chatId,
  initialMessages,
  initialTitle
}: ChatProps) {
  // State for the selected model, initialized with the agent's primary model DB UUID
  const [selectedModelId, setSelectedModelId] = useState<string>(agent.primaryModelId);
  // State for the dynamic chat settings, initialized with defaults
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(agent.primaryModelId, models)
  );

  // Use the custom hook to manage title state and update logic
  const { displayTitle, handleChatFinish } = useChatTitleUpdater(chatId, initialTitle);

  // Store the last visited agent ID in local storage
  useEffect(() => {
    if (agent?.id) {
      localStorage.setItem('lastVisitedAgentId', agent.id);
    }
  }, [agent?.id]);

  // Effect to update chat settings ONLY when the selected model changes *after* initial load
  useEffect(() => {
    // We skip the initial calculation here as useState handles it
    // This effect now only handles *changes* to selectedModelId
    setChatSettings(getInitialChatSettings(selectedModelId, models));

  }, [selectedModelId, models]); // Rerun when model or available models change

  // Handler to update a specific chat setting
  const handleSettingChange = useCallback((settingName: string, value: number) => {
    setChatSettings(prev => ({ ...prev, [settingName]: value }));
  }, []);

  // Try using useSession hook from authClient
  const { data: session } = authClient.useSession(); // Assuming it returns { data: session } with session.user
  const user = session?.user; // Extract user from session

  
  const isOwner = agent.creatorId === user?.id; // Calculate isOwner using user from session


  // Prepare settings for the API call, mapping keys if necessary
  const apiSettings = { ...chatSettings };
  if (apiSettings.maxOutputTokens !== undefined) {
    apiSettings.maxTokens = apiSettings.maxOutputTokens;
    delete apiSettings.maxOutputTokens;
  }

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
      model: models.find(m => m.id === selectedModelId)?.model || agent.modelName, // Fallback just in case
      ...apiSettings // Spread the prepared settings into the body
    },
    initialMessages,
    generateId: generateUUID,
    sendExtraMessageFields: true,
    // Use the handler function from the custom hook
    onFinish: handleChatFinish, 
    onError: (error) => {
      console.log('Error from useChat:', error);
      // Check if the error indicates unauthorized access (401)
      if (error && error.message && (error.message.includes('Unauthorized') || error.message.includes('401'))) {
        // Append a specific message to the chat history
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: generateUUID(),
            role: 'assistant',
            content: '', // Add empty content to satisfy Message type
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
        {/* Pass isOwner, knowledgeItems, selectedModelId, setSelectedModelId, chatSettings, and handleSettingChange down to AgentInfo */}
        <AgentInfo
          agent={agent}
          isOwner={isOwner}
          knowledgeItems={knowledgeItems}
          models={models} // Pass models down
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
          chatSettings={chatSettings} // Pass settings state
          onSettingChange={handleSettingChange} // Pass settings handler
        />
      </div>
    </div>
  )
}
