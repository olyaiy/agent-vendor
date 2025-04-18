import { tool } from 'ai';
import { z } from 'zod';
// Removed Exa import for now as it's just a stub and likely not installed

// --- Schema Definition ---

export const searchSchema = z.object({
  query: z.string().describe('The search query.'),
  max_results: z.number().optional().default(5).describe('Maximum number of results to return.'),
  search_depth: z.enum(['basic', 'advanced']).optional().default('basic').describe('Search depth: basic or advanced.'),
  include_domains: z.array(z.string()).optional().default([]).describe('Domains to prioritize.'),
  exclude_domains: z.array(z.string()).optional().default([]).describe('Domains to exclude.'),
});

// --- Type Definitions ---

export interface SearchResultItem {
  title: string;
  url: string;
  content: string; // Changed from snippet to content to match Jina's output better
  score?: number; // Optional score (e.g., from Exa, Brave)
  id?: string; // Optional ID (e.g., from Exa)
}

export interface SearchResultImage {
  url: string;
  alt?: string;
}

export interface SearchResults {
  results: SearchResultItem[];
  images: SearchResultImage[];
  query: string;
  number_of_results: number;
}

// Define the structure for items expected from the Jina API response
interface JinaSearchResultItem {
  title?: string; // Mark as optional as they might be missing
  url?: string;
  content?: string;
}

// Define the structure for items expected from the Brave API web results
interface BraveSearchResultItem {
  title?: string;
  url?: string;
  description?: string; // Brave uses 'description' for snippet
  score?: number;
}


// --- Tool Definition ---

export const webSearchTool = tool({
  description: 'Search the web using the configured search provider (Jina, Exa, Tavily, or Brave).',
  parameters: searchSchema,
  execute: async ({
    query,
    max_results = 5, // Default to 5 if not provided
    search_depth = 'basic',
    include_domains = [],
    exclude_domains = []
  }): Promise<SearchResults> => {

    // Determine search provider
    const searchAPI = (process.env.SEARCH_API?.toLowerCase() as 'jina' | 'exa' | 'tavily' | 'brave') || 'jina'; // Default to Jina, added 'brave'

    // Basic query validation/fixing (e.g., Tavily needs 5 chars)
    const filledQuery = query.length < 5 && searchAPI === 'tavily'
      ? query + ' '.repeat(5 - query.length)
      : query;

    console.log(`Performing search for "${filledQuery}" using ${searchAPI} (depth: ${search_depth}, max_results: ${max_results})`);

    try {
      let searchResult: SearchResults;

      switch (searchAPI) {
        case 'jina':
          searchResult = await jinaSearch(filledQuery, max_results, include_domains, exclude_domains);
          break;
        case 'exa':
          searchResult = await exaSearch(filledQuery, max_results, search_depth, include_domains, exclude_domains);
          break;
        case 'tavily':
          searchResult = await tavilySearch(filledQuery, max_results, search_depth, include_domains, exclude_domains);
          break;
        case 'brave': // Added case for Brave
          searchResult = await braveSearch(filledQuery, max_results, search_depth, include_domains, exclude_domains);
          break;
        default:
          throw new Error(`Unsupported search API: ${searchAPI}`);
      }
      console.log(`Search completed via ${searchAPI}, returning ${searchResult.results.length} results.`);
      return searchResult;

    } catch (error) {
      console.error(`Error executing search via ${searchAPI}:`, error);
      // Return empty results on error
      return {
        results: [],
        images: [],
        query: filledQuery,
        number_of_results: 0,
      };
    }
  },
});

// --- Jina Search Implementation ---

async function jinaSearch(
  query: string,
  max_results: number,
  include_domains: string[], // Note: Jina s.reader uses X-Site for *single* site search, not general include/exclude
  exclude_domains: string[]  // Jina doesn't directly support exclude_domains via s.reader
): Promise<SearchResults> {
  const apiKey = process.env.JINA_API_KEY;
  // Get your Jina AI API key for free: https://jina.ai/?sui=apikey
  if (!apiKey) {
    throw new Error('JINA_API_KEY environment variable is not set.');
  }

  // Jina's s.reader API specific headers/options
  const headers: HeadersInit = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  // Handle Jina's site-specific search if only one include_domain is provided
  if (include_domains.length === 1) {
    headers['X-Site'] = include_domains[0];
    console.log(`Jina search restricted to site: ${include_domains[0]}`);
  } else if (include_domains.length > 1) {
    console.warn("Jina search provider currently only supports restricting to a single site via 'X-Site'. Searching all sites.");
  }
  if (exclude_domains.length > 0) {
      console.warn("Jina search provider does not support excluding domains via s.reader API.");
  }


  const response = await fetch('https://s.jina.ai/', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ q: query }), // Jina s.reader doesn't have explicit max_results in body
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Jina API request failed with status ${response.status}: ${errorBody}`);
    throw new Error(`Jina API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.data)) {
    console.warn('Jina API returned unexpected data format:', data);
    return { results: [], images: [], query, number_of_results: 0 };
  }

  // Transform Jina results to the common SearchResults format
  // Jina returns results ordered by relevance, slice based on max_results
  const results: SearchResultItem[] = data.data.slice(0, max_results).map((item: JinaSearchResultItem) => ({ // Use defined type
    title: item.title ?? 'No title available',
    url: item.url ?? 'No URL available',
    content: item.content ?? 'No content available',
    // Jina s.reader doesn't provide score or id directly in this format
  }));

  return {
    results: results,
    images: [], // Jina s.reader doesn't easily provide images in this response structure
    query: query,
    number_of_results: results.length,
  };
}

