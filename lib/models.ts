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
    'title-model': google('gemini-1.5-flash-8b'),

    // OpenAI Models
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'gpt-4.1': openai('gpt-4.1'),
    'gpt-4.1-mini': openai('gpt-4.1-mini'),
    'gpt-4.1-nano': openai('gpt-4.1-nano'),
    'o1-mini': openai('o1-mini'), 
    'o1': openai('o1'),
    'o3-mini': openai('o3-mini'),
    'o3': openai('o3'),
    'o4-mini': openai('o4-mini'),

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
    'llama-4-scout-17b-16e': groq('meta-llama/llama-4-scout-17b-16e-instruct'),
    'llama-4-maverick-17b-128e': groq('meta-llama/llama-4-maverick-17b-128e'),

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
    'gemini-2.5-flash-preview-04-17': google('gemini-2.5-flash-preview-04-17'),


    // xAI Grok Models 
    'grok-2-latest': xai('grok-2-latest'),
    'grok-3': xai('grok-3'),
    'grok-3-mini': xai('grok-3-mini'),
  },

});



// New interface for configurable ranges
export interface ModelSettingRange {
  default: number;
  min: number;
  max: number;
}

export interface ModelSettings {
  maxOutputTokens?: ModelSettingRange;
  temperature?: ModelSettingRange;
  topP?: ModelSettingRange;
  topK?: ModelSettingRange;
  frequencyPenalty?: ModelSettingRange;
  presencePenalty?: ModelSettingRange;
}

// Updated ModelDetails interface
export interface ModelDetails {
  displayName: string;
  description: string;
  inputCostPerMillion: number;
  outputCostPerMillion: number;
  contextWindow: number;
  defaultSettings?: Partial<ModelSettings>;
}

