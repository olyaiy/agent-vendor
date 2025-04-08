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

  return (
    <div className={cn("w-full px-4 pb-4 md:pb-8 md:px-8", className)}>
      <div className="relative w-xl  mx-auto">
        <div className="relative flex flex-col ">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <Textarea
              id={id}
              value={value}
              placeholder={placeholder}
              className="w-full overflow-hidden rounded-xl rounded-b-none px-4 py-3 bg-black/5 dark:bg-white/5 border-none dark:text-white placeholder:text-black/70 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 leading-[1.2]"
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

          <div className="h-12 bg-black/5 dark:bg-white/5 rounded-b-xl">
            <div className="absolute left-3 bottom-3 flex items-center gap-2">
              <label className="cursor-pointer rounded-lg p-2 bg-black/5 dark:bg-white/5">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Paperclip className="w-4 h-4 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors" />
              </label>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8 cursor-pointer",
                  showSearch
                    ? "bg-sky-500/15 border-sky-400 text-sky-500"
                    : "bg-black/5 dark:bg-white/5 border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                )}
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{
                      rotate: showSearch ? 180 : 0,
                      scale: showSearch ? 1.1 : 1,
                    }}
                    whileHover={{
                      rotate: showSearch ? 180 : 15,
                      scale: 1.1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 10,
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Globe
                      className={cn(
                        "w-4 h-4",
                        showSearch
                          ? "text-sky-500"
                          : "text-inherit"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap text-sky-500 flex-shrink-0"
                    >
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              
            </div>
            <div className="absolute right-3 bottom-3">
              <button
                type="button"
                onClick={(status === 'submitted' || status === 'streaming') ? stop : handleInternalSubmit}
                disabled={
                  (status === 'ready' && !value.trim()) ||
                  (status !== 'ready' && status !== 'submitted' && status !== 'streaming')
                }
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  (status === 'submitted' || status === 'streaming')
                    ? "bg-red-500/15 text-red-500 hover:bg-red-500/25"
                    : value && status === 'ready'
                    ? "bg-sky-500/15 text-sky-500 hover:bg-sky-500/25"
                    : "bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 cursor-not-allowed"
                )}
              >
                {(status === 'submitted' || status === 'streaming') ? (
                  <StopCircle className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}