import type {
  CoreAssistantMessage,
  CoreToolMessage,
  Message,
  UIMessage,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type {  DBMessage, Document } from '@/lib/db/schema';

export interface ExtendedMessage extends Message {
  token_usage?: number | null;
  model_id?: string | null;
}

// Type definition for group agent info
export interface GroupAgentInfo {
  id: string;
  agent_display_name: string | null;
  avatar_url?: string | null;
  thumbnail_url?: string | null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const filteredMessages = messages.filter(message => {
    if (message.role !== 'assistant') return true;
    
    if (typeof message.content === 'string') return true;
    
    const hasToolCallWithoutResult = message.content.some(
      content => content.type === 'tool-call' && !toolResultIds.includes(content.toolCallId)
    );
    
    return !hasToolCallWithoutResult;
  });

  const messagesBySanitizedContent = filteredMessages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

/**
 * Format a number as USD currency
 * @param amount The number to format as currency
 * @returns Formatted currency string (e.g. $123.45)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(amount);
}

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20')
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

/**
 * Detects @mentions in a list of strings
 * Returns mentioned agents
 * 
 * @param texts - Array of strings to search for mentions
 * @param agents - List of agents that could be mentioned
 * @returns An array of mentioned agent IDs
 */
export function detectMentions(texts: string[], agents: GroupAgentInfo[]): string[] {
  if (!texts || !agents?.length) return [];
  
  const mentionedAgentIds: string[] = [];
  
  texts.forEach(text => {
    if (!text) return;
    
    agents.forEach(agent => {
      if (!agent.agent_display_name) return;
      
      const mentionPattern = `@${agent.agent_display_name}`;
      if (text.includes(mentionPattern) && !mentionedAgentIds.includes(agent.id)) {
        mentionedAgentIds.push(agent.id);
      }
    });
  });
  
  return mentionedAgentIds;
}