import { webSearchTool } from './web-search';
import { readPageTool } from './read-page';
import { e2bSandboxTool } from './e2b-sandbox-tool';
import { calculatorTool } from './calculator-tool';
import { createLogoTool } from './create-logo-tool'; // Import the new tool
import { createChartTool } from './create_chart_tool';
import { colorPaletteTool } from './color-palette-tool';
import { pexelsSearchTool } from './pexels-search-tool'; // Import the Pexels tool

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
  create_chart: createChartTool,
  create_logo: createLogoTool, // Register the new tool
  color_palette: colorPaletteTool,
  pexels_image_search: pexelsSearchTool, // Register the Pexels tool
};

// Optional: Export the type for the registry if needed elsewhere
export type ToolRegistry = typeof toolRegistry;