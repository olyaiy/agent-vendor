'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react' // Import useRef, useState, useCallback
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { MobileAgentHeader } from './chat/MobileAgentHeader'; // Use the mobile header
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
import type { Tool } from '@/db/schema/tool'; // Added import for Tool type
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater';
import { authClient } from '@/lib/auth-client'; // Added
import { modelDetails, type ModelSettings } from '@/lib/models'; // Added

// Define the type for models associated with the agent (same as in chat.tsx)
interface AgentSpecificModel {
  agentId: string;
  modelId: string;
  role: 'primary' | 'secondary';
  model: string; // The actual model name, e.g., 'claude-3-haiku'
  description?: string | null;
  id: string; // Alias for modelId
}

interface ChatMobileProps {
  chatId: string;
  agent: Agent;
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  agentModels: AgentSpecificModel[];
  assignedTools: Tool[]; // Added new prop
}

// Helper function to get initial settings based on model ID (copied from chat.tsx)
const getInitialChatSettings = (modelId: string, agentModels: AgentSpecificModel[]): Record<string, number> => {
  const selectedModelInfo = agentModels.find(m => m.modelId === modelId);
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
  return {};
};


export default function ChatMobile({
  agent,
  knowledgeItems, // Now used
  agentModels,
  chatId,
  initialMessages,
  initialTitle,
  assignedTools // Destructure new prop
}: ChatMobileProps) {

  // Derive tool names from assignedTools prop
  const assignedToolNames = assignedTools.map(tool => tool.name);

  // Find the primary model from the agentModels prop
  const primaryModel = agentModels.find(m => m.role === 'primary');
  // Get the name of the primary model for useChat, fallback if needed
  // const primaryModelNameForChat = primaryModel ? primaryModel.model : (agentModels.length > 0 ? agentModels[0].model : '');
  // Determine initial model ID for settings
  const initialModelId = primaryModel ? primaryModel.modelId : (agentModels.length > 0 ? agentModels[0].modelId : '');


  // State for the selected model, initialized with the derived primary model ID
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  // State for the dynamic chat settings, initialized with defaults
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(initialModelId, agentModels)
  );

  const { handleChatFinish } = useChatTitleUpdater(chatId, initialTitle);

  // Ref for the mobile scroll container
  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agent?.id) {
      localStorage.setItem('lastVisitedAgentId', agent.id);
    }
  }, [agent?.id]);

  // Effect to update chat settings ONLY when the selected model changes *after* initial load
  useEffect(() => {
    setChatSettings(getInitialChatSettings(selectedModelId, agentModels));
  }, [selectedModelId, agentModels]);

  // Handler to update a specific chat setting
  const handleSettingChange = useCallback((settingName: string, value: number) => {
    setChatSettings(prev => ({ ...prev, [settingName]: value }));
  }, []);

  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isOwner = agent.creatorId === user?.id;

  // Prepare settings for the API call, mapping keys if necessary
  const apiSettings = { ...chatSettings };
  if (apiSettings.maxOutputTokens !== undefined) {
    apiSettings.maxTokens = apiSettings.maxOutputTokens;
    delete apiSettings.maxOutputTokens;
  }

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
      // Find the model string name corresponding to the selected UUID using agentModels
      model: agentModels.find(m => m.modelId === selectedModelId)?.model || '', // Fallback to empty string or handle error if not found
      ...apiSettings, // Spread the prepared settings into the body
      assignedToolNames: assignedToolNames // Send the array of tool names
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
      <MobileAgentHeader
        agent={agent}
        hasMessages={messages.length > 0}
        isOwner={isOwner}
        knowledgeItems={knowledgeItems}
        models={agentModels}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
        chatSettings={chatSettings}
        onSettingChange={handleSettingChange}
      />

      {/* Messages Area - takes remaining space and scrolls */}
      {/* Attach the ref here */}
      <div ref={mobileScrollContainerRef} className="flex-grow overflow-y-auto">
        {messages.length > 0 ? (
          <Messages
            chatId={chatId}
            status={status}
            messages={messagesProp}
            setMessages={setMessages}
            reload={reload}
            isReadonly={false}
            isArtifactVisible={false}
            // Pass the ref down
            externalScrollContainerRef={mobileScrollContainerRef}
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
      <div className="mt-auto ">
        <ChatInput
          userId={user?.id || ''}
          chatId={chatId}
          agentSlug={agent.slug || ''}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          status={status}
          stop={stop}
          className=" px-2 bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]"
          isMobile={true}
          minHeight={12}
          // Removed hasMessages prop
        />
      </div>
    </div>
  )
}