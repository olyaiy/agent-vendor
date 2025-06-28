"use client";

import { Globe, Paperclip, Send, StopCircle, UploadCloud } from "lucide-react";
import React, { useState, useEffect, memo, useCallback } from "react"; // Import React, useCallback, memo
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { UseChatHelpers } from "@ai-sdk/react"; // Import ChatRequestOptions
import { toast } from "sonner";



import { ChatRequestOptions } from "@ai-sdk/ui-utils";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { 
  useAttachmentManager, 
  CHAT_ATTACHMENT_ALLOWED_FILE_TYPES,
  type PendingAttachment,
  type AttachmentPayload
} from "@/hooks/use-attachment-manager";




// Custom type for the known structure of our part of the request body
interface CustomChatRequestBody {
  csv_attachment_payloads?: AttachmentPayload[];
  // other known custom fields could be added here if needed
}

interface ChatInputProps {
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  handleSubmit: UseChatHelpers['handleSubmit'];
  agentSlug: string;
  chatId: string;
  userId: string; // Added userId prop
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  isMobile?: boolean;
  isWebSearchEnabled?: boolean;
  // New props for external control of drop zone
  showDropZoneIndicator?: boolean; // Controls when to show the drop zone overlay
  pendingAttachments?: PendingAttachment[]; // Externally managed attachments
  setPendingAttachments?: React.Dispatch<React.SetStateAction<PendingAttachment[]>>; // External state updater
  processFilesForAttachment?: (filesToProcess: File[]) => Promise<void>; // External file processing
  handleRemoveAttachment?: (attachmentId: string) => Promise<void>; // External attachment removal
}

// --- Start: Memoized Button Components ---

interface FileButtonProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  allowedFileTypes: string;
}

const MemoizedFileButton = memo(({ onChange, allowedFileTypes }: FileButtonProps) => (
  <label
    className="cursor-pointer rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
  >
    <input
      type="file"
      className="hidden"
      onChange={onChange} // Use passed handler
      multiple // Allow multiple files
      accept={allowedFileTypes} // Set accepted file types
    />
    <Paperclip className="w-4 h-4 text-black/60 dark:text-white/60" />
  </label>
));
MemoizedFileButton.displayName = 'MemoizedFileButton'; // Add display name for debugging

interface SearchButtonProps {
  onClick: () => void;
  showSearch: boolean;
}

const MemoizedSearchButton = memo(({ onClick, showSearch }: SearchButtonProps) => (
  <button
    type="button"
    onClick={onClick} // Use passed handler
    className={cn(
      "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 cursor-pointer",
      showSearch
        ? "bg-sky-500/15 border-sky-400 text-sky-500"
        : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
    )}
  >
    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
      <Globe className={cn(
        "w-4 h-4",
        showSearch ? "text-sky-500" : "text-inherit"
      )} />
    </div>
    {showSearch && (
      <span className="text-sm overflow-hidden whitespace-nowrap text-sky-500 flex-shrink-0">
        Search
      </span>
    )}
  </button>
));
MemoizedSearchButton.displayName = 'MemoizedSearchButton'; // Add display name

interface SendStopButtonProps {
  onClick: () => void;
  isStreaming: boolean;
  canSubmit: boolean;
}

const MemoizedSendStopButton = memo(({ onClick, isStreaming, canSubmit }: SendStopButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick} // Use passed handler
      disabled={!isStreaming && !canSubmit}
      className={cn(
        "rounded-full p-2 transition-colors cursor-pointer",
        isStreaming
          ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
          : canSubmit
          ? "bg-sky-500/15 text-sky-500 hover:bg-sky-500/25"
          : "text-black/30 dark:text-white/30 cursor-not-allowed"
      )}
    >
      {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
    </button>
  );
}
);
MemoizedSendStopButton.displayName = 'MemoizedSendStopButton'; // Add display name

// --- End: Memoized Button Components ---


