import { CoreToolMessage, UIMessage } from "ai";
import { CoreAssistantMessage } from "ai";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v7 as uuidv7 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateAgentSlug(name: string, id: string) {
  const safeSlug = slugify(name);
  return `${safeSlug}_${id}`;
}

export function parseAgentSlug(slug: string) {
  const lastSeparatorIndex = slug.lastIndexOf('_');
  if (lastSeparatorIndex === -1) return { slugifiedName: '', agentId: slug };
  
  return {
    slugifiedName: slug.slice(0, lastSeparatorIndex),
    agentId: slug.slice(lastSeparatorIndex + 1)
  };
}

/**
 * Generates a vibrant retro-inspired color from a string
 * Useful for creating visually distinct colors based on names or IDs
 */
export function generateRetroColorFromString(str: string): string {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Define a set of retro-inspired, vibrant base hues
  const retroHues = [
    350,  // vibrant pink/red
    320,  // magenta
    275,  // purple
    230,  // vibrant blue
    195,  // cyan
    160,  // mint/teal
    130,  // lime green
    95,   // vibrant green
    55,   // neon yellow
    35,   // orange
    10    // coral/red-orange
  ];
  
  // Pick a base hue from our retro palette based on the hash
  const baseHue = retroHues[Math.abs(hash) % retroHues.length];
  
  // Add a small variation to the selected base hue (+/- 10 degrees)
  const hueVariation = ((hash >> 8) % 20) - 10;
  const finalHue = (baseHue + hueVariation + 360) % 360;
  
  // Retro colors have high saturation but not too high lightness
  // so they pop but aren't too bright
  return `hsl(${finalHue}, 80%, 60%)`;
}

/**
 * Generates a more efficient UUID using v7
 * UUID v7 is time-ordered for better database performance
 */
export function generateUUID(): string {
  // Generate a timestamp-based UUID v7 for better performance and indexing
  return uuidv7();
}


type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}



export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}