import { tool } from 'ai';
import { z } from 'zod';

// Define the schema for the tool's parameters
const webSearchParameters = z.object({
  q: z.string().describe('The search query to use.'),
});

// Define the structure of a single search result we want to return
interface SearchResult {
  title: string;
  url: string;
  content: string;
}

// Define the structure for items expected from the Jina API response
interface JinaSearchResultItem {
  title?: string; // Mark as optional as they might be missing
  url?: string;
  content?: string;
}

// Define the tool using the 'tool' helper
export const webSearchTool = tool({
  description: "Search the web using Jina AI's Search API (s.reader) and return the content of the top 3 results.",
  parameters: webSearchParameters,
  execute: async ({ q }): Promise<SearchResult[]> => {
    const apiKey = process.env.JINA_API_KEY;

    // Get your Jina AI API key for free: https://jina.ai/?sui=apikey
    if (!apiKey) {
      throw new Error('JINA_API_KEY environment variable is not set.');
    }

    console.log(`Performing Jina web search for: ${q}`);

    try {
      const response = await fetch('https://s.jina.ai/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: q,
          // Requesting markdown format, which is often LLM-friendly
          // 'X-Return-Format': 'markdown' // Optional: Specify return format if needed
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Jina API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`Jina API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Check if data and data.data exist and are arrays
      if (!data || !Array.isArray(data.data)) {
        console.warn('Jina API returned unexpected data format:', data);
        return []; // Return empty array if format is wrong
      }

      // Extract and format the top 3 results
      const results: SearchResult[] = data.data.slice(0, 3).map((item: JinaSearchResultItem) => ({
        title: item.title ?? 'No title available', // Use nullish coalescing
        url: item.url ?? 'No URL available',
        content: item.content ?? 'No content available',
      }));

      console.log(`Jina search returned ${results.length} results.`);
      return results;

    } catch (error) {
      console.error('Error executing Jina web search tool:', error);
      // Re-throw the error or return a specific error message/object
      // For now, returning an empty array to indicate failure to the LLM
      // Consider more robust error handling based on application needs
      return [];
      // throw new Error(`Failed to execute Jina web search: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});