// Updated modelDetails object with displayName and description
export const modelDetails: Record<string, ModelDetails> = {


  // OpenAI Models (Model settings added ✅)
  'gpt-4o': {
    displayName: "GPT-4o",
    description: "OpenAI's flagship multimodal model with text, audio, image, and video capabilities for versatile, real-time interactions.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 128_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 2048
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 2
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 2
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },
  'gpt-4o-mini': {
    displayName: "GPT-4o Mini",
    description: "Smaller, cost-effective multimodal model that outperforms GPT-3.5 Turbo with similar speed at approximately 60% of the cost.",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    contextWindow: 128_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 2048
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 2
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 2
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },
  'o1': {
    displayName: "o1",
    description: "OpenAI's premium model designed for complex reasoning and specialized tasks requiring exceptional performance.",
    inputCostPerMillion: 15.00,
    outputCostPerMillion: 60.00,
    contextWindow: 200_000,
  },
  'o3-mini': {
    displayName: "o3 Mini",
    description: "Compact version of OpenAI's advanced O-series models offering good performance for everyday tasks at a more accessible price point.",
    inputCostPerMillion: 1.10,
    outputCostPerMillion: 4.40,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 4096,
        min: 50,
        max: 8192
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 2
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },
  'o3': {
    displayName: "o3",
    description: "OpenAI's most powerful reasoning model with leading performance on coding, math, science, and vision tasks",
    inputCostPerMillion: 10.00,
    outputCostPerMillion: 40.00,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 16384,
        min: 0,
        max: 32768
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 1
      }
    }
  },
  'o4-mini': {
    displayName: "o4 Mini",
    description: "OpenAI's o4-mini delivers fast, cost-efficient reasoning with exceptional performance for its size, particularly excelling in math (best-performing on AIME benchmarks), coding, and visual tasks.",
    inputCostPerMillion: 1.10,
    outputCostPerMillion: 4.40,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 16384,
        min: 0,
        max: 32768
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 1
      }
    }
  },
  'gpt-4.1': {
    displayName: "GPT-4.1",
    description: "GPT 4.1 is OpenAl's flagship model for complex tasks. It is well suited for problem solving across domains.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 8.00,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 2048
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 2
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 2
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },
  'gpt-4.1-mini': {
    displayName: "GPT-4.1 Mini",
    description: "GPT 4.1 mini provides a balance between intelligence, speed, and cost that makes it an attractive model for many use cases.",
    inputCostPerMillion: 0.40,
    outputCostPerMillion: 1.60,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 2048
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 2
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 2
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },
  'gpt-4.1-nano': {
    displayName: "GPT-4.1 nano",
    description: "GPT-4.1 nano is the fastest, most cost-effective GPT 4.1 model.",
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    contextWindow: 1_047_576,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 2048
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 2
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 0,
        min: 0,
        max: 2
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },


  // Anthropic Models (Model settings added ✅)
  'claude-3-7-sonnet-20250219': {
    displayName: "Claude 3.7 Sonnet",
    description: "Claude 3.7 Sonnet is the first hybrid reasoning model and Anthropic's most intelligent model to date. It delivers state-of-the-art performance for coding, content generation, data analysis, and planning tasks, building upon its predecessor Claude 3.5 Sonnet's capabilities in software engineering and computer use.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 4096
      },
      temperature: {
        default: 1,
        min: 0.1,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      topK: {
        default: 1,
        min: 1,
        max: 500
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'claude-3-5-sonnet-20241022': {
    displayName: "Claude 3.5 Sonnet",
    description: "Claude 3.5 Sonnet strikes the ideal balance between intelligence and speed-particularly for enterprise workloads. It delivers strong performance at a lower cost compared to its peers, and is engineered for high endurance in large-scale Al deployments.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 4096
      },
      temperature: {
        default: 1,
        min: 0.1,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      topK: {
        default: 1,
        min: 1,
        max: 500
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'claude-3-5-haiku-20241022': {
    displayName: "Claude 3.5 Haiku",
    description: "Fast model combining rapid response times with improved reasoning capabilities for speed-critical applications.",
    inputCostPerMillion: 0.80,
    outputCostPerMillion: 4.00,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 50,
        max: 4096
      },
      temperature: {
        default: 1,
        min: 0.1,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      topK: {
        default: 1,
        min: 1,
        max: 500
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 1,
        min: 0,
        max: 1
      }
    }
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
    description: "The Meta Llama 3.3 multilingual model is a pretrained and instruction tuned generative model with 70B parameters. Optimized for multilingual dialogue use cases, it outperforms many of the available open source and closed chat models on common industry benchmarks. Served by Groq with their custom Language Processing Units (LPUs) hardware to provide fast and efficient inference.",
    inputCostPerMillion: 0.59,
    outputCostPerMillion: 0.79,
    contextWindow: 128_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 8192,
        min: 0,
        max: 16384
      },
      temperature: {
        default: 0.5,
        min: 0.01,
        max: 5
      },
      topP: {
        default: 1,
        min: 0.01,
        max: 1
      },
      frequencyPenalty: {
        default: 1,
        min: 0.01,
        max: 1
      }
    }
  },
  'llama-3.1-8b-instant': {
    displayName: "Llama 3.1 8B Instant",
    description: "Llama 3.1 8B with 128K context window support, making it ideal for real-time conversational interfaces and data analysis while offering significant cost savings compared to larger models. Served by Groq with their custom Language Processing Units (LPUs) hardware to provide fast and efficient inference.",
    inputCostPerMillion: 0.05,
    outputCostPerMillion: 0.08,
    contextWindow: 128_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 4000,
        min: 0,
        max: 8000
      },
      temperature: {
        default: 0.5,
        min: 0.01,
        max: 5
      },
      topP: {
        default: 1,
        min: 0.01,
        max: 1
      },
      frequencyPenalty: {
        default: 1,
        min: 0.01,
        max: 1
      }
    }
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
  
  'llama-4-scout-17b-16e': {
    displayName: "Llama 4 Scout",
    description: "Llama 4 Scout is Meta's natively multimodal model with a 17B parameter mixture-of-experts architecture (16 experts), offering exceptional performance across text and image understanding with support for 12 languages, optimized for assistant-like chat, image recognition, and coding tasks. Served by Groq with their custom Language Processing Units (LPUs) hardware to provide fast and efficient inference.",
    inputCostPerMillion: 0.11,
    outputCostPerMillion: 0.34,
    contextWindow: 131_072,
    defaultSettings: {
      maxOutputTokens: {
        default: 4096,
        min: 0,
        max: 8192
      },
      temperature: {
        default: 0.5,
        min: 0.01,
        max: 5
      },
      topP: {
        default: 1,
        min: 0.01,
        max: 1
      },
      frequencyPenalty: {
        default: 1,
        min: 0.01,
        max: 1
      }
    }
  },
  'llama-4-maverick-17b-128e': {
    displayName: "Llama 4 Maverick",
    description: "The Llama 4 collection of models are natively multimodal AI models that enable text and multimodal experiences. These models leverage a mixture-of-experts architecture to offer industry-leading performance in text and image understanding. Llama 4 Maverick, a 17 billion parameter model with 128 experts. Served by DeepInfra.",
    inputCostPerMillion: 0.20,
    outputCostPerMillion: 0.60,
    contextWindow: 131_072,
    defaultSettings: {
      maxOutputTokens: {
        default: 4096,
        min: 0,
        max: 8192
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 5
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },




  // Mistral Models (Model settings added ✅)
  'mistral-large-latest': {
    displayName: "Mistral Large",
    description: "Mistral Large is ideal for complex tasks that require large reasoning capabilities or are highly specialized - like Synthetic Text Generation, Code Generation, RAG, or Agents.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 32_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 0,
        max: 4000
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'pixtral-large-latest': {
    displayName: "Pixtral Large",
    description: "Pixtral Large is the second model in our multimodal family and demonstrates frontier-level image understanding. Particularly, the model is able to understand documents, charts and natural images, while maintaining the leading text-only understanding of Mistral Large 2.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 6.00,
    contextWindow: 32_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 0,
        max: 4000
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'mistral-small-latest': {
    displayName: "Mistral Small",
    description: "Mistral Small 3.1 is a state-of-the-art multimodal and multilingual model with excellent benchmark performance while delivering 150 tokens per second inference speeds and supporting up to 128k context window.",
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.30,
    contextWindow: 32_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 32768,
        min: 0,
        max: 64000
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  

  




  // Perplexity Models  (Model settings added ✅)
  'sonar-pro': {
    displayName: "Sonar Pro",
    description: "Perplexity's premier offering with search grounding, supporting advanced queries and follow-ups.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 200_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 0,
        max: 8000
      },
      temperature: {
        default: 0.2,
        min: 0,
        max: 2
      },
      topP: {
        default: 0.9,
        min: 0,
        max: 1
      },
      topK: {
        default: 0,
        min: 0,
        max: 2048
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },
  'sonar': {
    displayName: "Sonar",
    description: "Perplexity's lightweight offering with search grounding, quicker and cheaper than Sonar Pro.",
    inputCostPerMillion: 1.00,
    outputCostPerMillion: 1.00,
    contextWindow: 16_000, // Estimated based on similar models
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 0,
        max: 8000
      },
      temperature: {
        default: 0.2,
        min: 0,
        max: 2
      },
      topP: {
        default: 0.9,
        min: 0,
        max: 1
      },
      topK: {
        default: 0,
        min: 0,
        max: 2048
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },


  // DeepSeek Models  (Model settings added ✅)
  'deepseek-chat': {
    displayName: "DeepSeek Chat",
    description: "Versatile conversational model with strong general knowledge and natural dialogue capabilities for diverse applications.",
    inputCostPerMillion: 0.27,
    outputCostPerMillion: 1.10,
    contextWindow: 64_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 4096,
        min: 0,
        max: 8192
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'deepseek-reasoner': {
    displayName: "DeepSeek Reasoner",
    description: "Specialized model focused on complex reasoning tasks, problem-solving, and logical deduction with enhanced accuracy.",
    inputCostPerMillion: 0.55,
    outputCostPerMillion: 2.19,
    contextWindow: 64_000,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 0,
        max: 8192
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 2
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      topK: {
        default: 1,
        min: 1,
        max: 2048
      },
      frequencyPenalty: {
        default: 0.1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },


  
  // Google Models
  'gemini-2.5-pro-exp-03-25': {
    displayName: "Gemini 2.5 Pro Exp",
    description: "Gemini 2.5 Pro Experimental is our state-of-the-art thinking model, capable of reasoning over complex problems in code, math, and STEM, as well as analyzing large datasets, codebases, and documents using long context.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    contextWindow: 1_000_000,
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
  'gemini-2.5-flash-preview-04-17': {
    displayName: "Gemini 2.5 Flash Preview",
    description: "Gemini 2.5 Flash is our first fully hybrid reasoning model, giving developers the ability to turn thinking on or off. The model also allows developers to set thinking budgets to find the right tradeoff between quality, cost, and latency.",
    inputCostPerMillion: 0.10,
    outputCostPerMillion: 0.40,
    contextWindow: 1_048_576,
  },


  
  // xAI Grok Models(Model settings added ✅)
  'grok-2-latest': {
    displayName: "Grok 2",
    description: "Grok 2 is a frontier language model with state-of-the-art reasoning capabilities. It features advanced capabilities in chat, coding, and reasoning, outperforming both Claude 3.5 Sonnet and GPT-4-Turbo on the LMSYS leaderboard.",
    inputCostPerMillion: 2.00,
    outputCostPerMillion: 10.00,
    contextWindow: 131_072,
    defaultSettings: {
      maxOutputTokens: {
        default: 1024,
        min: 0,
        max: 4000
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'grok-3': {
    displayName: "Grok 3",
    description: "xAI's flagship model that excels at enterprise use cases like data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    contextWindow: 131_072,
    defaultSettings: {
      maxOutputTokens: {
        default: 8192,
        min: 0,
        max: 16384
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      }
    }
  },
  'grok-3-mini': {
    displayName: "Grok 3 Mini",
    description: "xAI's lightweight model that thinks before responding. Great for simple or logic-based tasks that do not require deep domain knowledge. The raw thinking traces are accessible.",
    inputCostPerMillion: 0.30,
    outputCostPerMillion: 0.50,
    contextWindow: 131_072,
    defaultSettings: {
      maxOutputTokens: {
        default: 8192,
        min: 0,
        max: 16384
      },
      temperature: {
        default: 0.7,
        min: 0,
        max: 1
      },
      topP: {
        default: 1,
        min: 0,
        max: 1
      },
      topK: {
        default: 0,
        min: 0,
        max: 2048
      },
      frequencyPenalty: {
        default: 1,
        min: 0,
        max: 1
      },
      presencePenalty: {
        default: 0,
        min: 0,
        max: 2
      }
    }
  },


};




// Helper function to get the AI SDK model instance by its ID string
export function getModelInstanceById(modelId: string): LanguageModel {
  const modelMap: Record<string, LanguageModel> = {
    // OpenAI
    'gpt-4o-mini': openai('gpt-4o-mini'),
    'gpt-4o': openai('gpt-4o'),
    'gpt-4.1': openai('gpt-4.1'),
    'gpt-4.1-mini': openai('gpt-4.1-mini'),
    'gpt-4.1-nano': openai('gpt-4.1-nano'),
    'o1-mini': openai('o1-mini'),
    'o1': openai('o1'),
    'o3-mini': openai('o3-mini'),
    'o3': openai('o3'),
    'o4-mini': openai('o4-mini'),
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
    'llama-4-scout-17b-16e': groq('llama-4-scout-17b-16e'),
    'llama-4-maverick-17b-128e': groq('llama-4-maverick-17b-128e'),
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
    'gemini-2.5-flash-preview-04-17': google('gemini-2.5-flash-preview-04-17'),
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
    contextWindow: details.contextWindow,
    defaultSettings: details.defaultSettings
  };
}
