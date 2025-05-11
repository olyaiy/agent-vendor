'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
import type { Tool } from '@/db/schema/tool';
// Removed unused ModelInfo import
// import { authClient } from '@/lib/auth-client'; // Removed as it's no longer used
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
  agent: Agent & { tags: Array<{ id: string; name: string }> };
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  agentModels: AgentSpecificModel[];
  agentSlug: string;
  assignedTools: Tool[];
  isOwner: boolean;
}

// Helper function to get initial settings based on model ID
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

export default function Chat({
  agent,
  knowledgeItems,
  agentModels,
  chatId,
  initialMessages,
  initialTitle,
  agentSlug,
  assignedTools,
  isOwner
}: ChatProps) {

  const assignedToolNames = assignedTools.map(tool => tool.name);

  const primaryModel = agentModels.find(m => m.role === 'primary');
  const initialModelId = primaryModel ? primaryModel.modelId : (agentModels.length > 0 ? agentModels[0].modelId : '');

  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(initialModelId, agentModels)
  );

  const { displayTitle, handleChatFinish } = useChatTitleUpdater(chatId, initialTitle);

  useEffect(() => {
    if (agentSlug) {
      localStorage.setItem('lastVisitedAgentSlug', agentSlug);
    }
  }, [agentSlug]);

  useEffect(() => {
    setChatSettings(getInitialChatSettings(selectedModelId, agentModels));
  }, [selectedModelId, agentModels]);

  const handleSettingChange = useCallback((settingName: string, value: number) => {
    setChatSettings(prev => ({ ...prev, [settingName]: value }));
  }, []);

  // const { data: session } = authClient.useSession(); // Removed
  // const user = session?.user; // Removed

  // const isOwner = agent.creatorId === user?.id; // Removed, now passed as prop

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
      console.log('Error from useChat:', error);
      if (error && error.message && (error.message.includes('Unauthorized') || error.message.includes('401'))) {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: generateUUID(),
            role: 'assistant',
            content: '',
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
    <div className="grid grid-cols-12 min-w-0 h-full">
      <div className="flex flex-col min-w-0 h-full col-span-9 overflow-y-scroll">
        <ChatHeader
          hasMessages={messages.length > 0}
          agentName={agent.name}
          agentId={agent.id}
          agentSlug={agentSlug}
          chatTitle={displayTitle}
        />
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
              userId={agent.creatorId} // Or a more appropriate user ID if available, session.user.id is no longer here
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
              userId={agent.creatorId} // Or a more appropriate user ID if available, session.user.id is no longer here
              agentSlug={agentSlug}
              chatId={chatId}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              minHeight={64}
            />
            </div>
          </div>
        )}
      </div>

      <div className="col-span-3 h-full max-h-full overflow-y-scroll sticky top-0 right-0">
        <AgentInfo
          agent={agent}
          isOwner={isOwner}
          knowledgeItems={knowledgeItems}
          models={agentModels}
          selectedModelId={selectedModelId}
          setSelectedModelId={setSelectedModelId}
          chatSettings={chatSettings}
          onSettingChange={handleSettingChange}
          assignedTools={assignedTools} // Pass assignedTools to AgentInfo
        />
      </div>
    </div>
  )
}
