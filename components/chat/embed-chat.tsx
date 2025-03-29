'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import type { Agent, KnowledgeItem } from '@/lib/db/schema';
import { useLocalStorage } from 'usehooks-ts';
import { ChatHeader } from '@/components/chat/chat-header';
import { generateUUID } from '@/lib/utils';
import { MultimodalInput } from '@/components/chat/multimodal-input';
import { Messages } from '@/components/chat/messages';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { ModelWithDefault } from './chat-model-selector';
import { VisibilityType } from '../util/visibility-selector';
import { Artifact } from '../artifact/artifact';
import { Overview } from '../util/overview';

// Define message types for cross-origin communication
interface EmbedMessage {
  type: string;
  data?: any;
}

export function EmbedChat({
  id,
  agent,
  availableModels = [],
  initialMessages,
  selectedChatModel,
  token,
  knowledgeItems = [],
  suggestedPrompts = []
}: {
  id: string;
  agent: Agent;
  availableModels?: ModelWithDefault[];
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  token: string;
  knowledgeItems?: KnowledgeItem[];
  suggestedPrompts?: string[];
}) {
  const { mutate } = useSWRConfig();
  const [currentModel, setCurrentModel] = useState<string>(selectedChatModel);
  
  // Always use public visibility in embedded context
  const selectedVisibilityType: VisibilityType = "public";
  const isReadonly = false;
  const isAuthenticated = true; // Token-based auth is already done
  
  // Use localStorage to persist search enabled state
  const [searchEnabledStorage, setSearchEnabledStorage] = useLocalStorage<boolean>('search-enabled', false);
  const [searchEnabled, setSearchEnabled] = useState<boolean>(searchEnabledStorage);
  
  // Add state for model settings with tracking of changed settings
  const [modelSettings, setModelSettings] = useState<{
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
    _changed?: {
      maxTokens?: boolean;
      temperature?: boolean;
      topP?: boolean;
      topK?: boolean;
      presencePenalty?: boolean;
      frequencyPenalty?: boolean;
    };
  }>({ _changed: {} });

  // First, define the functions and variables that will be used in useChat
  // Find the selected model details
  const selectedModelDetails = availableModels.find(model => model.id === currentModel);
  const modelIdentifier = selectedModelDetails?.model || selectedChatModel;

  // Process model settings to only include changed values
  const getProcessedModelSettings = () => {
    const processedSettings: any = {};
    const { _changed, ...settings } = modelSettings;
    
    if (!_changed) return {};
    
    Object.keys(settings).forEach((key) => {
      const settingKey = key as keyof typeof settings;
      if (_changed[settingKey]) {
        processedSettings[settingKey] = settings[settingKey];
      }
    });
    
    return processedSettings;
  };

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    data: toolCallData,
  } = useChat({
    id,
    body: { 
      id, 
      selectedChatModel: modelIdentifier,
      selectedModelId: currentModel,
      agentId: agent.id,
      creatorId: agent.creatorId,
      agentSystemPrompt: agent?.system_prompt,
      searchEnabled,
      knowledgeItems,
      modelSettings: getProcessedModelSettings(),
      embedToken: token // Pass the embed token for authentication
    },
    initialMessages,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      // Notify parent of new message
      window.parent.postMessage({
        type: 'MESSAGE_COMPLETE',
        data: { messageCount: messages.length + 1 }
      }, '*');
      
      mutate('/api/history');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : 'An error occurred, please try again!';
      
      // Notify parent of error
      window.parent.postMessage({
        type: 'CHAT_ERROR',
        data: { error: errorMessage }
      }, '*');
      
      toast.error(errorMessage);
    },
  });

  // Update localStorage when searchEnabled changes
  useEffect(() => {
    setSearchEnabledStorage(searchEnabled);
  }, [searchEnabled, setSearchEnabledStorage]);

  // Setup postMessage communication with parent window
  useEffect(() => {
    // Function to handle messages from parent
    const handleParentMessage = (event: MessageEvent<EmbedMessage>) => {
      // Validate message structure
      if (!event.data || typeof event.data !== 'object') return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'RESET_CHAT':
          // Reset chat by clearing messages
          setMessages([]);
          break;
        case 'SEND_MESSAGE':
          // Allow parent to send a message programmatically
          if (data?.message && typeof data.message === 'string') {
            setInput(data.message);
            // Use setTimeout to allow the input to update before submitting
            setTimeout(() => {
              const form = document.querySelector('form');
              if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
            }, 100);
          }
          break;
        // Add more message handlers as needed
      }
    };

    // Add event listener for messages from parent
    window.addEventListener('message', handleParentMessage);
    
    // Notify parent that embed is ready
    window.parent.postMessage({ type: 'EMBED_READY', data: { agentId: agent.id } }, '*');
    
    // Clean up event listener
    return () => {
      window.removeEventListener('message', handleParentMessage);
    };
  }, [agent.id, setMessages, setInput]);

  // Send chat status updates to parent
  useEffect(() => {
    window.parent.postMessage({
      type: 'CHAT_STATUS',
      data: { status }
    }, '*');
  }, [status]);

  // Handler for changing the model
  const handleModelChange = (modelId: string) => {
    setCurrentModel(modelId);
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh overflow-hidden bg-background">
        <ChatHeader
          chatId={id}
          agentId={agent.id}
          selectedModelId={currentModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          agent_display_name={agent.agent_display_name}
          thumbnail_url={agent.avatar_url || agent.thumbnail_url}
          modelSettings={modelSettings}
          setModelSettings={setModelSettings}
        />

        <div className="flex-1 min-h-0 relative">
          {messages.length > 0 ? (
            <Messages
              chatId={id}
              status={status}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              toolCallData={toolCallData}
              agent={agent}
            />
          ) : (
            <div className="flex flex-col h-full justify-center items-center px-4 md:px-8 gap-6">
              <div className="w-full md:max-w-3xl overflow-scroll overflow-x-hidden">
                <Overview agent={agent} />
              </div>
              
              <div className="w-full md:max-w-3xl">
                <MultimodalInput
                  isAuthenticated={isAuthenticated}
                  agentId={agent.id}
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={append}
                  availableModels={availableModels}
                  currentModel={currentModel}
                  onModelChange={handleModelChange}
                  isReadonly={isReadonly}
                  searchEnabled={searchEnabled}
                  setSearchEnabled={setSearchEnabled}
                  suggestedPrompts={suggestedPrompts}
                />
              </div>
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex flex-col mx-auto px-2 sm:px-4 bg-background pb-1 sm:pb-2 md:pb-4 gap-1 sm:gap-2 w-full md:max-w-3xl">
            <form className="flex flex-col w-full">
              <MultimodalInput
                isAuthenticated={isAuthenticated}
                agentId={agent.id}
                chatId={id}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
                availableModels={availableModels}
                currentModel={currentModel}
                onModelChange={handleModelChange}
                isReadonly={isReadonly}
                searchEnabled={searchEnabled}
                setSearchEnabled={setSearchEnabled}
                suggestedPrompts={suggestedPrompts}
              />
            </form>
          </div>
        )}
      </div>

      <Artifact
        isAuthenticated={isAuthenticated}
        chatId={id}
        agentId={agent.id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        isReadonly={isReadonly}
        searchEnabled={searchEnabled}
        setSearchEnabled={setSearchEnabled}
      />
    </>
  );
} 