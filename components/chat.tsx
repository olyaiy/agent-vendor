'use client'
import React, { useState, useEffect, useCallback } from 'react' 
import { useChat } from '@ai-sdk/react'; 
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
// Removed unused ModelInfo import
import { authClient } from '@/lib/auth-client';
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'; 
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater'; 
import { modelDetails, ModelSettings } from '@/lib/models';

// Define the type for models associated with the agent
export interface AgentSpecificModel {
  agentId: string;
  modelId: string;
  role: 'primary' | 'secondary';
  model: string; // The actual model name, e.g., 'claude-3-haiku'
  description?: string | null;
  // Alias modelId as id for consistency within this component
  id: string;
}

interface ChatProps {
  chatId: string;
  agent: Agent & { tags: Array<{ id: string; name: string }> }; // Re-add tags to agent type definition
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  agentModels: AgentSpecificModel[]; // Use the new prop type
  agentSlug: string;
}

// Helper function to get initial settings based on model ID
const getInitialChatSettings = (modelId: string, agentModels: AgentSpecificModel[]): Record<string, number> => {
  const selectedModelInfo = agentModels.find(m => m.modelId === modelId); // Use modelId and agentModels
  if (selectedModelInfo) {
    const details = modelDetails[selectedModelInfo.model]; // Use model string name from agentModel
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
  agentModels, // Destructure agentModels instead of models
  chatId,
  initialMessages,
  initialTitle,
  agentSlug
}: ChatProps) {


  // Find the primary model from the agentModels prop
  const primaryModel = agentModels.find(m => m.role === 'primary');
  // Provide a fallback if no primary model is found (e.g., use the first available model)
  // Consider adding logging or error handling if agentModels is empty.
  const initialModelId = primaryModel ? primaryModel.modelId : (agentModels.length > 0 ? agentModels[0].modelId : '');

  // State for the selected model, initialized with the derived primary model ID
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  // State for the dynamic chat settings, initialized with defaults using the new prop
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(initialModelId, agentModels) // Use initialModelId and agentModels
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
    setChatSettings(getInitialChatSettings(selectedModelId, agentModels)); // Use agentModels

  }, [selectedModelId, agentModels]); // Rerun when model or agentModels change

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
      // Find the model string name corresponding to the selected UUID using agentModels
      model: agentModels.find(m => m.modelId === selectedModelId)?.model || '', // Fallback to empty string or handle error if not found
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
              agentSlug={agentSlug}
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
              agentSlug={agentSlug}
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
          models={agentModels} // Pass agentModels down instead of models
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
          chatSettings={chatSettings} // Pass settings state
          onSettingChange={handleSettingChange} // Pass settings handler
        />
      </div>
    </div>
  )
}
