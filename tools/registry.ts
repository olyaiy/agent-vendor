import { webSearchTool } from './web-search'; 

/**
 * A central registry for all available AI tools.
 * Keys are the names the AI model will use to refer to the tool.
 * Values are the tool definitions imported from their respective files.
 */


export const toolRegistry = {
  webSearch: webSearchTool, 

};

// Optional: Export the type for the registry if needed elsewhere
export type ToolRegistry = typeof toolRegistry;