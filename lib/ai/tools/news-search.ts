import { z } from 'zod'
import { tool } from 'ai'
import { SearchResults } from '@/lib/types'

const newsSearchSchema = z.object({
  query: z.string().min(1).describe("Search query for news articles"),
  country: z.enum(['ALL', 'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'KR', 'IN']).default('CA').optional().describe("2-letter country code"),
  search_lang: z.enum(['en', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'es']).default('en').optional().describe("Search language"),
  count: z.number().min(1).max(50).default(10).optional().describe("Number of results to return"),
  freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional().describe("Filter by freshness")
})

export const newsSearchTool = tool({
  description: 'Search news articles using Brave News API',
  parameters: newsSearchSchema,
  execute: async ({ query, country, search_lang, count, freshness }) => {
    const apiKey = process.env.BRAVE_API_KEY
    if (!apiKey) {
      throw new Error('BRAVE_API_KEY is not set in environment variables')
    }

    const baseUrl = 'https://api.search.brave.com/res/v1/news/search'
    const params = new URLSearchParams({
      q: query,
      ...(country && { country }),
      ...(search_lang && { search_lang }),
      ...(count && { count: count.toString() }),
      ...(freshness && { freshness }),
      spellcheck: '1',
      safesearch: 'moderate'
    })

    try {
      const response = await fetch(`${baseUrl}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Brave API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      const results = data.results.map((newsItem: any) => ({
        title: newsItem.title,
        url: newsItem.url,
        content: newsItem.description,
        metadata: {
          source: newsItem.meta_url?.hostname || '',
          date: newsItem.page_fetched,
          thumbnail: newsItem.thumbnail?.src || '',
          age: newsItem.age
        },
        type: 'news' // New type to distinguish from regular search results
      })) as SearchResults['results']



      return {
        results,
        query: data.query.original,
        number_of_results: results.length,
        images: []
      } as SearchResults

    } catch (error) {
      console.error('Brave News API error:', error)
      return {
        results: [],
        query,
        number_of_results: 0,
        images: []
      }
    }
  }
})

// Utility function for direct API access
export async function braveNewsSearch(
  query: string,
  country?: z.infer<typeof newsSearchSchema>['country'],
  searchLang?: z.infer<typeof newsSearchSchema>['search_lang'],
  count: number = 10,
  freshness?: z.infer<typeof newsSearchSchema>['freshness']
): Promise<SearchResults> {
  return newsSearchTool.execute(
    { query, country, search_lang: searchLang, count, freshness },
    { toolCallId: 'newsSearch', messages: [] }
  )
} 