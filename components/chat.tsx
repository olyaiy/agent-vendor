'use client'
import React from 'react'
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { AgentInfo } from './agent-info';
import { ChatHeader } from './chat/chat-header';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
import type { Tool } from '@/db/schema/tool';
import { Greeting } from './chat/greeting';
import { useChatManager, type AgentSpecificModel } from '@/hooks/use-chat-manager';
import { useAttachmentManager } from '@/hooks/use-attachment-manager';
import { useDragDrop } from '@/hooks/use-drag-drop';
import type { ChatRequestOptions } from '@ai-sdk/ui-utils';
import { Switch } from '@/components/ui/switch';

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

  // Use the chat manager hook for all chat-related state
  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    status,
    stop,
    reload,
    selectedModelId,
    setSelectedModelId,
    chatSettings,
    handleSettingChange,
    displayTitle,
    isWebSearchEnabled
  } = useChatManager({
    chatId,
    agent,
    agentModels,
    assignedTools,
    initialMessages,
    initialTitle,
    agentSlug
  });

  // Use the attachment manager hook
  const attachmentManager = useAttachmentManager({ userId: agent.creatorId });

  // Use the drag and drop hook
  const { isDraggingOver, dragHandlers } = useDragDrop({
    onFilesDropped: attachmentManager.processFilesForAttachment
  });

  // Local state to toggle the upcoming artifact view (dev only)
  const [isArtifactVisible, setIsArtifactVisible] = React.useState(false);

  // Enhanced submit handler that includes attachment data
  const handleEnhancedSubmit = React.useCallback((
    event?: { preventDefault?: (() => void) | undefined; } | undefined, 
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => {
    const { regularAttachments, csvAttachments } = attachmentManager.getAttachmentPayloads();
    
    const enhancedOptions = { ...chatRequestOptions };
    
    if (regularAttachments.length > 0) {
      enhancedOptions.experimental_attachments = regularAttachments;
    }
    
    if (csvAttachments.length > 0) {
      enhancedOptions.body = {
        ...enhancedOptions.body,
        csv_attachment_payloads: csvAttachments
      };
    }
    
    handleSubmit(event, enhancedOptions);
    attachmentManager.clearAttachments();
  }, [handleSubmit, attachmentManager]);

  // @ts-expect-error There's a version mismatch between UIMessage types
  const messagesProp: UIMessage[] = messages;

  return (
    <div 
      className="relative min-w-0 h-full overflow-hidden"
      {...dragHandlers}
    >
      {/* Dev toggle – remove when feature is final */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-background/70 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm">
        <span className="text-xs text-muted-foreground">Artifact</span>
        <Switch checked={isArtifactVisible} onCheckedChange={setIsArtifactVisible} />
      </div>

      {/* Unified Layout - Single container with smooth flex transitions */}
      <div className="h-full flex transition-all duration-500 ease-in-out">
        {/* Chat Section - Compresses from 75% to 30% when artifact is visible */}
        <div 
          className={`flex flex-col min-w-0 h-full overflow-y-scroll transition-all duration-500 ease-in-out ${
            isArtifactVisible ? 'flex-[0_0_30%]' : 'flex-[0_0_75%]'
          }`}
        >
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
                isArtifactVisible={isArtifactVisible}
              />
              <ChatInput
                userId={agent.creatorId}
                chatId={chatId}
                agentSlug={agentSlug}
                input={input}
                setInput={setInput}
                handleSubmit={handleEnhancedSubmit}
                status={status}
                stop={stop}
                isWebSearchEnabled={isWebSearchEnabled}
                showDropZoneIndicator={isDraggingOver}
                pendingAttachments={attachmentManager.pendingAttachments}
                setPendingAttachments={attachmentManager.setPendingAttachments}
                processFilesForAttachment={attachmentManager.processFilesForAttachment}
                handleRemoveAttachment={attachmentManager.handleRemoveAttachment}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-full flex flex-col mb-20 gap-10">
                <Greeting agent={agent} />
                <ChatInput
                  userId={agent.creatorId}
                  agentSlug={agentSlug}
                  chatId={chatId}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleEnhancedSubmit}
                  status={status}
                  stop={stop}
                  minHeight={64}
                  isWebSearchEnabled={isWebSearchEnabled}
                  showDropZoneIndicator={isDraggingOver}
                  pendingAttachments={attachmentManager.pendingAttachments}
                  setPendingAttachments={attachmentManager.setPendingAttachments}
                  processFilesForAttachment={attachmentManager.processFilesForAttachment}
                  handleRemoveAttachment={attachmentManager.handleRemoveAttachment}
                />
              </div>
            </div>
          )}
        </div>

        {/* Agent Info Section - Compresses to 0% and fades out when artifact is visible */}
        <div 
          className={`h-full max-h-full overflow-y-scroll sticky top-0 right-0 transition-all duration-500 ease-in-out ${
            isArtifactVisible ? 'flex-[0_0_0%] opacity-0' : 'flex-[0_0_25%] opacity-100'
          }`}
        >
          <AgentInfo
            agent={agent}
            isOwner={isOwner}
            knowledgeItems={knowledgeItems}
            models={agentModels}
            selectedModelId={selectedModelId}
            setSelectedModelId={setSelectedModelId}
            chatSettings={chatSettings}
            onSettingChange={handleSettingChange}
            assignedTools={assignedTools}
          />
        </div>

        {/* Artifact Panel - Expands from 0% to 70% when artifact is visible */}
        <div 
          className={`h-full bg-muted/20 border-l transition-all duration-500 ease-in-out overflow-hidden ${
            isArtifactVisible 
              ? 'flex-[0_0_70%] opacity-100' 
              : 'flex-[0_0_0%] opacity-0'
          }`}
        >
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-2xl mb-2">🎨</div>
              <p className="text-sm">Artifact content will appear here</p>
              <p className="text-xs mt-1">Generated by AI tools</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
