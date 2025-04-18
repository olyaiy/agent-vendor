import { tool } from 'ai';
import { z } from 'zod';

// Define the tool using the 'tool' helper
export const getTemperatureTool = tool({
  description: 'Get the current temperature (returns a fixed value for testing)',
  parameters: z.object({}), // No parameters needed for this simple tool
  execute: async () => {
    // In a real scenario, this would fetch data from an API
    // For this test, we return a hardcoded value
    return {
      temperature: 30,
      unit: 'celsius',
    };
  },
});