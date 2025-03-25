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
import { xai } from '@ai-sdk/xai';




export const DEFAULT_CHAT_MODEL: string = 'gpt-4o';

export const myProvider = customProvider({
  languageModels: {
    'title-model': groq('llama-3.1-8b-instant'),
    'artifact-model': anthropic('claude-3-7-sonnet-20250219'),
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'sonar-pro': perplexity('sonar-pro'),
    'sonar': perplexity('sonar'),
    'sonar-reasoning-pro': perplexity('sonar-reasoning-pro'),
    'sonar-reasoning': perplexity('sonar-reasoning'),
    'r1-1776': perplexity('r1-1776'),
    'pixtral-large-latest': mistral('pixtral-large-latest'),
    'mistral-small-latest': mistral('mistral-small-latest'),
    'mistral-large-latest': mistral('mistral-large-latest'),
    'llama-3.3-70b-versatile': groq('llama-3.3-70b-versatile'),
    'llama-3.1-8b-instant': groq('llama-3.1-8b-instant'),
    'deepseek-chat': deepseek('deepseek-chat'),
    'deepseek-reasoner': deepseek('deepseek-reasoner'),
    'claude-3-5-sonnet-20241022': anthropic('claude-3-5-sonnet-20241022'),
    'claude-3-5-haiku-20241022': anthropic('claude-3-5-haiku-20241022'),
    'claude-3-7-sonnet-20250219': anthropic('claude-3-7-sonnet-20250219'),
    'o1-mini': openai('o1-mini'), 
    'o1': openai('o1'),
    'o3-mini': openai('o3-mini'),
    // Google Models
    'gemini-2.0-flash-exp': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro'),
    'gemini-1.5-pro-latest': google('gemini-1.5-pro-latest'),
    'gemini-1.5-flash': google('gemini-1.5-flash'),
    'gemini-1.5-flash-latest': google('gemini-1.5-flash-latest'),
    'gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'gemini-1.5-flash-8b-latest': google('gemini-1.5-flash-8b-latest'),
  },
  imageModels: {
    'small-model': openai.image('dall-e-2'),
    'large-model': openai.image('dall-e-3'),
  },
});

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  supportsReasoning?: boolean; // Add this field to indicate reasoning support
  defaultReasoningConfig?: Record<string, any>; // Add default reasoning configuration
}

// Define default reasoning configurations by provider
export const REASONING_CONFIGS = {
  anthropic: {
    thinking: { type: 'enabled', budgetTokens: 12000 }
  },
  openai: {
    thinking: { type: 'enabled', budgetTokens: 8000 }
  }
};

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT 4o mini',
    description: 'GPT-4o-mini model',
    provider: 'OpenAI'
  },
  {
    id: 'gpt-4o',
    name: 'GPT 4o',
    description: 'GPT-4o model',
    provider: 'OpenAI'
  },
  {
    id: 'sonar-pro',
    name: 'Sonar Pro',
    description: 'Perplexity Sonar Pro model',
    provider: 'Perplexity'
  },
  {
    id: 'sonar',
    name: 'Sonar',
    description: 'Perplexity Sonar model',
    provider: 'Perplexity'
  },
  {
    id: 'pixtral-large-latest',
    name: 'Pixtral Large (Latest)',
    description: 'Mistral Pixtral Large model',
    provider: 'Mistral'
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small (Latest)',
    description: 'Mistral Small model',
    provider: 'Mistral'
  },
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large (Latest)',
    description: 'Mistral Large model',
    provider: 'Mistral'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    description: 'Groq Llama 3.3 70B model',
    provider: 'Groq'
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    description: 'Groq Llama 3.1 8B model',
    provider: 'Groq'
  },
  {
    id: 'deepseek-chat',
    name: 'Deepseek v3',
    description: 'Deepseek v3 Chat model',
    provider: 'Deepseek'
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Anthropic Claude 3.7 Sonnet',
    provider: 'Anthropic',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.anthropic
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet Thinking',
    description: 'Anthropic Claude 3.7 Sonnet',
    provider: 'Anthropic',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.anthropic
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Anthropic Claude 3.5 Sonnet',
    provider: 'Anthropic',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.anthropic
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Anthropic Claude 3.5 Haiku',
    provider: 'Anthropic',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.anthropic
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    description: 'Deepseek R1 Reasoning Model',
    provider: 'DeepSeek',
    supportsReasoning: true
  },
  {
    id: 'o1-mini',
    name: 'OpenAI o1 Mini',
    description: 'OpenAI o1 Mini Reasoning Model',
    provider: 'OpenAI',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.openai
  },
  {
    id: 'o1',
    name: 'O1',
    description: 'OpenAI O1 reasoning model',
    provider: 'OpenAI',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.openai
  },
  {
    id: 'o3-mini',
    name: 'O3 Mini',
    description: 'OpenAI O3 Mini Reasoning Model',
    provider: 'OpenAI',
    supportsReasoning: true,
    defaultReasoningConfig: REASONING_CONFIGS.openai
  },
  // Google Models
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash',
    description: 'Google Gemini 2.0 Flash model with image generation capabilities',
    provider: 'Google',
    supportsReasoning: true
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google Gemini 1.5 Pro model',
    provider: 'Google',
    supportsReasoning: true
  },
  {
    id: 'gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro Latest',
    description: 'Latest version of Google Gemini 1.5 Pro model',
    provider: 'Google',
    supportsReasoning: true
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Google Gemini 1.5 Flash model',
    provider: 'Google'
  },
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash Latest',
    description: 'Latest version of Google Gemini 1.5 Flash model',
    provider: 'Google'
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    description: 'Google Gemini 1.5 Flash 8B model',
    provider: 'Google'
  },
  {
    id: 'gemini-1.5-flash-8b-latest',
    name: 'Gemini 1.5 Flash 8B Latest',
    description: 'Latest version of Google Gemini 1.5 Flash 8B model',
    provider: 'Google'
  }
];

// Different reasoning models have different capabilities
export const REASONING_MODEL_IDS = [
  'deepseek-reasoner',
  'o3-mini',
  'o1',
  'o1-mini',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest'
];

// Models that support tools
export const TOOLS_SUPPORTED_MODEL_IDS = [
  'o1',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'o3-mini',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest'
];

// Models that support structured object generation
export const OBJECT_GENERATION_MODEL_IDS = [
  'o1',
  'claude-3-7-sonnet-20250219',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'o3-mini',
  'o1-mini',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest'
];

export const isReasoningModel = (modelId: string): boolean => {
  return REASONING_MODEL_IDS.includes(modelId);
};

export const supportsTools = (modelId: string): boolean => {
  return !isReasoningModel(modelId) || TOOLS_SUPPORTED_MODEL_IDS.includes(modelId);
};

export const supportsObjectGeneration = (modelId: string): boolean => {
  return !isReasoningModel(modelId) || OBJECT_GENERATION_MODEL_IDS.includes(modelId);
};

export const supportsReasoningEffort = (modelId: string): boolean => {
  return ['o1', 'o1-mini', 'o3-mini', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'].includes(modelId);
};
