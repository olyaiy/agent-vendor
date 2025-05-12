'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { MobileAgentHeader } from './chat/MobileAgentHeader';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
import type { Tool } from '@/db/schema/tool';
import { Greeting } from './chat/greeting';
import { generateUUID } from '@/lib/utils';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useChatTitleUpdater } from '@/hooks/use-chat-title-updater';
import { authClient } from '@/lib/auth-client';
import { modelDetails, type ModelSettings } from '@/lib/models';

interface AgentSpecificModel {
  agentId: string;
  modelId: string;
  role: 'primary' | 'secondary';
  model: string;
  description?: string | null;
  id: string;
}

interface ChatMobileProps {
  chatId: string;
  agent: Agent & { tags: Array<{ id: string; name: string }> }; // Updated to expect tags
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  agentModels: AgentSpecificModel[];
  assignedTools: Tool[];
}

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
  agent, // agent prop now includes tags
  knowledgeItems,
  agentModels,
  chatId,
  initialMessages,
  initialTitle,
  assignedTools
}: ChatMobileProps) {

  const assignedToolNames = assignedTools.map(tool => tool.name);

  const primaryModel = agentModels.find(m => m.role === 'primary');
  const initialModelId = primaryModel ? primaryModel.modelId : (agentModels.length > 0 ? agentModels[0].modelId : '');

  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(initialModelId, agentModels)
  );

  const { handleChatFinish } = useChatTitleUpdater(chatId, initialTitle);

  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agent?.id) {
      localStorage.setItem('lastVisitedAgentId', agent.id);
    }
  }, [agent?.id]);

  useEffect(() => {
    setChatSettings(getInitialChatSettings(selectedModelId, agentModels));
  }, [selectedModelId, agentModels]);

  const handleSettingChange = useCallback((settingName: string, value: number) => {
    setChatSettings(prev => ({ ...prev, [settingName]: value }));
  }, []);

  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isOwner = agent.creatorId === user?.id;

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
      model: agentModels.find(m => m.modelId === selectedModelId)?.model || '',
      ...apiSettings,
      assignedToolNames: assignedToolNames
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
    <div className="flex flex-col h-full px-2">
      <MobileAgentHeader
        agent={agent} // agent prop now correctly includes tags due to updated ChatMobileProps
        isOwner={isOwner}
        knowledgeItems={knowledgeItems}
        models={agentModels}
        selectedModelId={selectedModelId}
        setSelectedModelId={setSelectedModelId}
        chatSettings={chatSettings}
        onSettingChange={handleSettingChange}
        assignedTools={assignedTools}
      />

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
            externalScrollContainerRef={mobileScrollContainerRef}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-full px-4 flex flex-col mb-4 gap-4">
              <Greeting />
            </div>
          </div>
        )}
      </div>

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
        />
      </div>
    </div>
  )
}