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
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (excluding spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with a single hyphen
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
}

export function generateAgentSlug(name: string, id: string) {
  const safeSlug = slugify(name);
  // Ensure id is long enough and extract last 4 characters
  const idSuffix = id && id.length >= 4 ? id.slice(-4) : id; 
  return `${safeSlug}-${idSuffix}`; // Use hyphen and last 4 chars of ID
}

export function parseAgentSlug(slug: string) {
  // Updated to look for the last hyphen, assuming the suffix is always 4 chars + hyphen
  // A more robust approach might be needed if slugs can contain hyphens AND the suffix isn't fixed length
  const lastHyphenIndex = slug.lastIndexOf('-');
  // Check if the part after the last hyphen looks like our 4-char suffix
  if (lastHyphenIndex !== -1 && slug.length - lastHyphenIndex - 1 === 4) {
    // Basic check if suffix looks like hex, adjust if needed
    const potentialSuffix = slug.slice(lastHyphenIndex + 1);
    if (/^[a-f0-9]{4}$/i.test(potentialSuffix)) {
      return {
        slugifiedName: slug.slice(0, lastHyphenIndex),
        agentIdSuffix: potentialSuffix // Return suffix instead of full ID
      };
    }
  }
  // Fallback if pattern doesn't match: return original slug as name, no suffix
  return { slugifiedName: slug, agentIdSuffix: '' };
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