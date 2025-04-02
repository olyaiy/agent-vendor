/**
 * Core chat interface handling user interactions with AI agents.
 * 
 * Key responsibilities:
 * - Manage chat session state and message history
 * - Handle multi-modal inputs (text + attachments)
 * - Configure and switch between different AI models
 * - Integrate with authentication and authorization systems
 * - Persist user preferences and recent agents
 */
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
import { AuthPopup } from '@/components/auth/auth-popup';
import Link from 'next/link';
import { ArrowUpIcon, PaperclipIcon } from '@/components/util/icons';
import { ReadOnlyPrompt } from '@/components/chat/readonly-prompt';

// Data types and core interfaces
interface ModelSettings {
  /** 
   * LLM parameters with change tracking. Only modified values 
   * are sent to the API to preserve default behaviors 
   */
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  // Track which settings have been explicitly changed by the user
  _changed?: Record<string, boolean>;
}

// Define a minimal type for group agent display
interface GroupAgentDisplayInfo {
  id: string;
  agent_display_name: string | null;
  avatar_url?: string | null;
  thumbnail_url?: string | null;
}

export function Chat({
  id,
  agent,
  availableModels = [],
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
  isAuthenticated,
  suggestedPrompts = [],
  knowledgeItems = [],
  isGroupChat = false,
  groupAgents,
  groupChatTitle
}: {
  /** Unique session identifier for chat history management */
  id: string;
  /** Configured agent with system prompt and settings */
  agent: Agent;
  availableModels?: ModelWithDefault[];
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  isAuthenticated: boolean;
  suggestedPrompts?: string[];
  knowledgeItems?: KnowledgeItem[];
  isGroupChat?: boolean;
  groupAgents?: GroupAgentDisplayInfo[]; // Use the minimal type
  groupChatTitle?: string;
}) {
  const { mutate } = useSWRConfig();
  const [currentModel, setCurrentModel] = useState<string>(selectedChatModel);
  
  /**
   * Search functionality state
   * - Persisted in localStorage for continuity between sessions
   * - Toggles RAG integration with knowledge base
   */
  const [searchEnabledStorage, setSearchEnabledStorage] = useLocalStorage<boolean>('search-enabled', false);
  const [searchEnabled, setSearchEnabled] = useState<boolean>(searchEnabledStorage);
  
  /**
   * Model configuration lifecycle
   * - Tracks user-modified settings separately from defaults
   * - Only sends changed values to API endpoints
   */
  const [modelSettings, setModelSettings] = useState<ModelSettings>({ _changed: {} });
  
  /**
   * Authentication error handling
   * - Captures unauthorized responses
   * - Preserves draft input during login flow
   * - Manages modal state for auth popup
   */
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);

  // Update localStorage when searchEnabled changes
  useEffect(() => {
    setSearchEnabledStorage(searchEnabled);
  }, [searchEnabled, setSearchEnabledStorage]);

  // Add recent agent tracking
  useEffect(() => {
    // Get current recent agents from localStorage
    const recentAgents = JSON.parse(
      localStorage.getItem('recent-agents') || '[]'
    );
    
    // Update with current agent (remove duplicates and limit to 5)
    const updatedAgents = [
      agent.id,
      ...recentAgents.filter((id: string) => id !== agent.id)
    ].slice(0, 5);

    // Save back to localStorage
    localStorage.setItem('recent-agents', JSON.stringify(updatedAgents));
  }, [agent.id]); // Only run when agent.id changes

  // Find the selected model details
  const selectedModelDetails = availableModels.find(model => model.id === currentModel);
  const modelIdentifier = selectedModelDetails?.model || selectedChatModel;

  /**
   * Filters model settings to only include user-modified values
   * prevents overriding default model behaviors when unchanged
   */
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

  /**
   * Chat core functionality using AI SDK
   * - Handles message streaming and tool calls
   * - Manages API error states
   * - Integrates with SWR for data revalidation
   */
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
      selectedChatModel: modelIdentifier, // The model name/identifier for the AI request
      selectedModelId: currentModel, // The actual database model ID for saving
      agentId: agent.id,
      creatorId: agent.creatorId,
      agentSystemPrompt: agent?.system_prompt,
      searchEnabled, // Pass the search toggle state to the API
      knowledgeItems, // Pass the knowledge items to the API
      modelSettings: getProcessedModelSettings() // Pass only changed model settings to the API
    },
    initialMessages,
    // experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: (error) => {
      // Unified error handling pipeline
      handleChatError(error);
    },
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Handler for changing the model
  const handleModelChange = async (modelId: string) => {
    setCurrentModel(modelId);
    // We don't need to update the chat - next message will use the new model
  };

  /**
   * Centralized error handler for chat operations
   * - Distinguishes auth errors from operational failures
   * - Preserves user input during auth flows
   * - Integrates with notification system
   */
  const handleChatError = (error: unknown) => {
    // Check for unauthorized error
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'An error occurred, please try again!';
    
    // Check if this is an unauthorized error
    if (
      errorMessage.includes('Unauthorized') || 
      (error instanceof Error && error.message.includes('Unauthorized'))
    ) {
      // Save input to localStorage before showing auth popup
      if (input && input.trim() !== '' && input.trim().length > 1) {
        localStorage.setItem('input', JSON.stringify(input));
      }

      // Show auth popup instead of error toast
      setIsAuthPopupOpen(true);
    } else {
      // Show regular error toast for other errors
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className={`flex flex-col min-w-0 h-dvh overflow-hidden 
      bg-background
      `}>
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
              <div className="w-full md:max-w-3xl overflow-scroll  overflow-x-hidden">
                <Overview 
                  agent={agent} 
                  isGroupChat={isGroupChat} 
                  groupAgents={groupAgents}
                  groupChatTitle={groupChatTitle}
                />
              </div>
              
              {!isReadonly && (
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
              )}
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div className="flex flex-col mx-auto px-2 sm:px-4 bg-background pb-1 sm:pb-2 md:pb-4 gap-1 sm:gap-2 w-full md:max-w-3xl">
            {isReadonly ? (
              <ReadOnlyPrompt agent={agent} />
            ) : (
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
            )}
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

      {/* Auth popup for unauthorized errors */}
      <AuthPopup 
        isOpen={isAuthPopupOpen} 
        onOpenChange={setIsAuthPopupOpen}
      />
    </>
  );
}
