import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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



export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
