'use client';
import type {
  Attachment,
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
  memo,
} from 'react';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { Search as SearchIcon } from 'lucide-react';
import { SuggestedActions } from '@/components/chat/suggested-actions';
import equal from 'fast-deep-equal';
import { type ModelWithDefault } from '@/components/chat/chat-model-selector';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { checkAgentHasSearchTool } from '@/lib/db/actions';
import { UseChatHelpers } from '@ai-sdk/react';
import  { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import 'tippy.js/dist/tippy.css'; // Import tippy styles
import { GroupAgentDisplayInfo } from '@/components/chat/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PluginKey } from '@tiptap/pm/state'; // Import PluginKey

// Import our new components
import { RichTextEditor } from './editor/RichTextEditor';
import { AttachmentButton } from './controls/AttachmentButton';
import { StopButton } from './controls/StopButton';
import { SendButton } from './controls/SendButton';
import { ModelSelector } from './controls/ModelSelector';
import { AttachmentPreview } from './attachments/AttachmentPreview';
import { useFileUpload } from './hooks/useFileUpload';

/**
 * Interface defining the reference methods for the MentionList component.
 * This allows parent components to control keyboard navigation within the mention list.
 */
interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * Component that renders a list of mention suggestions for group chat participants.
 * 
 * Features:
 * - Keyboard navigation (up/down arrows)
 * - Enter key selection
 * - Avatar display for each agent
 * - Highlighting of selected item
 * 
 * @param props - Contains the list of agents and command handler
 * @param ref - Reference for keyboard navigation methods
 */
const MentionList = forwardRef<MentionListRef, SuggestionProps<GroupAgentDisplayInfo>>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  /**
   * Handles selection of an item from the mention list
   * Sets the mentionJustSelected flag to prevent form submission
   * when the Enter key is used to select a mention
   * 
   * @param index - The index of the selected item
   */
  const selectItem = useCallback((index: number) => {
    const item = props.items[index];
    if (item) {
      mentionJustSelected = true; // Set flag when mention is selected
      
      // Reset the flag after a short delay to allow other handlers to check it
      setTimeout(() => {
        mentionJustSelected = false;
      }, 100);
      
      props.command({ id: item.id, label: item.agent_display_name });
    }
  }, [props]);

  // Reset selection when the list of items changes
  useEffect(() => setSelectedIndex(0), [props.items]);

  /**
   * Exposes keyboard navigation methods to the parent component
   * This allows the parent to control navigation when the list is focused
   */
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

  // Don't render if there are no items to show
  if (props.items.length === 0) {
    return null;
  }

  return (
    <div className="z-50 rounded-md border bg-popover p-1 text-popover-foreground shadow-md max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 overflow-visible">
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

// Custom plugin key for tracking mention suggestions
// Note: We keep this for compatibility with Tiptap, but primarily rely on the flag method below
const mentionSuggestionPluginKey = new PluginKey('mention-suggestion');

/**
 * Flag to track when a mention was just selected via Enter key
 * This is the most reliable way to prevent the dual behavior where pressing Enter:
 * 1. Selects a mention from the suggestion list
 * 2. Also submits the form immediately after
 * 
 * We use a global variable instead of React state to avoid re-rendering
 * and to ensure the flag can be accessed across component closures.
 */
let mentionJustSelected = false;

// --- Main Input Component ---

/**
 * Primary chat input component with multimodal capabilities
 * Features:
 * - File upload management with progress tracking
 * - Model selection dropdown
 * - Web search toggle
 * - Rich text editor integration
 * - Attachment preview system
 * - Keyboard shortcut handling
 */

function PureMultimodalInput({
  chatId,
  agentId,
  input,
  setInput,
  status,
  stop,
  attachments: externalAttachments,
  setAttachments: setExternalAttachments,
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

  // Use our file upload hook for managing attachments - with callback pattern
  const {
    attachments,
    uploadQueue,
    handleFileChange,
    handlePaste,
    clearAttachments,
    removeAttachment
  } = useFileUpload(
    externalAttachments, 
    // Pass callback to sync changes up to parent
    (newAttachments) => setExternalAttachments(newAttachments)
  );

  // No need for manual sync effects anymore - the hook handles it

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

  const submitForm = useCallback(() => {
    if (isAuthenticated) {
      window.history.replaceState({}, '', `/${agentId}/${chatId}`);
    }

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    clearAttachments();
    setLocalStorageInput('');
    
    if (width && width > 768 && editorRef.current) {
      editorRef.current.commands.focus();
    }
  }, [
    attachments,
    handleSubmit,
    clearAttachments,
    setLocalStorageInput,
    width,
    chatId,
    agentId,
    isAuthenticated
  ]);

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
          <ModelSelector 
            availableModels={availableModels}
            currentModel={currentModel}
            onModelChange={onModelChange}
          />
          
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
        <div className="flex flex-row gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 items-end  pt-4 px-2" >
          {attachments.map((attachment) => (
            <AttachmentPreview 
              key={attachment.url} 
              attachment={attachment} 
              onRemove={removeAttachment}
            />
          ))}

          {uploadQueue.map((filename) => (
            <AttachmentPreview
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
        <RichTextEditor
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
                // Check if a mention was just selected via the Enter key
                if (editorRef.current?.wasMentionJustSelected?.()) {
                  // Prevent form submission when a mention was just selected
                  event.preventDefault();
                  return;
                }
                
                // Standard form submission behavior (when not selecting a mention)
                event.preventDefault();
                submitForm();
              }
            }
          }}
          isGroupChat={isGroupChat}
          groupAgents={groupAgents}
        />

        <div className="absolute bottom-0 p-1 sm:p-2 w-fit flex flex-row justify-start">
          <AttachmentButton fileInputRef={fileInputRef} status={status} />
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