'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react';
import { ChatInput, PendingAttachment, CHAT_ATTACHMENT_MAX_FILE_SIZE, CHAT_ATTACHMENT_ALLOWED_FILE_TYPES } from './ui/chat-input';
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
import { toast } from 'sonner';
import { uploadChatAttachmentAction, deleteChatAttachmentAction } from "@/db/actions/chat-attachment.actions";

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
  const isWebSearchEnabled = assignedToolNames.includes('web_search');

  const primaryModel = agentModels.find(m => m.role === 'primary');
  const initialModelId = primaryModel ? primaryModel.modelId : (agentModels.length > 0 ? agentModels[0].modelId : '');

  const [selectedModelId, setSelectedModelId] = useState<string>(initialModelId);
  const [chatSettings, setChatSettings] = useState<Record<string, number>>(() =>
    getInitialChatSettings(initialModelId, agentModels)
  );

  // New state for attachment handling lifted from ChatInput
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  // New state for detecting drag over the entire chat
  const [isDraggingOverChat, setIsDraggingOverChat] = useState(false);

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

  // Clean up any blob URLs when component unmounts
  useEffect(() => {
    return () => {
      pendingAttachments.forEach(att => {
        if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [pendingAttachments]);

  // File handling functions lifted from ChatInput
  const processFilesForAttachment = useCallback(async (filesToProcess: File[]) => {
    if (pendingAttachments.length + filesToProcess.length > 5) {
      toast.error("You can attach a maximum of 5 files per message.");
      return;
    }

    const newAttachmentsBatch: PendingAttachment[] = [];
    for (const file of filesToProcess) {
      if (file.size > CHAT_ATTACHMENT_MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Max size is ${CHAT_ATTACHMENT_MAX_FILE_SIZE / 1024 / 1024}MB.`);
        continue;
      }
      if (!CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(`File type for "${file.name}" is not allowed. Allowed types: ${CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.join(', ')}`);
        continue;
      }
      const attachmentId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      newAttachmentsBatch.push({ id: attachmentId, file, previewUrl, status: 'pending' });
    }

    if (newAttachmentsBatch.length > 0) {
      setPendingAttachments(prev => [...prev, ...newAttachmentsBatch]);
    } else {
      return;
    }

    for (const att of newAttachmentsBatch) {
      setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? { ...pa, status: 'uploading' } : pa));
      const uploadFormData = new FormData();
      uploadFormData.append('file', att.file);
      try {
        const result = await uploadChatAttachmentAction(uploadFormData, agent.creatorId);
        if (result.success && result.data) {
          setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? {
            ...pa, status: 'success', uploadedUrl: result.data.url,
            uploadedName: result.data.name, uploadedContentType: result.data.contentType,
          } : pa));
        } else {
          const errorMessage = !result.success && 'error' in result ? result.error : 'Upload failed';
          setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? { ...pa, status: 'error', errorMessage } : pa));
          toast.error(`Failed to upload ${att.file.name}: ${errorMessage}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        setPendingAttachments(prev => prev.map(pa => pa.id === att.id ? { ...pa, status: 'error', errorMessage: 'Network or server error during upload' } : pa));
        toast.error(`Error uploading ${att.file.name}.`);
      }
    }
  }, [pendingAttachments, agent.creatorId]);

  const handleRemoveAttachment = useCallback(async (attachmentId: string) => {
    const attachmentToRemove = pendingAttachments.find(att => att.id === attachmentId);

    // Optimistically remove from UI and revoke blob URL
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    if (attachmentToRemove && attachmentToRemove.previewUrl && attachmentToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachmentToRemove.previewUrl);
    }

    // If the attachment was successfully uploaded, attempt to delete from R2
    if (attachmentToRemove && attachmentToRemove.status === 'success' && attachmentToRemove.uploadedUrl) {
      const maxRetries = 3;
      let attempt = 0;
      let deletedFromR2 = false;

      while (attempt < maxRetries && !deletedFromR2) {
        attempt++;
        try {
          const result = await deleteChatAttachmentAction(attachmentToRemove.uploadedUrl, agent.creatorId);
          if (result.success) {
            deletedFromR2 = true;
          } else {
            if (attempt >= maxRetries) {
              toast.error(`Failed to delete ${attachmentToRemove.file.name} from storage: ${result.error}`);
            } else {
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        } catch (error) {
          console.error("Error calling deleteChatAttachmentAction:", error);
          if (attempt >= maxRetries) {
            toast.error(`Error deleting ${attachmentToRemove.file.name} from storage.`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
    }
  }, [pendingAttachments, agent.creatorId]);

  // Drag and drop handlers for the entire chat area
  const handleDragEnterChat = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(true);
  }, []);

  const handleDragOverChat = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy'; // Show copy cursor
    if (!isDraggingOverChat) {
      setIsDraggingOverChat(true);
    }
  }, [isDraggingOverChat]);

  const handleDragLeaveChat = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if the leave target is outside the component or related elements
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDraggingOverChat(false);
    }
  }, []);

  const handleDropChat = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverChat(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFilesForAttachment(files);
    }
  }, [processFilesForAttachment]);

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
    <div 
      className="grid grid-cols-12 min-w-0 h-full"
      onDragEnter={handleDragEnterChat}
      onDragOver={handleDragOverChat}
      onDragLeave={handleDragLeaveChat}
      onDrop={handleDropChat}
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
            />
            <ChatInput
              userId={agent.creatorId}
              chatId={chatId}
              agentSlug={agentSlug}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              isWebSearchEnabled={isWebSearchEnabled}
              showDropZoneIndicator={isDraggingOverChat}
              pendingAttachments={pendingAttachments}
              setPendingAttachments={setPendingAttachments}
              processFilesForAttachment={processFilesForAttachment}
              handleRemoveAttachment={handleRemoveAttachment}
            />
          </>
        ) : (
          <div className="flex items-center justify-center  h-full ">
            <div className="w-full flex flex-col mb-20 gap-10">
            <Greeting agent={agent} />

            <ChatInput
              userId={agent.creatorId}
              agentSlug={agentSlug}
              chatId={chatId}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              minHeight={64}
              isWebSearchEnabled={isWebSearchEnabled}
              showDropZoneIndicator={isDraggingOverChat}
              pendingAttachments={pendingAttachments}
              setPendingAttachments={setPendingAttachments}
              processFilesForAttachment={processFilesForAttachment}
              handleRemoveAttachment={handleRemoveAttachment}
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
    </div>
  )
}
