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

export interface ModelDetails {
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  contextWindow: number;
}

export const modelDetails: Record<string, ModelDetails> = {
  // OpenAI Models
  'gpt-4o': {
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 128_000,
  },
  'gpt-4o-mini': {
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 128_000,
  },
  'o1': {
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 60.00,
    contextWindow: 200_000,
  },
  'o3-mini': {
    inputCostPerMillion: 1.10,
    outputCostPerMillion: 4.40,
    contextWindow: 200_000,
  },
  // GROQ Models with updated pricing
  'gemma2-9b-it': {
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.20,
    contextWindow: 8_192,
  },
  'llama-3.3-70b-versatile': {
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 128_000,
  },
  'llama-3.1-8b-instant': {
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.08,
    contextWindow: 8_192,
  },
  'llama-guard-3-8b': {
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.20,
    contextWindow: 8_192,
  },
  'llama3-70b-8192': {
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 8_192,
  },
  'llama3-8b-8192': {
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.08,
    contextWindow: 8_192,
  },
  // Mistral Models
  'mistral-large-latest': {
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 32_000, // Default value - update if you have specific context window info
  },
  'pixtral-large-latest': {
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 32_000, // Default value - update if you have specific context window info
  },
  'mistral-small-latest': {
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.30,
    contextWindow: 32_000, // Default value - update if you have specific context window info
  },
  
  // Anthropic Models
  'claude-3-7-sonnet-20250219': {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
  },
  'claude-3-5-sonnet-20241022': { // Mirroring 3.7 Sonnet as requested
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
  },
  'claude-3-5-haiku-20241022': {
    inputCostPerMillion: 0.80,
    outputCostPerMillion: 4.00,
    contextWindow: 200_000,
  },
  // Perplexity Models
  'sonar-pro': {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: -1, // TODO: Add actual context window
  },
  'sonar': {
    inputCostPerMillion: 1.00,
    outputCostPerMillion: 1.00,
    contextWindow: -1, // TODO: Add actual context window
  },
  // DeepSeek Models (cache miss pricing)
  'deepseek-chat': {
    inputCostPerMillion: 0.27,
    outputCostPerMillion: 1.10,
    contextWindow: 64_000,
  },
  'deepseek-reasoner': {
    inputCostPerMillion: 0.55,
    outputCostPerMillion: 2.19,
    contextWindow: 64_000,
  },
  // Google Models
  'gemini-2.0-flash-exp': {
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    contextWindow: 1_048_576, // 1M tokens
  },
  'gemini-1.5-pro': {
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 2_000_000, // 2M tokens
  },
  'gemini-1.5-pro-latest': {
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 2_000_000,
  },
  'gemini-1.5-flash': {
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 1_048_576,
  },
  'gemini-1.5-flash-latest': {
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 1_048_576,
  },
  'gemini-1.5-flash-8b': {
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: 1_048_576,
  },
  'gemini-1.5-flash-8b-latest': {
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: 1_048_576,
  },
  // xAI Grok Models (text only)
  'grok-2-1212': {
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 10.00,
    contextWindow: 32_768,
  },
  'grok-2-latest': {
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 10.00,
    contextWindow: 32_768,
  },
  'grok-3-beta': {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 131_072,
  },
  'grok-3': {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 131_072,
  },
  'grok-3-latest': {
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 131_072,
  },
  'grok-3-fast-beta': {
    inputCostPerMillion: 5.00,
    outputCostPerMillion: 25.00,
    contextWindow: 131_072,
  },
  'grok-3-fast': {
    inputCostPerMillion: 5.00,
    outputCostPerMillion: 25.00,
    contextWindow: 131_072,
  },
  'grok-3-fast-latest': {
    inputCostPerMillion: 5.00,
    outputCostPerMillion: 25.00,
    contextWindow: 131_072,
  },
  'grok-3-mini-beta': {
    inputCostPerMillion: 0.30,
    outputCostPerMillion: 0.50,
    contextWindow: 131_072,
  },
  'grok-3-mini': {
    inputCostPerMillion: 0.30,
    outputCostPerMillion: 0.50,
    contextWindow: 131_072,
  },
  'grok-3-mini-latest': {
    inputCostPerMillion: 0.30,
    outputCostPerMillion: 0.50,
    contextWindow: 131_072,
  },
  'grok-3-mini-fast-beta': {
    inputCostPerMillion: 0.60,
    outputCostPerMillion: 4.00,
    contextWindow: 131_072,
  },
  'grok-3-mini-fast': {
    inputCostPerMillion: 0.60,
    outputCostPerMillion: 4.00,
    contextWindow: 131_072,
  },
  'grok-3-mini-fast-latest': {
    inputCostPerMillion: 0.60,
    outputCostPerMillion: 4.00,
    contextWindow: 131_072,
  },
};




// Helper function to get the AI SDK model instance by its ID string
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
    // 'sonar-reasoning-pro': perplexity('sonar-reasoning-pro'),
    // 'r1-1776': perplexity('r1-1776'),
    // Mistral
    'pixtral-large-latest': mistral('pixtral-large-latest'),
    'mistral-small-latest': mistral('mistral-small-latest'),
    'mistral-large-latest': mistral('mistral-large-latest'),
    // Groq
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

export function getModelPricing(modelId: string): ModelDetails {
  const details = modelDetails[modelId];
  
  if (!details) {
    console.warn(`Model pricing not found for ID: ${modelId}. Using default model pricing.`);
    return modelDetails[DEFAULT_CHAT_MODEL];
  }

  return {
    inputCostPerMillion: details.inputCostPerMillion,
    outputCostPerMillion: details.outputCostPerMillion,
    contextWindow: details.contextWindow
  };
}
