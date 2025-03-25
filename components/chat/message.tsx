'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CopyIcon,
  PencilEditIcon,
  SparklesIcon,
} from '@/components/util/icons';
import { Markdown } from '@/components/util/markdown';
import { MessageActions } from '@/components/chat/message-actions';

import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageEditor } from '@/components/chat/message-editor';
import { MessageReasoning } from '@/components/chat/message-reasoning';
import { PreviewAttachment } from '../util/preview-attachment';
import { ToolSection } from '../agent/tool-section';
import { CopyButton } from '@/components/util/copy-button';
import { UseChatHelpers } from '@ai-sdk/react';

const ToolInvocationItem = memo(({ 
  toolInvocation, 
  isReadonly,
  isCompact = false
}: { 
  toolInvocation: any; 
  isReadonly: boolean;
  isCompact?: boolean;
}) => {
  const [isToolOpen, setIsToolOpen] = useState(false);
  
  return (
    <div 
      key={toolInvocation.toolCallId} 
      className={cn(
        "w-full max-w-full overflow-scroll",
        isCompact && "max-w-[310px]"
      )}
    >
      <ToolSection
        tool={toolInvocation}
        isOpen={isToolOpen}
        onOpenChange={setIsToolOpen}
        isReadonly={isReadonly}
      />
    </div>
  );
});

// Add display name for the memoized component
ToolInvocationItem.displayName = 'ToolInvocationItem';

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  agentImageUrl,
  isCompact = false,
}: {
  chatId: string;
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  agentImageUrl?: string;
  isCompact?: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  console.log(message)

 

  return (
    <AnimatePresence>
      <motion.div
        className="w-full mx-auto max-w-3xl px-0 group/message relative"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        
        <div
          className={cn(
            'flex flex-col sm:flex-row gap-4 w-full group-data-[role=user]/message:ml-auto ',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit  ': mode !== 'edit',
              'group-data-[role=user]/message:max-w-2xl': !isCompact,
            },
          )}
        >
          
          {message.role === 'assistant' && (
            <div className={cn(
              "size-12 sm:size-16 flex items-center rounded-full justify-center ring-1 ring-border shrink-0 bg-background overflow-hidden relative ",
              isCompact && "size-8 sm:size-8 ml-1 mt-1"
            )}>
              {agentImageUrl ? (
                <Image 
                  src={agentImageUrl} 
                  alt="Agent avatar" 
                  width={32} 
                  height={32} 
                  className="size-full object-cover"
                  quality={100}
                  unoptimized={true}
                />
              ) : (
                <div className="translate-y-px">
                  <SparklesIcon size={14} />
                </div>
              )}
            </div>
          )}

          <div className={cn("flex flex-col w-full relative ", {
            "max-w-full": !isCompact,
          })}>
            
            {message.experimental_attachments && (
              <div className="flex flex-row justify-end gap-2">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

      {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'file' && part.mimeType?.startsWith('image/')) {
                return (
                  <Image
                    key={key}
                    src={`data:${part.mimeType};base64,${part.data}`}
                    alt="Generated image"
                    width={512}
                    height={512}
                    className="rounded-lg"
                    unoptimized
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row  items-end">


                       {/* USER Message Actions */}
                       {message.role === 'user' && !isReadonly && (
                        <div className="flex flex-row gap-2 items-center  ">
                          <CopyButton 
                            className="p-2 h-fit opacity-0 group-hover/message:opacity-100" 
                            textToCopy={part.text} 
                          />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              data-testid="message-edit-button"
                              variant="ghost"
                              className="p-2 h-fit opacity-0 group-hover/message:opacity-100"
                              onClick={() => {
                                setMode('edit');
                              }}
                            >
                              <PencilEditIcon />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit message</TooltipContent>
                        </Tooltip>
                        </div>
                      )}
                     

                      {/* Message content */}
                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                     
                    </div>
                  );
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="size-8" />
                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  );
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                return (
                  <ToolInvocationItem 
                    key={toolCallId} 
                    toolInvocation={toolInvocation} 
                    isReadonly={isReadonly} 
                    isCompact={isCompact}
                  />
                );
              }

              if (type === 'source' && 'source' in part) {
                return null; // We'll render sources separately below
              }
              
            })}

            {/* Sources section */}
            {message.parts?.some(part => part.type === 'source') && (
              <div className="mt-2 text-sm border-t border-border pt-2">
                <div className="font-medium text-muted-foreground mb-1">Sources:</div>
                <div className="flex flex-wrap gap-2">
                  {message.parts
                    .filter(part => part.type === 'source' && 'source' in part)
                    .map((part: any) => (
                      <a
                        key={`source-${part.source.id}`}
                        href={part.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors"
                      >
                        {part.source.title || new URL(part.source.url).hostname}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="ml-0.5"
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ))}
                </div>
              </div>
            )}

            {!isReadonly && message.role === 'assistant' && (

              <div className="flex flex-row gap-2 ">
                <CopyButton 
                className="h-fit opacity-0 group-hover/message:opacity-100" 
                textToCopy={message.parts?.map((part) => {
                  if ('text' in part) return part.text;
                  if ('reasoning' in part) return part.reasoning;
                  return '';
                }).filter(Boolean).join('\n')} 
              />
              
             
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};



export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    // Check for loading state changes
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    
    // Check for reasoning updates - simplified check
    if (prevProps.message.reasoning !== nextProps.message.reasoning) return false;
        
    // Check if compact mode changed
    if (prevProps.isCompact !== nextProps.isCompact) return false;
    
    // Check if agentImageUrl changed
    if (prevProps.agentImageUrl !== nextProps.agentImageUrl) return false;
    
    // Check content changes
    if (prevProps.message !== nextProps.message) return false;
    
    // Check tool invocations
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
      

    // Also compare token_usage to prevent unnecessary rerenders
    if ((prevProps.message as any).token_usage !== (nextProps.message as any).token_usage) return false;

    return true;
  },
);

