'use client';

import type { UIMessage } from 'ai';

import { memo, useEffect, useState } from 'react';

// import { DocumentToolCall, DocumentToolResult } from './document';
import { SparklesIcon } from '../utils/icons';
import { Markdown } from './markdown';
// import { PreviewAttachment } from './preview-attachment';
import { ToolMessage } from './tool-message';
import equal from 'fast-deep-equal';

import { cn } from '@/lib/utils';
// import { DocumentPreview } from './document-preview';

import { UseChatHelpers } from '@ai-sdk/react';
import { MessageReasoning } from './message-reasoning';
import { MessageActions } from './message-actions';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MessageEditor } from '../message-editor';

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  // setMessages,
  reload,
  isReadonly,
  setMessages,
}: {
  chatId: string;
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  console.log('message part is', message.parts)

  return (
    <div
      data-testid={`message-${message.role}`}
      className="w-full mx-auto max-w-3xl px-4 group/message"
      data-role={message.role}
    >
      <div
        className={cn(
          'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl  ',
          {
            'w-full': mode === 'edit',
            'group-data-[role=user]/message:w-fit ': mode !== 'edit',
          },
        )}
      >

        {/* Assistant Avatar */}
        {/* {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <div className="translate-y-px">
              <SparklesIcon size={14} />
            </div>
          </div>
        )} */}

        <div className="flex flex-col gap-4 w-full group-data-[role=user]/message:items-end">
          {message.experimental_attachments && (
            <div
              data-testid={`message-attachments`}
              className="flex flex-row justify-end gap-2"
            >
              {/* {message.experimental_attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                />
              ))} */}
            </div>
          )}

          {/* Check if there's a custom UI element first */}
          {message.parts?.map((part, index) => { // Map callback starts here
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

            if (type === 'text') {
              if (mode === 'view') {
                return (
                  <div key={key} className="flex flex-row gap-2 items-start">
                    <div
                      data-testid="message-content"
                      className={cn('flex flex-col gap-4', {
                        'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                          message.role === 'user',
                      })}
                    >
                      <Markdown key={`${message.id}-${index}`}>
                        {part.text}
                      </Markdown>
                      {/* {part.text} */}
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
              const { toolCallId } = toolInvocation;
              // Use the new ToolMessage component
              return <ToolMessage key={toolCallId} toolInvocation={toolInvocation} />;
            }
            // Add a fallback return for the map function
            return null;
          })}

          {!isReadonly && (
            <MessageActions
              key={`action-${message.id}`}
              chatId={chatId}
              message={message}
              isLoading={isLoading}
              reload={reload}
              setMessages={setMessages}
              setMode={setMode}
              isReadonly={isReadonly}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;


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
        <div className="size-8 flex items-center rounded-full justify-center shrink-0  bg-background overflow-hidden relative">
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