// --- Exa Search Implementation (Stub) ---

async function exaSearch(
  query: string,
  max_results: number,
  search_depth: 'basic' | 'advanced',
  include_domains: string[],
  exclude_domains: string[]
): Promise<SearchResults> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error('EXA_API_KEY environment variable is not set.');
  }
  console.warn("Exa search implementation is currently a stub.");
  // Log parameters to satisfy linter for stub
  console.log(`Exa stub called with: query=${query}, max_results=${max_results}, depth=${search_depth}, include=${include_domains}, exclude=${exclude_domains}`);


  // Placeholder for Exa API call logic
  // const exa = new Exa(apiKey);
  // const exaResults = await exa.searchAndContents(query, {
  //   numResults: max_results,
  //   includeDomains: include_domains.length > 0 ? include_domains : undefined,
  //   excludeDomains: exclude_domains.length > 0 ? exclude_domains : undefined,
  //   useAutoprompt: search_depth === 'advanced', // Example mapping
  //   // type: 'neural' // or 'keyword' depending on depth/preference
  // });

  // Placeholder transformation
  // const results: SearchResultItem[] = exaResults.results.map((item: any) => ({
  //   title: item.title ?? 'No title',
  //   url: item.url ?? 'No URL',
  //   content: item.text ?? 'No content', // Assuming 'text' holds content
  //   score: item.score,
  //   id: item.id
  // }));

  return {
    results: [], // Replace with actual transformed results
    images: [],
    query: query,
    number_of_results: 0, // Replace with actual count
  };
}

// --- Tavily Search Implementation (Stub) ---

async function tavilySearch(
  query: string,
  max_results: number,
  search_depth: 'basic' | 'advanced',
  include_domains: string[],
  exclude_domains: string[]
): Promise<SearchResults> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY environment variable is not set.');
  }
  console.warn("Tavily search implementation is currently a stub.");
  // Log parameters to satisfy linter for stub
  console.log(`Tavily stub called with: query=${query}, max_results=${max_results}, depth=${search_depth}, include=${include_domains}, exclude=${exclude_domains}`);

  // Placeholder for Tavily API call logic
  // const tavilyClient = new TavilyClient(apiKey);
  // const tavilyResponse = await tavilyClient.search(query, {
  //   searchDepth: search_depth,
  //   maxResults: max_results,
  //   includeDomains: include_domains.length > 0 ? include_domains : undefined,
  //   excludeDomains: exclude_domains.length > 0 ? exclude_domains : undefined,
  //   includeImages: true, // Example: Request images if needed
  // });

  // Placeholder transformation
  // const results: SearchResultItem[] = tavilyResponse.results.map((item: any) => ({
  //   title: item.title ?? 'No title',
  //   url: item.url ?? 'No URL',
  //   content: item.content ?? 'No content',
  //   score: item.score,
  // }));
  // const images: SearchResultImage[] = (tavilyResponse.images || []).map((imgUrl: string) => ({ url: imgUrl }));


  return {
    results: [], // Replace with actual transformed results
    images: [], // Replace with actual transformed images
    query: query,
    number_of_results: 0, // Replace with actual count
  };
}

// --- Brave Search Implementation ---

async function braveSearch(
  query: string,
  max_results: number,
  search_depth: 'basic' | 'advanced', // Brave API doesn't directly use depth, but we can pass it
  include_domains: string[], // Brave API supports site filtering
  exclude_domains: string[] // Brave API supports site filtering
): Promise<SearchResults> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error('BRAVE_API_KEY environment variable is not set.');
  }

  console.warn("Brave search implementation is active.");
  // Log parameters to satisfy linter for stub
  console.log(`Brave stub called with: query=${query}, max_results=${max_results}, depth=${search_depth}, include=${include_domains}, exclude=${exclude_domains}`);


  const headers: HeadersInit = {
    'X-Subscription-Token': apiKey,
    'Accept': 'application/json',
  };

  // Brave API parameters
  const params = new URLSearchParams({
    q: query,
    count: max_results.toString(),
    // Brave API supports `site` parameter for filtering
    ...(include_domains.length > 0 && { site: include_domains.join(',') }),
    // Brave API does not directly support exclude_domains in the same way
    // We will ignore exclude_domains for Brave for now.
  });

  if (exclude_domains.length > 0) {
      console.warn("Brave search provider does not directly support excluding domains via API.");
  }

  // Brave API endpoint
  const url = `https://api.search.brave.com/res/v1/web/search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Brave API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Brave API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Brave API response structure: data.web.results
    if (!data || !data.web || !Array.isArray(data.web.results)) {
      console.warn('Brave API returned unexpected data format:', data);
      return { results: [], images: [], query, number_of_results: 0 };
    }

    // Transform Brave results to the common SearchResults format
    const results: SearchResultItem[] = data.web.results.map((item: BraveSearchResultItem) => ({ // Use defined type
      title: item.title ?? 'No title available',
      url: item.url ?? 'No URL available',
      content: item.description ?? 'No content available', // Brave uses 'description' for snippet
      score: item.score, // Brave provides a score
      // Brave doesn't provide a direct 'id' in this structure
    }));

    // Brave API might provide images separately, need to check docs/response
    // For now, assuming no images are returned in this format.
    const images: SearchResultImage[] = []; // Placeholder

    return {
      results: results,
      images: images,
      query: query,
      number_of_results: results.length,
    };

  } catch (error) {
    console.error('Error executing Brave web search tool:', error);
    return {
      results: [],
      images: [],
      query: query,
      number_of_results: 0,
    };
  }
}