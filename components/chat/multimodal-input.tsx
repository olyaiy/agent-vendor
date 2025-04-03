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
  forwardRef,
  useImperativeHandle,
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
import { useEditor, EditorContent, ReactRenderer, type AnyExtension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { type Instance, type Props } from 'tippy.js';
import 'tippy.js/dist/tippy.css'; // Import tippy styles
import { GroupAgentDisplayInfo } from './chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Mention Suggestion Logic ---

interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const MentionList = forwardRef<MentionListRef, SuggestionProps<GroupAgentDisplayInfo>>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback((index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.agent_display_name });
    }
  }, [props]);

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  return (
    <div className="z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
      {props.items.map((item, index) => (
        <button
          className={cx(
            'flex w-full items-center space-x-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[state=selected]:bg-accent data-[state=selected]:text-accent-foreground',
            index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
          )}
          key={index}
          onClick={() => selectItem(index)}
        >
           <Avatar className="h-6 w-6">
            <AvatarImage src={item.avatar_url || item.thumbnail_url || undefined} alt={item.agent_display_name || 'Agent'} />
            <AvatarFallback>{item.agent_display_name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
          <span>{item.agent_display_name || item.id}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';

const mentionSuggestion = (agents: GroupAgentDisplayInfo[] = []) => ({
  items: ({ query }: { query: string }) => {
    return agents
      .filter(item =>
        item.agent_display_name?.toLowerCase().startsWith(query.toLowerCase()) ||
        item.id.toLowerCase().startsWith(query.toLowerCase())
      )
      .slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer<MentionListRef, SuggestionProps<GroupAgentDisplayInfo>> | null = null;
    let popup: Instance<Props>[] | null = null;

    return {
      onStart: (props: SuggestionProps<GroupAgentDisplayInfo>) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: SuggestionProps<GroupAgentDisplayInfo>) {
        component?.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup?.[0]?.setProps({
          getReferenceClientRect: props.clientRect as () => DOMRect,
        });
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit() {
        popup?.[0]?.destroy();
        component?.destroy();
      },
    };
  },
});

// --- TiptapEditor Component ---

function TiptapEditor({
  value,
  onChange,
  onKeyDown,
  onPaste,
  placeholder,
  className,
  autoFocus,
  editorRef,
  isGroupChat,
  groupAgents,
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onPaste?: (event: React.ClipboardEvent) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  editorRef?: React.MutableRefObject<any>;
  isGroupChat?: boolean;
  groupAgents?: GroupAgentDisplayInfo[];
}) {

  const extensions: AnyExtension[] = [
    StarterKit,
  ];

  if (isGroupChat) {
    extensions.push(
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-primary/10 text-primary rounded px-1',
        },
        suggestion: mentionSuggestion(groupAgents),
      }),
    );
  }

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: cx(
          'outline-none w-full sm:min-h-[24px] max-h-[calc(50vh)] sm:max-h-[calc(50vh)] overflow-auto resize-none rounded-md !text-base bg-muted pb-8 sm:pb-10 dark:border-zinc-700 p-3',
          className
        ),
        placeholder: placeholder ?? '',
      },
    },
    onUpdate: ({ editor }) => {
      // Emit plain text for input state, mentions will be rendered visually
      onChange(editor.getText());
      // Note: If you need the HTML content with mentions for sending,
      // you might need to adjust how the input is processed on submit.
      // Currently, it sends plain text.
    },
    autofocus: autoFocus,
  });

  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  useEffect(() => {
    if (editor) {
      const editorText = editor.getText(); // Get plain text
      if (editorText !== value) {
        // Reset content if external value changes significantly
        // This prevents issues if the parent component clears the input
        editor.commands.setContent(value);
      }
    }
  }, [editor, value]);

  // Update placeholder dynamically
  useEffect(() => {
    if (editor && placeholder) {
      editor.setOptions({
        editorProps: {
          attributes: {
            placeholder: placeholder,
          },
        },
      });
    }
  }, [editor, placeholder]);

  return (
    <EditorContent
      editor={editor}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
    />
  );
}

// --- Main Input Component ---

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
  isGroupChat,
  groupAgents,
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
  isGroupChat?: boolean;
  groupAgents?: GroupAgentDisplayInfo[];
}) {
  const editorRef = useRef<any>(null);
  const { width } = useWindowSize();
  const [hasSearchTool, setHasSearchTool] = useState(false);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  const handleSearchToggle = useCallback((checked: boolean) => {
    setSearchEnabled(checked);
  }, [setSearchEnabled]);

  useEffect(() => {
    if (localStorageInput) {
      setInput(localStorageInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = useCallback((value: string) => {
    setInput(value);
  }, [setInput]);

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
    
    if (width && width > 768 && editorRef.current) {
      editorRef.current.commands.focus();
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
    async (event: React.ClipboardEvent) => {
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

  useEffect(() => {
    const checkSearchCapability = async () => {
      try {
        const hasSearchTool = await checkAgentHasSearchTool(agentId);
        setHasSearchTool(hasSearchTool);
        
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

      {!isReadonly && (
        <div className="w-full flex justify-between items-center gap-2">
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
        <TiptapEditor
          editorRef={editorRef}
          value={input}
          onChange={handleInput}
          onPaste={handlePaste}
          className={className}
          autoFocus
          placeholder={isGroupChat ? "Send a message or type '@' to mention..." : "Send a message..."}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              if (width && width > 768) {
                event.preventDefault();
                submitForm();
              }
            }
          }}
          isGroupChat={isGroupChat}
          groupAgents={groupAgents}
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
    if (prevProps.isGroupChat !== nextProps.isGroupChat) return false;
    if (!equal(prevProps.groupAgents, nextProps.groupAgents)) return false;

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
      className="rounded-full p-1 sm:p-1.5 h-fit border dark:border-zinc-600 relative animate-pulse before:content-[''] before:absolute before:inset-0 before:rounded-full before:border before:border-zinc-400 dark:before:border-zinc-500 before:animate-[spin_3s_linear_infinite]"
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