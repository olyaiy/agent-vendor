import { getTemperatureTool } from './get-temperature';
import { webSearchTool } from './web-search'; // Import the new tool

/**
 * A central registry for all available AI tools.
 * Keys are the names the AI model will use to refer to the tool.
 * Values are the tool definitions imported from their respective files.
 */
export const toolRegistry = {
  getTemperature: getTemperatureTool,
  webSearch: webSearchTool, // Register the new tool
  // Add other tools here as they are created
  // e.g., anotherTool: anotherToolDefinition,
};

// Optional: Export the type for the registry if needed elsewhere
export type ToolRegistry = typeof toolRegistry;