// Main component remains largely the same, but uses the memoized buttons
function ChatInputComponent({
  chatId,
  agentSlug,
  userId,
  input,
  setInput,
  status,
  stop,
  handleSubmit,
  id = "ai-input-with-search",
  placeholder = "Ask Anything...",
  minHeight: minHeightProp = 48,
  maxHeight = 164,
  className,
  isMobile,
  isWebSearchEnabled,
  // New props with defaults for backward compatibility
  showDropZoneIndicator = false,
  pendingAttachments: externalPendingAttachments,
  setPendingAttachments: externalSetPendingAttachments,
  processFilesForAttachment: externalProcessFilesForAttachment,
  handleRemoveAttachment: externalHandleRemoveAttachment
}: ChatInputProps) {
  // Use internal attachment manager if external one is not provided
  const internalAttachmentManager = useAttachmentManager({ userId });
  
  // Use either external or internal attachment management
  const pendingAttachments = externalPendingAttachments || internalAttachmentManager.pendingAttachments;
  
  const inputRef = React.useRef(input);
  const mobileMinHeight = 40;
  const effectiveMinHeight = isMobile ? mobileMinHeight : minHeightProp;
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: effectiveMinHeight,
    maxHeight,
  });
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = useCallback(() => setShowSearch(s => !s), []);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textareaRef]);

  useEffect(() => {
    if (input === "") {
      adjustHeight(true);
    } else {
      adjustHeight();
    }
  }, [input, adjustHeight]);

  const processFilesForAttachment = externalProcessFilesForAttachment || internalAttachmentManager.processFilesForAttachment;
  const handleRemoveAttachment = externalHandleRemoveAttachment || internalAttachmentManager.handleRemoveAttachment;
  const clearAttachments = externalSetPendingAttachments ? 
    () => externalSetPendingAttachments([]) : 
    internalAttachmentManager.clearAttachments;
  const getAttachmentPayloads = internalAttachmentManager.getAttachmentPayloads;
  const hasSuccessfulAttachments = externalPendingAttachments?.some(att => att.status === 'success') || 
    internalAttachmentManager.hasSuccessfulAttachments;

  // Handler for paste events
  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(event.clipboardData.items);
    const pastedImageFiles: File[] = [];
    let nonAllowedFilePasted = false;
    let hasTextContent = false;

    for (const item of items) {
      if (item.kind === 'file') {
        if (CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.includes(item.type)) {
          const file = item.getAsFile();
          if (file) pastedImageFiles.push(file);
        } else {
          nonAllowedFilePasted = true;
        }
      } else if (item.kind === 'string' && item.type === 'text/plain') {
        hasTextContent = true;
      }
    }

    // Handle text content first (trim trailing whitespace)
    if (hasTextContent && pastedImageFiles.length === 0 && !nonAllowedFilePasted) {
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text/plain');
      const trimmedText = pastedText.replace(/\s+$/, ''); // Remove trailing whitespace and newlines
      
      const textarea = textareaRef.current;
      if (textarea) {
        const currentValue = textarea.value;
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        
        const newValue = currentValue.substring(0, selectionStart) + trimmedText + currentValue.substring(selectionEnd);
        setInput(newValue);
        
        // Set cursor position after the pasted text
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + trimmedText.length;
          adjustHeight();
        }, 0);
      }
      return;
    }

    if (pastedImageFiles.length > 0) {
      event.preventDefault();
      await processFilesForAttachment(pastedImageFiles);
    } else if (nonAllowedFilePasted) {
      event.preventDefault();
      toast.error(`Pasted content includes unsupported file types. Allowed image types: ${CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.join(', ')}`);
    }
  }, [processFilesForAttachment, textareaRef, setInput, adjustHeight]);

  // Modified handler for file input changes
  const handleAttachmentFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await processFilesForAttachment(files);
    if (event.target) event.target.value = '';
  }, [processFilesForAttachment]);

  const handleInternalSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();

    const { regularAttachments, csvAttachments } = getAttachmentPayloads();

    if (inputRef.current.trim() || regularAttachments.length > 0 || csvAttachments.length > 0) {
      window.history.replaceState({}, '', `/agent/${agentSlug}/${chatId}`);
      
      const chatRequestOptions: ChatRequestOptions = {};

      if (regularAttachments.length > 0) {
        chatRequestOptions.experimental_attachments = regularAttachments;
      }

      const customBodyParts: CustomChatRequestBody = {};
      if (csvAttachments.length > 0) {
        customBodyParts.csv_attachment_payloads = csvAttachments;
      }

      if (Object.keys(customBodyParts).length > 0) {
        chatRequestOptions.body = customBodyParts;
      }
      
      handleSubmit(e as React.FormEvent<HTMLFormElement> | undefined, chatRequestOptions);
      clearAttachments();
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 0);
    }
  }, [handleSubmit, textareaRef, agentSlug, chatId, inputRef, clearAttachments, getAttachmentPayloads]);

  useEffect(() => {
    return () => {
      pendingAttachments.forEach(att => {
        if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });
    };
  }, [pendingAttachments]);

  const isStreaming = status === 'submitted' || status === 'streaming';
  const canSubmit = status === 'ready' && (!!input.trim() || hasSuccessfulAttachments);

  const handleSendStopClick = useCallback(() => {
    if (isStreaming) stop?.();
    else handleInternalSubmit();
  }, [isStreaming, stop, handleInternalSubmit]);

  const prevHandlerRef = React.useRef(handleSendStopClick);
  useEffect(() => {
    if (prevHandlerRef.current !== handleSendStopClick) {
      prevHandlerRef.current = handleSendStopClick;
    }
  }, [handleSendStopClick]);

  return (
    <div className={cn("w-full px-0 mb-4 md:pb-6 md:px-8 relative", className)}>
      <div
        className={cn(
          "max-w-3xl mx-auto relative bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-sm overflow-hidden transition-all",
          showDropZoneIndicator && "border-dashed border-sky-500 ring-2 ring-sky-500 ring-offset-1 dark:ring-offset-black bg-sky-500/10" // Use showDropZoneIndicator prop instead of isDraggingOver
        )}
      >
        {showDropZoneIndicator && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[2px] rounded-2xl pointer-events-none z-20">
            <UploadCloud className="w-12 h-12 text-sky-500 mb-2" />
            <p className="text-lg font-semibold text-sky-500">Drop files here</p>
          </div>
        )}
        <div className={cn("flex flex-col", showDropZoneIndicator && "opacity-50")}> {/* Use showDropZoneIndicator prop instead of isDraggingOver */}
          <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight}px` }}>
            <Textarea
              id={id}
              value={input}
              placeholder={placeholder}
              className="w-full overflow-auto px-4 py-3 bg-transparent border-none dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 resize-none focus-visible:ring-0 leading-relaxed text-base"
              ref={textareaRef}
              autoFocus
              onPaste={handlePaste} // Added onPaste
              onKeyDown={useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (!isMobile) {
                    e.preventDefault();
                    handleInternalSubmit();
                  }
                }
              }, [handleInternalSubmit, isMobile])}
              onChange={useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInput(e.target.value);
                adjustHeight();
              }, [setInput, adjustHeight])}
            />
          </div>
          
          <AttachmentPreview 
            attachments={pendingAttachments}
            onRemoveAttachment={handleRemoveAttachment}
          />

          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MemoizedFileButton
                onChange={handleAttachmentFileChange}
                allowedFileTypes={CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.join(',')}
              />
              {isWebSearchEnabled && (
                <MemoizedSearchButton
                  onClick={toggleSearch}
                  showSearch={showSearch}
                />
              )}
            </div>
            <MemoizedSendStopButton
              onClick={handleSendStopClick}
              isStreaming={isStreaming}
              canSubmit={canSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Export memoized component with custom comparison
export const ChatInput = memo(ChatInputComponent, (prevProps, nextProps) => {
  // Only re-render if value, status, or function references change
  // Note: We don't need to compare isDraggingOver here as it's internal state managed by ChatInputComponent
  return (
    prevProps.input === nextProps.input &&
    prevProps.status === nextProps.status &&
    prevProps.handleSubmit === nextProps.handleSubmit &&
    prevProps.setInput === nextProps.setInput &&
    prevProps.stop === nextProps.stop &&
    prevProps.id === nextProps.id &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.minHeight === nextProps.minHeight &&
    prevProps.maxHeight === nextProps.maxHeight &&
    prevProps.className === nextProps.className && 
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isWebSearchEnabled === nextProps.isWebSearchEnabled && // New comparison
    prevProps.showDropZoneIndicator === nextProps.showDropZoneIndicator // New comparison for drop zone indicator
    // Note: We intentionally don't compare the attachment-related props because they shouldn't trigger a re-render
    // if they're properly memoized by the parent component.
  );
});

// Re-export types for external use
export type { PendingAttachment, AttachmentPayload } from '@/hooks/use-attachment-manager';
export { CHAT_ATTACHMENT_MAX_FILE_SIZE, CHAT_ATTACHMENT_ALLOWED_FILE_TYPES } from '@/hooks/use-attachment-manager';
