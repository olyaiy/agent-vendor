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
import type { ChatRequestOptions } from 'ai';
import { CreditErrorDialog } from './credit-error-dialog';
import { isReasoningModel } from '@/lib/models';

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
    isWebSearchEnabled,
    showCreditDialog,
    setShowCreditDialog,
    creditBalance
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

  const selected = agentModels.find(m => m.modelId === selectedModelId);
  const hideReasoning = !agent.showReasoning && selected && isReasoningModel(selected.model);

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
      className="grid grid-cols-12 min-w-0 h-full"
      {...dragHandlers}
    >
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
              hideReasoning={hideReasoning}
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
          assignedTools={assignedTools}
        />
      </div>
      
      <CreditErrorDialog 
        open={showCreditDialog}
        onOpenChange={setShowCreditDialog}
        creditBalance={creditBalance}
        agentSlug={agentSlug}
      />
    </div>
  )
}
