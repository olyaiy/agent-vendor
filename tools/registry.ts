import { webSearchTool } from './web-search';
import { readPageTool } from './read-page';
import { e2bSandboxTool } from './e2b-sandbox-tool';
import { calculatorTool } from './calculator-tool';
import { createLogoTool } from './create-logo-tool'; // Import the new tool

/**
 * A central registry for all available AI tools.
 * Keys are the names the AI model will use to refer to the tool.
 * Values are the tool definitions imported from their respective files.
 */


export const toolRegistry = {
  web_search: webSearchTool,
  read_page: readPageTool,
  e2b_sandbox: e2bSandboxTool,
  calculator: calculatorTool,
  create_logo: createLogoTool, // Register the new tool
};

// Optional: Export the type for the registry if needed elsewhere
export type ToolRegistry = typeof toolRegistry;