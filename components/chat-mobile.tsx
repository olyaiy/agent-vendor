'use client'
import React, { useRef } from 'react'
import { ChatInput } from './ui/chat-input';
import { Messages } from './chat/messages';
import { MobileAgentHeader } from './chat/MobileAgentHeader';
import type { UIMessage } from 'ai';
import type { Agent, Knowledge } from '@/db/schema/agent';
import type { Tool } from '@/db/schema/tool';
import { Greeting } from './chat/greeting';
import { authClient } from '@/lib/auth-client';
import { useChatManager, type AgentSpecificModel } from '@/hooks/use-chat-manager';
import { useAttachmentManager } from '@/hooks/use-attachment-manager';
import type { ChatRequestOptions } from '@ai-sdk/ui-utils';

interface ChatMobileProps {
  chatId: string;
  agent: Agent & { tags: Array<{ id: string; name: string }> };
  initialMessages?: Array<UIMessage>;
  initialTitle?: string | null;
  knowledgeItems: Knowledge[];
  agentModels: AgentSpecificModel[];
  assignedTools: Tool[];
}

export default function ChatMobile({
  agent,
  knowledgeItems,
  agentModels,
  chatId,
  initialMessages,
  initialTitle,
  assignedTools
}: ChatMobileProps) {

  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  
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
    isWebSearchEnabled
  } = useChatManager({
    chatId,
    agent,
    agentModels,
    assignedTools,
    initialMessages,
    initialTitle
  });

  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isOwner = agent.creatorId === user?.id;

  // Use the attachment manager hook
  const attachmentManager = useAttachmentManager({ userId: user?.id || '' });

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
    <div className="flex flex-col h-full px-2">
      <MobileAgentHeader
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
              <Greeting agent={agent} isMobile={true} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <ChatInput
          userId={user?.id || ''}
          chatId={chatId}
          agentSlug={agent.slug || ''}
          input={input}
          setInput={setInput}
          handleSubmit={handleEnhancedSubmit}
          status={status}
          stop={stop}
          className="px-2 bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.5)]"
          isMobile={true}
          minHeight={12}
          isWebSearchEnabled={isWebSearchEnabled}
          pendingAttachments={attachmentManager.pendingAttachments}
          setPendingAttachments={attachmentManager.setPendingAttachments}
          processFilesForAttachment={attachmentManager.processFilesForAttachment}
          handleRemoveAttachment={attachmentManager.handleRemoveAttachment}
        />
      </div>
    </div>
  )
}