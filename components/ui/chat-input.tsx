"use client";

import { Globe, Paperclip, Send, StopCircle } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  status?: "submitted" | "streaming" | "ready" | "error";
  stop?: () => void;
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  status,
  stop,
  id = "ai-input-with-search",
  placeholder = "Ask Anything...",
  minHeight = 48,
  maxHeight = 164,
  onFileSelect,
  className
}: ChatInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });
  const [showSearch, setShowSearch] = useState(false);

  const handleInternalSubmit = () => {
    if (value.trim()) {
      onSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  const isStreaming = status === 'submitted' || status === 'streaming';
  const canSubmit = status === 'ready' && value.trim();

  return (
    <div className={cn("w-full px-4 pb-4 md:pb-6 md:px-8 relative", className)}>
      <motion.div 
        className="max-w-3xl mx-auto relative bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/10 dark:border-white/10 shadow-sm overflow-hidden"
        initial={{ y: 10, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <Textarea
              id={id}
              value={value}
              placeholder={placeholder}
              className="w-full overflow-hidden px-4 py-3 bg-transparent border-none dark:text-white placeholder:text-black/50 dark:placeholder:text-white/50 resize-none focus-visible:ring-0 leading-relaxed text-base"
              ref={textareaRef}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleInternalSubmit();
                }
              }}
              onChange={(e) => {
                onChange(e);
                adjustHeight();
              }}
            />
          </div>

          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <motion.label 
                className="cursor-pointer rounded-full p-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Paperclip className="w-4 h-4 text-black/60 dark:text-white/60" />
              </motion.label>
              
              <motion.button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "rounded-full flex items-center gap-1.5 px-2.5 py-1.5 transition-all",
                  showSearch
                    ? "bg-sky-500/15 text-sky-500"
                    : "hover:bg-black/10 dark:hover:bg-white/10 text-black/60 dark:text-white/60"
                )}
              >
                <Globe className="w-4 h-4" />
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "auto", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap"
                    >
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            
            <motion.button
              type="button"
              onClick={isStreaming ? stop : handleInternalSubmit}
              disabled={!isStreaming && !canSubmit}
              className={cn(
                "rounded-full p-2 transition-colors",
                isStreaming
                  ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                  : canSubmit
                  ? "bg-sky-500/15 text-sky-500 hover:bg-sky-500/25"
                  : "text-black/30 dark:text-white/30 cursor-not-allowed"
              )}
              whileHover={isStreaming || canSubmit ? { scale: 1.05 } : {}}
              whileTap={isStreaming || canSubmit ? { scale: 0.95 } : {}}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isStreaming ? 'stop' : 'send'}
                  initial={{ scale: 0.8, opacity: 0, rotate: isStreaming ? 0 : -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotate: isStreaming ? 45 : 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}