export const ThinkingMessage = ({ agentImageUrl }: { agentImageUrl?: string }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-0 group/message relative"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      data-role="assistant"
    >
      <div className="flex flex-row gap-4 w-full">
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background overflow-hidden relative">
          {agentImageUrl ? (
            <Image 
              src={agentImageUrl} 
              alt="Agent avatar" 
              width={32} 
              height={32} 
              className="size-full object-cover"
              quality={100}
              unoptimized={true}
            />
          ) : (
            <div className="translate-y-px">
              <SparklesIcon size={14} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full justify-center">
          <div className="flex flex-row items-center h-8 gap-2 text-muted-foreground">
            <div className="flex flex-row items-center gap-1.5">
              <span className="font-medium">Thinking</span>
              <div className="flex gap-1 items-center">
                <motion.div
                  className="size-1.5 rounded-full bg-primary"
                  animate={{
                    scale: [0.5, 1, 0.5],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0
                  }}
                />
                <motion.div
                  className="size-1.5 rounded-full bg-primary"
                  animate={{
                    scale: [0.5, 1, 0.5],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.15
                  }}
                />
                <motion.div
                  className="size-1.5 rounded-full bg-primary"
                  animate={{
                    scale: [0.5, 1, 0.5],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                />
              </div>
            </div>
            
            {elapsedTime > 3 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-xs text-muted-foreground/70 ml-1"
              >
                {elapsedTime}s
              </motion.div>
            )}
          </div>
          
          {elapsedTime > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.4 }}
              className="text-xs text-muted-foreground/80 max-w-lg"
            >
              Working on a thoughtful response{elapsedTime > 8 ? ". This might take a moment for complex questions" : ""}
            </motion.div>
          )}
          <span className="sr-only">AI is thinking - elapsed time: {elapsedTime} seconds</span>
        </div>
      </div>
    </motion.div>
  );
};


