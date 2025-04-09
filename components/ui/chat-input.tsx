"use client";

import { Globe, Paperclip, Send, StopCircle } from "lucide-react";
import React, { useState, useEffect, memo, useCallback } from "react"; // Import React, useCallback and memo
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { UseChatHelpers } from "@ai-sdk/react";

interface ChatInputProps {
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  handleSubmit: UseChatHelpers['handleSubmit'];

  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onFileSelect?: (file: File) => void;
  className?: string;
}

// --- Start: Memoized Button Components ---

interface FileButtonProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MemoizedFileButton = memo(({ onChange }: FileButtonProps) => (
  <label 
    className="cursor-pointer rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
  >
    <input 
      type="file" 
      className="hidden" 
      onChange={onChange} // Use passed handler
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
  input,  
  setInput,
  status,
  stop,
  handleSubmit,
  id = "ai-input-with-search",
  placeholder = "Ask Anything...",
  minHeight = 48,
  maxHeight = 164,
  onFileSelect,
  className
}: ChatInputProps) {
  // Ref to store the latest value without causing re-renders for handler definitions
  const inputRef = React.useRef(input);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [showSearch, setShowSearch] = useState(false);

  // Keep the ref updated with the latest value
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Focus textarea on component mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [textareaRef]); // Added textareaRef dependency

  const handleInternalSubmit = useCallback(() => {
    // Read value from ref inside the handler
    if (inputRef.current.trim()) {
      handleSubmit();
      // Maintain focus after submission
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 0);
    }
  // Remove 'value' from dependencies, use stable 'onSubmit' and 'textareaRef'
  }, [handleSubmit, textareaRef]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  }, [onFileSelect]); // Added dependency

  const isStreaming = status === 'submitted' || status === 'streaming';

  
  // Ensure canSubmit is always boolean using double negation (!!)
  const canSubmit = status === 'ready' && !!input.trim();

  // Memoize the onClick handler for the Send/Stop button
  const handleSendStopClick = useCallback(() => {
    if (isStreaming) {
      stop?.(); // Use optional chaining for stop
    } else {
      handleInternalSubmit();
    }
  }, [isStreaming, stop, handleInternalSubmit]); // Add dependencies
  

  
  // Track if handleSendStopClick reference changes
  const prevHandlerRef = React.useRef(handleSendStopClick);
  useEffect(() => {
    if (prevHandlerRef.current !== handleSendStopClick) {

      prevHandlerRef.current = handleSendStopClick;
    }
  }, [handleSendStopClick]);

  return (
    <div className={cn("w-full px-4 pb-4 md:pb-6 md:px-8 relative", className)}>
      <div className="max-w-3xl mx-auto relative bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex flex-col">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <Textarea
              id={id}
              value={input}
              placeholder={placeholder}
              className="w-full overflow-hidden px-4 py-3 bg-transparent border-none dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 resize-none focus-visible:ring-0 leading-relaxed text-base"
              ref={textareaRef}
              autoFocus
              onKeyDown={useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInternalSubmit(); // Use memoized handler
                }
              }, [handleInternalSubmit])} // Added dependency
              onChange={useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setInput(e.target.value);
                adjustHeight();
              }, [setInput, adjustHeight])} // Added dependencies
            />
          </div>

          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Use Memoized File Button */}
              <MemoizedFileButton onChange={handleFileChange} /> 
              
              {/* Use Memoized Search Button */}
              <MemoizedSearchButton 
                onClick={useCallback(() => setShowSearch(s => !s), [])} // Memoize inline handler
                showSearch={showSearch} 
              />
            </div>
            
            {/* Use Memoized Send/Stop Button */}
            <MemoizedSendStopButton
              onClick={handleSendStopClick} // Use the memoized handler
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
    prevProps.onFileSelect === nextProps.onFileSelect &&
    prevProps.id === nextProps.id &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.minHeight === nextProps.minHeight &&
    prevProps.maxHeight === nextProps.maxHeight &&
    prevProps.className === nextProps.className
  );
});
