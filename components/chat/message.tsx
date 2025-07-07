'use client';

import type { UIMessage } from 'ai';

import { memo, useState } from 'react';

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
import Image from 'next/image';
import { MessageEditor } from '../message-editor';
import { Paperclip } from 'lucide-react';

interface UIMessageWithUI extends UIMessage {
  ui?: React.ReactNode;
}

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
  message: UIMessageWithUI;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [viewMode, setViewMode] = useState<'formatted' | 'markdown'>('formatted');

  return (
    <div
      data-testid={`message-${message.role}`}
      className="w-full mx-auto max-w-3xl px-4 group/message overflow-x-hidden"
      data-role={message.role}
    >
      <div
        className={cn(
          'flex gap-2 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl items-end justify-end ml-auto ',
          {
            'w-full': mode === 'edit',
            'group-data-[role=user]/message:w-fit  justify-end items-end justify-self-end ml-auto': mode !== 'edit',
          },
        )}
      >

        <div className="flex flex-col gap-2  w-full group-data-[role=user]/message:items-end ml-auto">
          {/* Display attachments for user messages */}
          {message.role === 'user' && message.experimental_attachments && message.experimental_attachments.length > 0 && (
            <div
              data-testid={`message-attachments-${message.id}`}
              className="flex flex-wrap gap-2 mb-1 justify-end" // Added mb-1 for slight spacing if text follows
            >
              {message.experimental_attachments.map((attachment, index) => {
                // Handle image attachments
                if (attachment.contentType?.startsWith('image/')) {
                  return (
                    <a
                      key={`${message.id}-attachment-${index}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-border rounded-md overflow-hidden hover:opacity-80 transition-opacity bg-muted/30"
                      title={attachment.name || 'View image'}
                    >
                      <Image
                        src={attachment.url}
                        alt={attachment.name || 'Chat attachment'}
                        width={150}
                        height={150}
                        className="max-w-[150px] h-auto max-h-[150px] object-contain"
                        unoptimized={attachment.url.startsWith('blob:')}
                      />
                    </a>
                  );
                }
                // Handle CSV attachments
                else if (attachment.contentType === 'text/csv') {
                  return (
                    <a
                      key={`${message.id}-attachment-${index}`}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 border border-border rounded-md hover:bg-muted/20 transition-colors bg-muted/10"
                      title={`Open ${attachment.name || 'CSV file'}`}
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-muted/30 rounded-md border border-border/50">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {attachment.name || 'csv-data.csv'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          CSV File
                        </span>
                      </div>
                    </a>
                  );
                }
                // Other file types can be handled here if needed
                return null;
              })}
            </div>
          )}

        {/* Check if there's a custom UI element first */}
        {message.ui ? (
            <div data-testid="message-ui-content">{message.ui}</div>
          ) : (
            // Otherwise, render parts as usual
            <>
              {/* Non-source parts */}
              {message.parts?.filter(part => part.type !== 'source').map((part, index) => {
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

                // Text Message
                if (type === 'text') {
                  if (mode === 'view') {
                    return (
                      <div key={key} className="flex flex-row gap-2 items-start md:max-w-2xl sm:max-w-xl max-w-full">
                        <div
                          data-testid="message-content"
                          className={cn('flex flex-col gap-4 max-w-full', {
                            'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                              message.role === 'user',
                          })}
                        >
                          {viewMode === 'markdown' ? (
                            <div className="whitespace-pre-wrap font-mono text-sm bg-muted/30 p-3 rounded-md border">
                              {part.text}
                            </div>
                          ) : (
                            <Markdown key={`${message.id}-${index}`} messageRole={message.role}>
                              {part.text}
                            </Markdown>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Message Editor Mode
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

                // Tool Invocation
                if (type === 'tool-invocation') {
                  const { toolInvocation } = part;
                  const { toolCallId } = toolInvocation;
                  // Use the new ToolMessage component
                  return <ToolMessage key={toolCallId} toolInvocation={toolInvocation} />;
                }

                // Add a fallback return for the map function
                return null;
              })}
              
              {/* Source parts in a flex container */}
              {message.parts?.some(part => part.type === 'source') && (
                <div className="flex flex-row flex-wrap gap-2 mt-2">
                  {message.parts
                    .filter(part => part.type === 'source')
                    .map((part, index) => {
                      const key = `message-${message.id}-source-${index}`;
                      const sourceItem = part.source as { id: string, url: string, title?: string };
                      
                      return (
                        <div key={key} className="inline-flex items-center px-2 py-1 rounded-md bg-muted/40 text-xs text-muted-foreground hover:bg-muted/70 transition-colors">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="mr-1.5 size-3"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                          <a 
                            href={sourceItem.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline font-medium"
                            aria-label={`Source: ${sourceItem.title ?? new URL(sourceItem.url).hostname}`}
                          >
                            {sourceItem.title ?? new URL(sourceItem.url).hostname}
                          </a>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}

          {/* Message Actions */}
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
              viewMode={viewMode}
              setViewMode={setViewMode}
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
    // Add comparison for experimental_attachments
    if (!equal(prevProps.message.experimental_attachments, nextProps.message.experimental_attachments)) return false;


    return true;
  },
);

export const ThinkingMessage = ({ agentImageUrl }: { agentImageUrl?: string }) => {
  return (
    <div
      className="w-full mx-auto max-w-3xl px-0 group/message relative"
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
                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                <div className="size-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.25s' }} />
                <div className="size-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground/80 max-w-lg">
            Working on a thoughtful response
          </div>
          <span className="sr-only">AI is thinking</span>
        </div>
      </div>
    </div>
  );
};
