import { webSearchTool } from './web-search';
import { readPageTool } from './read-page';

/**
 * A central registry for all available AI tools.
 * Keys are the names the AI model will use to refer to the tool.
 * Values are the tool definitions imported from their respective files.
 */


export const toolRegistry = {
  webSearch: webSearchTool,
  readPage: readPageTool,

};

// Optional: Export the type for the registry if needed elsewhere
export type ToolRegistry = typeof toolRegistry;