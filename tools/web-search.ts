import { tool } from 'ai';
import { z } from 'zod';

// Define the schema for the Tavily search API parameters based on their documentation
// Removed search_depth (hardcoded to 'basic') and include_raw_content
const tavilySearchParams = z.object({
  query: z.string().describe('The search query to execute with Tavily.'),
  max_results: z.number().min(1).max(10).optional().default(5).describe('The maximum number of search results to return. Max 10.'),
  // Changed default for include_answer to true
  include_answer: z.boolean().optional().default(true).describe('Include an LLM-generated answer to the query in the response.'),
  include_domains: z.array(z.string()).optional().describe('A list of domains to specifically include in the search results.'),
  exclude_domains: z.array(z.string()).optional().describe('A list of domains to specifically exclude from the search results.'),
});

// Define the schema for the expected response structure from the Tavily API
const tavilySearchResponse = z.object({
    query: z.string(),
    answer: z.string().optional(),
    results: z.array(z.object({
        title: z.string(),
        url: z.string(),
        content: z.string(),
        score: z.number(),
    })),
    response_time: z.number(), 
     images: z.array(z.string()).optional(), 
});


export const webSearchTool = tool({
  description: "Searches the web using the Tavily API for a given 'query'. Returns a list of search results (including title, URL, and content snippet), an AI-generated 'answer' summarizing the findings, and relevant 'images'. This tool performs a 'basic' depth search. You can control 'max_results' (1-10, default 5), and specify 'include_domains' or 'exclude_domains' to refine the search. Ideal for finding current information, facts, or general knowledge from across the web.",
  parameters: tavilySearchParams,
  execute: async (params) => {
    // Removed search_depth and include_raw_content from destructuring
    const { query, max_results, include_answer, include_domains, exclude_domains } = params;

    // Ensure the Tavily API key is set in environment variables
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error('Tavily API key is not set in environment variables (TAVILY_API_KEY).');
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic', // Hardcoded search_depth to 'basic'
          max_results,
          include_answer, // Default is now true via schema
          include_images: true, // Hardcoded include_images to true
          // include_raw_content is removed
          include_domains,
          exclude_domains,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Tavily API request failed with status ${response.status}: ${errorBody}`);
      }

      const jsonResponse = await response.json();

      // Validate the response against the Zod schema
      const validatedResponse = tavilySearchResponse.safeParse(jsonResponse);

      if (!validatedResponse.success) {
          console.error("Tavily API response validation error:", validatedResponse.error);
          // Return a structured error object that the AI SDK might handle or log
          return { error: `Tavily API response validation failed: ${validatedResponse.error.message}`, rawResponse: jsonResponse };
      }

      // Return the validated data, including results, answer, and images
      return {
          results: validatedResponse.data.results,
          answer: validatedResponse.data.answer,
          images: validatedResponse.data.images, // Images are now an array of strings
      };

    } catch (error) {
      console.error('Error executing Tavily web search:', error);
      // Return a structured error message or re-throw, depending on desired handling
      return { error: `Failed to execute web search: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
});