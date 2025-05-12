"use client";

import { Globe, Paperclip, Send, StopCircle, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import React, { useState, useEffect, memo, useCallback } from "react"; // Import React, useCallback, memo
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { UseChatHelpers } from "@ai-sdk/react"; // Import ChatRequestOptions
import { toast } from "sonner";


import { uploadChatAttachmentAction, deleteChatAttachmentAction } from "@/db/actions/chat-attachment.actions";
import { ChatRequestOptions } from "@ai-sdk/ui-utils";


export const CHAT_ATTACHMENT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const CHAT_ATTACHMENT_ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Interface for pending attachments
interface PendingAttachment {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  uploadedUrl?: string;
  uploadedName?: string;
  uploadedContentType?: string;
}

interface AttachmentPayload { // For chatRequestOptions
  url: string;
  name: string;
  contentType: string;
}

// Removed unused JSONValue type definition

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
  // onFileSelect?: (file: File) => void; // Removed as it's unused
  className?: string;
  isMobile?: boolean;
  isWebSearchEnabled?: boolean; // New prop
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
  userId, // Destructure userId
  input,
  setInput,
  status,
  stop,
  handleSubmit,
  id = "ai-input-with-search",
  placeholder = "Ask Anything...",
  minHeight: minHeightProp = 48, // Renamed prop to avoid conflict
  maxHeight = 164,
  // onFileSelect, // Removed
  className,
  isMobile,
  isWebSearchEnabled // Destructure new prop
}: ChatInputProps) {
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
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

  // Helper function to process files (either from input or paste)
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
        const result = await uploadChatAttachmentAction(uploadFormData, userId);
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
  }, [pendingAttachments, userId, setPendingAttachments, toast, uploadChatAttachmentAction]);

  // Handler for paste events
  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(event.clipboardData.items);
    const pastedImageFiles: File[] = [];
    let nonAllowedFilePasted = false;

    for (const item of items) {
      if (item.kind === 'file') {
        if (CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.includes(item.type)) {
          const file = item.getAsFile();
          if (file) pastedImageFiles.push(file);
        } else {
          nonAllowedFilePasted = true;
        }
      }
    }

    if (pastedImageFiles.length > 0) {
      event.preventDefault();
      await processFilesForAttachment(pastedImageFiles);
    } else if (nonAllowedFilePasted) {
      event.preventDefault();
      toast.error(`Pasted content includes unsupported file types. Allowed image types: ${CHAT_ATTACHMENT_ALLOWED_FILE_TYPES.join(', ')}`);
    }
  }, [processFilesForAttachment, toast]);

  // Modified handler for file input changes
  const handleAttachmentFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    await processFilesForAttachment(files);
    if (event.target) event.target.value = '';
  }, [processFilesForAttachment]);

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
          const result = await deleteChatAttachmentAction(attachmentToRemove.uploadedUrl, userId);
          if (result.success) {
            deletedFromR2 = true;
            // Optionally, show a success toast or log
            // console.log(`Successfully deleted ${attachmentToRemove.file.name} from storage.`);
          } else {
            if (attempt >= maxRetries) {
              toast.error(`Failed to delete ${attachmentToRemove.file.name} from storage: ${result.error}`);
            } else {
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff could be used here
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
  }, [pendingAttachments, setPendingAttachments, userId, toast, deleteChatAttachmentAction]);

  const handleInternalSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const attachmentsToSend: AttachmentPayload[] = pendingAttachments
      .filter(att => att.status === 'success' && att.uploadedUrl)
      .map(att => ({
        url: att.uploadedUrl!,
        name: att.uploadedName || att.file.name,
        contentType: att.uploadedContentType || att.file.type,
      }));

    if (inputRef.current.trim() || attachmentsToSend.length > 0) {
      window.history.replaceState({}, '', `/agent/${agentSlug}/${chatId}`);
      let chatRequestOptions: ChatRequestOptions | undefined = undefined;
      if (attachmentsToSend.length > 0) {
        chatRequestOptions = { experimental_attachments: attachmentsToSend };
      }
      handleSubmit(e as React.FormEvent<HTMLFormElement> | undefined, chatRequestOptions);
      setPendingAttachments(prev => {
        prev.forEach(att => {
          if (att.previewUrl && att.previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(att.previewUrl);
          }
        });
        return [];
      });
      setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 0);
    }
  }, [handleSubmit, textareaRef, agentSlug, chatId, pendingAttachments, inputRef, setPendingAttachments]);

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
  const canSubmit = status === 'ready' && (!!input.trim() || pendingAttachments.some(att => att.status === 'success'));

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
    <div className={cn("w-full px-4 mb-2 md:pb-6 md:px-8 relative", className)}>
      <div className="max-w-3xl mx-auto relative bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex flex-col">
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
          
          {pendingAttachments.length > 0 && (
            <div className="p-2 border-t border-black/10 dark:border-white/10">
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((att) => (
                  <div key={att.id} className="relative group w-20 h-20 border rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {att.previewUrl.startsWith('blob:') && (att.file.type.startsWith('image/')) ? (
                      <img src={att.previewUrl} alt={att.file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1">
                        <Paperclip className="w-6 h-6 text-gray-500 dark:text-gray-400 mb-1 flex-shrink-0" />
                        <span className="text-xs text-center text-gray-700 dark:text-gray-300 truncate w-full px-1" title={att.file.name}>
                          {att.file.name}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                        "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
                        att.status === 'uploading' ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {att.status === 'uploading' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                      {att.status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-400" />}
                      {att.status === 'error' && <XCircle className="w-6 h-6 text-red-400" />}
                    </div>
                    {att.status !== 'uploading' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-black/90 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10 cursor-pointer border border-white/20"
                        aria-label="Remove attachment"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                    {att.status === 'error' && att.errorMessage && (
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-red-600/90 text-white text-[10px] p-0.5 text-center truncate"
                        title={att.errorMessage}
                      >
                        {att.errorMessage.length > 20 ? att.errorMessage.substring(0,18) + '...' : att.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
  return (
    prevProps.input === nextProps.input &&
    prevProps.status === nextProps.status &&
    prevProps.handleSubmit === nextProps.handleSubmit &&
    prevProps.setInput === nextProps.setInput &&
    prevProps.stop === nextProps.stop &&
    // prevProps.onFileSelect === nextProps.onFileSelect && // Removed
    prevProps.id === nextProps.id &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.minHeight === nextProps.minHeight &&
    prevProps.maxHeight === nextProps.maxHeight &&
    prevProps.className === nextProps.className && 
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.isWebSearchEnabled === nextProps.isWebSearchEnabled // New comparison
  );
});
