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
    'gemini-2.5-pro-exp-03-25': google('gemini-2.5-pro-exp-03-25'),
    'gemini-2.0-flash-exp': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro'),
    'gemini-1.5-pro-latest': google('gemini-1.5-pro-latest'),
    'gemini-1.5-flash': google('gemini-1.5-flash'),
    'gemini-1.5-flash-latest': google('gemini-1.5-flash-latest'),
    'gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'gemini-1.5-flash-8b-latest': google('gemini-1.5-flash-8b-latest'),
    'grok-2-latest': xai('grok-2-latest'),
    'grok-3': xai('grok-3'),
    'grok-3-mini': xai('grok-3-mini'),
  },

});

// Updated ModelDetails interface
export interface ModelDetails {
  displayName: string;
  description: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  contextWindow: number;
}

// Updated modelDetails object with displayName and description
export const modelDetails: Record<string, ModelDetails> = {
  // OpenAI Models
  'gpt-4o': {
    displayName: "GPT-4o",
    description: "OpenAI's flagship multimodal model with text, audio, image, and video capabilities for versatile, real-time interactions.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 128_000,
  },
  'gpt-4o-mini': {
    displayName: "GPT-4o Mini",
    description: "Smaller, cost-effective multimodal model that outperforms GPT-3.5 Turbo with similar speed at approximately 60% of the cost.",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 128_000,
  },
  'o1': {
    displayName: "O1",
    description: "OpenAI's premium model designed for complex reasoning and specialized tasks requiring exceptional performance.",
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 60.00,
    contextWindow: 200_000,
  },
  'o3-mini': {
    displayName: "O3 Mini",
    description: "Compact version of OpenAI's advanced O-series models offering good performance for everyday tasks at a more accessible price point.",
    inputCostPerMillion: 1.10,
    outputCostPerMillion: 4.40,
    contextWindow: 200_000,
  },
  // GROQ Models with updated pricing
  'gemma2-9b-it': {
    displayName: "Gemma 2 9B IT",
    description: "Lightweight, state-of-the-art open model with impressive performance in text generation, reasoning, and multilingual capabilities.",
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.20,
    contextWindow: 8_192,
  },
  'llama-3.3-70b-versatile': {
    displayName: "Llama 3.3 70B Versatile",
    description: "High-performance model excelling at coding, reasoning, math, general knowledge tasks, instruction following, and tool use.",
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 128_000,
  },
  'llama-3.1-8b-instant': {
    displayName: "Llama 3.1 8B Instant",
    description: "Fast, efficient model optimized for quick responses and basic tasks with minimal computational requirements.",
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.08,
    contextWindow: 8_192,
  },
  'llama-guard-3-8b': {
    displayName: "Llama Guard 3 8B",
    description: "Specialized safety-focused model designed to detect and filter harmful content in AI interactions.",
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.20,
    contextWindow: 8_192,
  },
  'llama3-70b-8192': {
    displayName: "Llama 3 70B",
    description: "Powerful large language model with strong reasoning capabilities and high performance across diverse tasks.",
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 8_192,
  },
  'llama3-8b-8192': {
    displayName: "Llama 3 8B",
    description: "Compact, efficient model suitable for deployment in resource-constrained environments while maintaining good performance.",
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.08,
    contextWindow: 8_192,
  },
  // Mistral Models
  'mistral-large-latest': {
    displayName: "Mistral Large",
    description: "Advanced model with strong multilingual, reasoning, math, and code generation capabilities for complex, reasoning-heavy tasks.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 32_000,
  },
  'pixtral-large-latest': {
    displayName: "Pixtral Large",
    description: "Multimodal extension of Mistral's technology with enhanced visual understanding and processing capabilities.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 32_000,
  },
  'mistral-small-latest': {
    displayName: "Mistral Small",
    description: "Optimized for simple, bulk tasks such as classification, customer support, and basic text generation at an affordable price point.",
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.30,
    contextWindow: 32_000,
  },
  
  // Anthropic Models
  'claude-3-7-sonnet-20250219': {
    displayName: "Claude 3.7 Sonnet",
    description: "Anthropic's most intelligent model with hybrid reasoning capabilities and extended thinking mode for complex problem-solving.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
  },
  'claude-3-5-sonnet-20241022': {
    displayName: "Claude 3.5 Sonnet",
    description: "Advanced model excelling in coding, writing, visual data extraction, agentic tasks, and tool use with computer action generation.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
  },
  'claude-3-5-haiku-20241022': {
    displayName: "Claude 3.5 Haiku",
    description: "Fast model combining rapid response times with improved reasoning capabilities for speed-critical applications.",
    inputCostPerMillion: 0.80,
    outputCostPerMillion: 4.00,
    contextWindow: 200_000,
  },
  // Perplexity Models
  'sonar-pro': {
    displayName: "Sonar Pro",
    description: "Premium research-focused model with advanced information retrieval and synthesis capabilities for complex queries.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 32_000, // Estimated based on similar models
  },
  'sonar': {
    displayName: "Sonar",
    description: "Balanced model offering good performance for general research and information retrieval tasks at a moderate price point.",
    inputCostPerMillion: 1.00,
    outputCostPerMillion: 1.00,
    contextWindow: 16_000, // Estimated based on similar models
  },
  // DeepSeek Models (cache miss pricing)
  'deepseek-chat': {
    displayName: "DeepSeek Chat",
    description: "Versatile conversational model with strong general knowledge and natural dialogue capabilities for diverse applications.",
    inputCostPerMillion: 0.27,
    outputCostPerMillion: 1.10,
    contextWindow: 64_000,
  },
  'deepseek-reasoner': {
    displayName: "DeepSeek Reasoner",
    description: "Specialized model focused on complex reasoning tasks, problem-solving, and logical deduction with enhanced accuracy.",
    inputCostPerMillion: 0.55,
    outputCostPerMillion: 2.19,
    contextWindow: 64_000,
  },
  // Google Models
  'gemini-2.5-pro-exp-03-25': {
    displayName: "Gemini 2.5 Pro Exp",
    description: "Google's experimental multimodal model featuring advanced reasoning, native audio/video processing, and an extensive 1M token context window for handling complex, long-form tasks.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 1_048_576,
  },
  'gemini-2.0-flash-exp': {
    displayName: "Gemini 2.0 Flash",
    description: "Fast model with enhanced performance, multimodal capabilities, and native support for generating images and text-to-speech audio.",
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    contextWindow: 1_048_576, // 1M tokens
  },
  'gemini-1.5-pro': {
    displayName: "Gemini 1.5 Pro",
    description: "Powerful multimodal model with an extremely large context window for handling extensive documents and complex tasks.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 2_000_000, // 2M tokens
  },
  'gemini-1.5-pro-latest': {
    displayName: "Gemini 1.5 Pro Latest",
    description: "Most recent version of Google's powerful multimodal model with exceptional context handling and reasoning capabilities.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 2_000_000,
  },
  'gemini-1.5-flash': {
    displayName: "Gemini 1.5 Flash",
    description: "Optimized for speed while maintaining strong performance across various tasks with an impressive context window.",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 1_048_576,
  },
  'gemini-1.5-flash-latest': {
    displayName: "Gemini 1.5 Flash Latest",
    description: "Latest version of Google's speed-optimized model with improved performance and extensive context handling.",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 1_048_576,
  },
  'gemini-1.5-flash-8b': {
    displayName: "Gemini 1.5 Flash 8B",
    description: "Compact, efficient model designed for cost-effective deployment while maintaining good performance and large context window.",
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: 1_048_576,
  },
  'gemini-1.5-flash-8b-latest': {
    displayName: "Gemini 1.5 Flash 8B Latest",
    description: "Latest version of Google's compact model offering improved efficiency and performance for everyday tasks.",
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    contextWindow: 1_048_576,
  },
  // xAI Grok Models (text only)
  'grok-2-latest': {
    displayName: "Grok 2",
    description: "Powerful model with strong reasoning capabilities and a distinctive personality for engaging interactions.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 10.00,
    contextWindow: 32_768,
    
  },
  'grok-3': {
    displayName: "Grok 3",
    description: "Advanced model specializing in code generation, debugging, and multi-step problem-solving with multiple operational modes.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 131_072,
  },
  'grok-3-mini': {
    displayName: "Grok 3 Mini",
    description: "Compact version of Grok 3 optimized for quick answers and everyday tasks while maintaining good performance.",
    inputCostPerMillion: 0.30,
    outputCostPerMillion: 0.50,
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
    'gemini-2.5-pro-exp-03-25': google('gemini-2.5-pro-exp-03-25'),
    'gemini-2.0-flash-exp': google('gemini-2.0-flash-exp'),
    'gemini-1.5-pro': google('gemini-1.5-pro'),
    'gemini-1.5-pro-latest': google('gemini-1.5-pro-latest'),
    'gemini-1.5-flash': google('gemini-1.5-flash'),
    'gemini-1.5-flash-latest': google('gemini-1.5-flash-latest'),
    'gemini-1.5-flash-8b': google('gemini-1.5-flash-8b'),
    'gemini-1.5-flash-8b-latest': google('gemini-1.5-flash-8b-latest'),
    // xAI Grok
    'grok-2-latest': xai('grok-2-latest'),
    'grok-3': xai('grok-3'),
    'grok-3-mini': xai('grok-3-mini'),
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
    displayName: details.displayName,
    description: details.description,
    inputCostPerMillion: details.inputCostPerMillion,
    outputCostPerMillion: details.outputCostPerMillion,
    contextWindow: details.contextWindow
  };
}
