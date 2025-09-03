import { tool } from 'ai';
import { z } from 'zod';

// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
const JINA_API_KEY = process.env.JINA_API_KEY;

// Define the schema for the readPage tool parameters
const readPageParams = z.object({
  url: z.string().url().describe('The URL of the webpage to read.'),
});

// Define the schema for the expected successful response data from the JINA Reader API
const jinaReaderResponseData = z.object({
    title: z.string().optional().describe('The title of the webpage.'),
    url: z.string().url().describe('The final URL after redirects.'),
    content: z.string().describe('The main content of the webpage in Markdown format.'),
    links: z.record(z.string().url()).optional().describe('A dictionary of unique links found on the page (key: text, value: url).'),
    images: z.record(z.string().url()).optional().describe('A dictionary of unique images found on the page (key: alt text/generated, value: url).'),
    // Add other fields from Jina response if needed, e.g., usage
});

// Define the schema for the overall JINA Reader API response structure
const jinaReaderResponseSchema = z.object({
    code: z.number(),
    status: z.number(), // Assuming status is also a number like code
    data: jinaReaderResponseData,
    // Include usage if the API provides it and you want to capture it
    usage: z.object({ tokens: z.number() }).optional(),
});


export const readPageTool = tool({
  description: 'Reads the content of a given webpage URL using the JINA Reader API, returning only the main content, title, and final URL.',
  inputSchema: readPageParams,
  execute: async ({ url }) => {
    if (!JINA_API_KEY) {
      throw new Error('Jina API key is not set in environment variables (JINA_API_KEY). Get your key at https://jina.ai/?sui=apikey');
    }

    try {
      const response = await fetch('https://r.jina.ai/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${JINA_API_KEY}`,
          'X-With-Images-Summary': 'true',
          
          // Optional: Add other Jina headers if needed, e.g., X-Timeout
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        // Try to parse error JSON if possible, otherwise use text
        let errorMessage = errorBody;
        try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          console.error('Error parsing JINA Reader API error response:', e);
            // Ignore parsing error, use raw text
        }
        throw new Error(`JINA Reader API request failed with status ${response.status}: ${errorMessage}`);
      }

      const jsonResponse = await response.json();

      // Validate the response against the Zod schema
      const validatedResponse = jinaReaderResponseSchema.safeParse(jsonResponse);

      if (!validatedResponse.success) {
          console.error("JINA Reader API response validation error:", validatedResponse.error.flatten());
          // Return a structured error object that the AI SDK might handle or log
          return {
              error: `JINA Reader API response validation failed: ${validatedResponse.error.message}`,
              rawResponse: jsonResponse // Include raw response for debugging
          };
      }

      // Return the validated data object (title, url, content)
      // Ensure the returned object matches what the AI expects or what you intend to use downstream.
      // We are returning the 'data' part as defined in our schema, excluding links and images.
      // The `links` and `images` properties are optional in `jinaReaderResponseData` to handle potential API responses,
      // but we explicitly exclude them from the tool's output.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { links: _links, images: _images, ...dataWithoutLinksAndImages } = validatedResponse.data.data;
      return dataWithoutLinksAndImages;

    } catch (error) {
      console.error('Error executing JINA Reader web page read:', error);
      // Return a structured error message
      return { error: `Failed to read web page content: ${error instanceof Error ? error.message : String(error)}` };
    }
  },
});