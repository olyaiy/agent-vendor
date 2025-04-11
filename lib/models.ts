import { openai } from '@ai-sdk/openai';
import {
  customProvider,
} from 'ai';
import { perplexity } from '@ai-sdk/perplexity';
import { mistral } from '@ai-sdk/mistral';
import { groq } from '@ai-sdk/groq';
import { deepseek } from '@ai-sdk/deepseek';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { LanguageModel } from 'ai'; // Import LanguageModel type
import { xai } from '@ai-sdk/xai';

export const DEFAULT_CHAT_MODEL: string = 'gpt-4o';

export const myProvider = customProvider({
  languageModels: {
    'title-model': groq('llama3-8b-8192'),

    // OpenAI Models
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'o1-mini': openai('o1-mini'), 
    'o1': openai('o1'),
    'o3-mini': openai('o3-mini'),

    // Perplexity Models
    'sonar-pro': perplexity('sonar-pro'),
    'sonar': perplexity('sonar'),
    'sonar-reasoning-pro': perplexity('sonar-reasoning-pro'),
    'r1-1776': perplexity('r1-1776'),

    // Mistral Models
    'pixtral-large-latest': mistral('pixtral-large-latest'),
    'mistral-small-latest': mistral('mistral-small-latest'),
    'mistral-large-latest': mistral('mistral-large-latest'),

    // Groq Models
    'llama-3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
    'llama-3.1-8b-instant': groq('llama-3.1-8b-instant'),
    'gemma2-9b-it': groq('gemma2-9b-it'),
    'llama-guard-3-8b': groq('llama-guard-3-8b'),
    'llama3-70b-8192': groq('llama3-70b-8192'),
    'llama3-8b-8192': groq('llama3-8b-8192'),
    'mixtral-8x7b-32768': groq('mixtral-8x7b-32768'),
    'qwen-qwq-32b': groq('qwen-qwq-32b'),
    'mistral-saba-24b': groq('mistral-saba-24b'),
    'qwen-2.5-32b': groq('qwen-2.5-32b'),


    // DeepSeek Models
    'deepseek-chat': deepseek('deepseek-chat'),
    'deepseek-reasoner': deepseek('deepseek-reasoner'),

    // Anthropic Models
    'claude-3-5-sonnet-20241022': anthropic('claude-3-5-sonnet-20241022'),
    'claude-3-5-haiku-20241022': anthropic('claude-3-5-haiku-20241022'),
    'claude-3-7-sonnet-20250219': anthropic('claude-3-7-sonnet-20250219'),

    
    // Google Models
    'gemini-2.0-flash-exp': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro'),
    'gemini-1.5-pro-latest': google('gemini-1.5-pro-latest'),
    'gemini-1.5-flash': google('gemini-1.5-flash'),
    'gemini-1.5-flash-latest': google('gemini-1.5-flash-latest'),
    'gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'gemini-1.5-flash-8b-latest': google('gemini-1.5-flash-8b-latest'),

    // xAI Grok Models
    'grok-2-1212': xai('grok-2-1212'),
    'grok-2-latest': xai('grok-2-latest'),
  },

});

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  supportsReasoning?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultReasoningConfig?: Record<string, any>;
}

// Helper function to get the AI SDK model instance by its ID string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getModelInstanceById(modelId: string): LanguageModel {
  const modelMap: Record<string, LanguageModel> = {
    // OpenAI
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'o1-mini': openai('o1-mini'),
    'o1': openai('o1'),
    'o3-mini': openai('o3-mini'),
    // Perplexity
    'sonar-pro': perplexity('sonar-pro'),
    'sonar': perplexity('sonar'),
    'sonar-reasoning-pro': perplexity('sonar-reasoning-pro'),
    'r1-1776': perplexity('r1-1776'),
    // Mistral
    'pixtral-large-latest': mistral('pixtral-large-latest'),
    'mistral-small-latest': mistral('mistral-small-latest'),
    'mistral-large-latest': mistral('mistral-large-latest'),
    // Groq
    'llama-3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
    'llama-3.1-8b-instant': groq('llama3-8b-8192'),
    'gemma2-9b-it': groq('gemma2-9b-it'),
    'llama-guard-3-8b': groq('llama-guard-3-8b'),
    'llama3-70b-8192': groq('llama3-70b-8192'),
    'llama3-8b-8192': groq('llama3-8b-8192'),
    'mixtral-8x7b-32768': groq('mixtral-8x7b-32768'),
    'qwen-qwq-32b': groq('qwen-qwq-32b'),
    'mistral-saba-24b': groq('mistral-saba-24b'),
    'qwen-2.5-32b': groq('qwen-2.5-32b'),
    // DeepSeek
    'deepseek-chat': deepseek('deepseek-chat'),
    'deepseek-reasoner': deepseek('deepseek-reasoner'),
    // Anthropic
    'claude-3-5-sonnet-20241022': anthropic('claude-3-5-sonnet-20241022'),
    'claude-3-5-haiku-20241022': anthropic('claude-3-5-haiku-20241022'),
    'claude-3-7-sonnet-20250219': anthropic('claude-3-7-sonnet-20250219'),
    // Google
    'gemini-2.0-flash-exp': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro'),
    'gemini-1.5-pro-latest': google('gemini-1.5-pro-latest'),
    'gemini-1.5-flash': google('gemini-1.5-flash'),
    'gemini-1.5-flash-latest': google('gemini-1.5-flash-latest'),
    'gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'gemini-1.5-flash-8b-latest': google('gemini-1.5-flash-8b-latest'),
    // xAI Grok
    'grok-2-1212': xai('grok-2-1212'),
    'grok-2-latest': xai('grok-2-latest'),
    // Add other models from myProvider if necessary
  };

  const modelInstance = modelMap[modelId];

  if (!modelInstance) {
    console.warn(`Model ID "${modelId}" not found in getModelInstanceById. Falling back to default: ${DEFAULT_CHAT_MODEL}`);
    // Fallback to a default model if the provided ID is not found
    return modelMap[DEFAULT_CHAT_MODEL] || openai('gpt-4o'); // Ensure a default exists
  }

  return modelInstance;
}
