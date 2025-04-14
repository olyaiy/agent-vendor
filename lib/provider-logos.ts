interface ProviderLogo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// Map of provider names to their logo information
export const providerLogos: Record<string, ProviderLogo> = {
  'OpenAI': {
    src: '/providers/openai-logo.svg',
    alt: 'OpenAI Logo',
    width: 20,
    height: 20
  },
  'Anthropic': {
    src: '/providers/anthropic-logo.svg',
    alt: 'Anthropic Logo',
    width: 20,
    height: 20
  },
  'Google': {
    src: '/providers/google-logo.svg',
    alt: 'Google Logo',
    width: 20,
    height: 20
  },
  'Groq': {
    src: '/providers/groq-logo.png',
    alt: 'Groq Logo',
    width: 20,
    height: 20
  },
  'xAI': {
    src: '/providers/xai-logo.png',
    alt: 'xAI Logo',
    width: 20,
    height: 20
  },
  'DeepSeek': {
    src: '/providers/deepseek-logo.svg',
    alt: 'DeepSeek Logo',
    width: 20,
    height: 20
  },
  // Updated with actual logo paths
  'Mistral': {
    src: '/providers/mistral-logo.svg',
    alt: 'Mistral Logo',
    width: 20,
    height: 20
  },
  'Perplexity': {
    src: '/providers/perplexity-logo.svg',
    alt: 'Perplexity Logo',
    width: 20,
    height: 20
  },
  'Qwen': {
    src: '/providers/qwen-logo.svg', // Using a placeholder since no logo path provided
    alt: 'Qwen Logo',
    width: 20,
    height: 20
  },
  'Other': {
    src: '/providers/placeholder-logo.svg', // Using a placeholder for generic provider
    alt: 'Provider Logo',
    width: 20,
    height: 20
  }
};

/**
 * Get provider logo information
 * @param providerName - The name of the provider
 * @returns Logo information for the provider or a default if not found
 */
export function getProviderLogo(providerName: string): ProviderLogo {
  return providerLogos[providerName] || providerLogos.Other;
} 