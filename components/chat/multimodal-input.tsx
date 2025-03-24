'use client';
import type {
  Attachment,
  Message,
  UIMessage,
} from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { ArrowUpIcon, PaperclipIcon, StopIcon } from '@/components/util/icons';
import { Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SuggestedActions } from '@/components/chat/suggested-actions';
import equal from 'fast-deep-equal';
import { type ModelWithDefault } from '@/components/chat/chat-model-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PreviewAttachment } from '../util/preview-attachment';
import { checkAgentHasSearchTool } from '@/lib/db/actions';
import { UseChatHelpers } from '@ai-sdk/react';

function PureMultimodalInput({
  chatId,
  agentId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  availableModels,
  currentModel,
  onModelChange,
  isReadonly,
  searchEnabled,
  setSearchEnabled,
  isAuthenticated,
  suggestedPrompts,
}: {
  chatId: string;
  agentId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  isAuthenticated: boolean;
  className?: string;
  availableModels: ModelWithDefault[];
  currentModel: string;
  onModelChange: (modelId: string) => void;
  isReadonly: boolean;
  searchEnabled: boolean;
  setSearchEnabled: Dispatch<SetStateAction<boolean>>;
  suggestedPrompts?: string[];
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const [hasSearchTool, setHasSearchTool] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  // Handler for toggling search
  const handleSearchToggle = useCallback((checked: boolean) => {
    setSearchEnabled(checked);
  }, [setSearchEnabled]);

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {

  

    if (isAuthenticated) {
      window.history.replaceState({}, '', `/${agentId}/${chatId}`);
    }


    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    agentId,
    isAuthenticated
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  }, []);

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const clipboardItems = event.clipboardData.items;
      const imageItems = Array.from(clipboardItems).filter(
        item => item.type.startsWith('image/')
      );

      if (imageItems.length === 0) {
        // No images in clipboard, proceed with normal paste
        return;
      }

      // Get the images from clipboard
      const imageFiles = imageItems.map(item => {
        const blob = item.getAsFile();
        if (!blob) return null;
        
        // Create a new file with a reasonable name
        const fileExtension = blob.type.split('/')[1] || 'png';
        const fileName = `clipboard-image-${Date.now()}.${fileExtension}`;
        return new File([blob], fileName, { type: blob.type });
      }).filter(Boolean) as File[];

      if (imageFiles.length === 0) return;

      // Add files to upload queue
      setUploadQueue(imageFiles.map(file => file.name));

      try {
        const uploadPromises = imageFiles.map(file => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          attachment => attachment !== undefined
        );

        setAttachments(currentAttachments => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading clipboard images!', error);
        toast.error('Failed to upload clipboard image, please try again!');
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, setUploadQueue, uploadFile]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile],
  );

  // Check if agent has search capability
  useEffect(() => {
    const checkSearchCapability = async () => {
      try {
        const hasSearchTool = await checkAgentHasSearchTool(agentId);
        setHasSearchTool(hasSearchTool);
        
        // If agent doesn't have search tool, make sure search is disabled
        if (!hasSearchTool && searchEnabled) {
          setSearchEnabled(false);
        }
      } catch (error) {
        console.error('Failed to check agent search capability:', error);
      }
    };
    
    checkSearchCapability();
  }, [agentId, searchEnabled, setSearchEnabled]);

  return (
    <div className="relative w-full flex flex-col gap-2 sm:gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none "
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {/* Model Selector and Search Toggle */}
      {!isReadonly && (
        <div className="w-full flex justify-between items-center gap-2">
          {/* Model Selector - only show if we have models */}
          {availableModels.length > 1 && (
            <Select
              value={currentModel}
              onValueChange={onModelChange}
            >
              <SelectTrigger className="h-8 w-[50%] sm:w-full md:w-52 text-xs">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-w-[90vw] md:max-w-none">
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{model.model_display_name}</span>
                      {model.isDefault && <span className="text-xxs text-muted-foreground ml-2 shrink-0">(Default)</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Search Toggle - Only show if agent has search tool */}
          {hasSearchTool && (
            <div className="flex items-center space-x-2 cursor-pointer order-first ">
              <Switch
                id="search-toggle"
                checked={searchEnabled}
                onCheckedChange={handleSearchToggle}
                disabled={status !== 'ready'}
                className="cursor-pointer"
              />
              <Label 
                htmlFor="search-toggle" 
                className="text-xs flex items-center gap-1 cursor-pointer"
                onClick={() => status !== 'ready' && setSearchEnabled(!searchEnabled)}
              >
                <SearchIcon size={12} />
                {width && width <= 768 ? (
                  <span>Search</span>
                ) : (
                  <span>Web Search {searchEnabled ? 'On' : 'Off'}</span>
                )}
              </Label>
            </div>
          )}
        </div>
      )}

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative ">
        <Textarea
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          onPaste={handlePaste}
          className={cx(
            'sm:min-h-[24px] max-h-[calc(50vh)] sm:max-h-[calc(50vh)] overflow-auto resize-none rounded-md !text-base bg-muted pb-8 sm:pb-10 dark:border-zinc-700',
            className
          )}
          rows={2}
          autoFocus
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              // Only submit on Enter key for desktop devices (width > 768px)
              if (width && width > 768) {
                event.preventDefault();
                submitForm();
              }
            }
          }}
        />

        <div className="absolute bottom-0 p-1 sm:p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        </div>

        <div className="absolute bottom-0 right-0 p-1 sm:p-2 w-fit flex flex-row justify-end">
          {status === 'submitted' || status === 'streaming' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              input={input}
              submitForm={submitForm}
              uploadQueue={uploadQueue}
            />
          )}
        </div>
      </div>

      {/* Suggested Actions moved below input */}
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <div className="mt-4">
            <SuggestedActions 
              append={append} 
              chatId={chatId} 
              agentId={agentId} 
              suggestedPrompts={suggestedPrompts} 
            />
          </div>
        )}
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (prevProps.currentModel !== nextProps.currentModel) return false;
    if (prevProps.searchEnabled !== nextProps.searchEnabled) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      className="rounded-md rounded-bl-lg p-[6px] sm:p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      className="rounded-full p-1 sm:p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      className="rounded-full p-3 sm:p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <div className="sm:scale-[0.65]">
        <ArrowUpIcon size={22} />
      </div>
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});