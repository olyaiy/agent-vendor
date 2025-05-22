import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Get your Jina AI API key for free: https://jina.ai/?sui=apikey
const JINA_API_KEY = process.env.JINA_API_KEY;

// Define the schema for the expected successful response data from the JINA Reader API
const jinaReaderResponseData = z.object({
    title: z.string().optional().describe('The title of the webpage.'),
    url: z.string().url().describe('The final URL after redirects.'),
    content: z.string().describe('The main content of the webpage in Markdown format.'),
    links: z.record(z.string().url()).optional().describe('A dictionary of unique links found on the page (key: text, value: url).'),
    images: z.record(z.string().url()).optional().describe('A dictionary of unique images found on the page (key: alt text/generated, value: url).'),
});

// Define the schema for the overall JINA Reader API response structure
const jinaReaderResponseSchema = z.object({
    code: z.number(),
    status: z.number(),
    data: jinaReaderResponseData,
    usage: z.object({ tokens: z.number() }).optional(),
});

async function readPageContent(url: string) {
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
        'X-Return-Format': 'markdown',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = errorBody;
      try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
      } catch (e) {
        console.error('Error parsing JINA Reader API error response:', e);
      }
      throw new Error(`JINA Reader API request failed with status ${response.status}: ${errorMessage}`);
    }

    const jsonResponse = await response.json();

    // Validate the response against the Zod schema
    const validatedResponse = jinaReaderResponseSchema.safeParse(jsonResponse);

    if (!validatedResponse.success) {
        console.error("JINA Reader API response validation error:", validatedResponse.error.flatten());
        return {
            error: `JINA Reader API response validation failed: ${validatedResponse.error.message}`,
            rawResponse: jsonResponse
        };
    }

    // Return the validated data object (title, url, content)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { links: _links, images: _images, ...dataWithoutLinksAndImages } = validatedResponse.data.data;
    return dataWithoutLinksAndImages;

  } catch (error) {
    console.error('Error executing JINA Reader web page read:', error);
    return { error: `Failed to read web page content: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Execute the read page functionality
    const result = await readPageContent(url);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: `API Error: ${error instanceof Error ? error.message : String(error)}`,
        url: '',
        content: ''
      },
      { status: 500 }
    );
  }
} 