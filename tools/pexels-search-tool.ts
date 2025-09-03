import { tool } from 'ai';
import { z } from 'zod';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page?: string;
}

interface SimplifiedPhoto {
  id: number;
  src_medium: string;
  src_large: string;
  alt: string;
  photographer_name: string;
  photographer_url: string;
  photo_url: string;
  width: number;
  height: number;
  avg_color: string;
}

export const pexelsSearchTool = tool({
  description: 'Searches for high-quality photos on Pexels.com based on a query and optional filters. Use this when users need images for their projects, presentations, or creative work.',
  inputSchema: z.object({
    query: z.string().describe('The search term for photos (e.g., "nature", "office", "cats"). This is required.'),
    count: z.number().min(1).max(10).default(6).describe('Number of photos to return. Defaults to 6 if not specified. Maximum is 10.'),
    orientation: z.enum(['landscape', 'portrait', 'square']).optional().describe('Filter by photo orientation: landscape, portrait, or square.'),
    size: z.enum(['large', 'medium', 'small']).optional().describe('Filter by photo size. "large" (24MP), "medium" (12MP), "small" (4MP).'),
    color: z.string().optional().describe('Filter by a specific color. Provide a color name (e.g., "red", "blue") or a hex code (e.g., "#FF0000", "008000").'),
  }),
  execute: async ({ query, count = 6, orientation, size, color }) => {
    try {
      // Debug environment variables
      console.log('🔍 Environment Debug:');
      console.log('- NODE_ENV:', process.env.NODE_ENV);
      console.log('- All PEXELS env vars:', Object.keys(process.env).filter(key => key.includes('PEXELS')));
      
      const apiKey = process.env.PEXELS_API_KEY;
      
      // Debug logging
      console.log('🔍 Pexels Debug Info:');
      console.log('- API Key exists:', !!apiKey);
      console.log('- API Key length:', apiKey?.length || 0);
      console.log('- API Key first 10 chars:', apiKey?.substring(0, 10) || 'N/A');
      console.log('- API Key last 10 chars:', apiKey?.substring(apiKey.length - 10) || 'N/A');
      console.log('- API Key has whitespace:', apiKey ? /\s/.test(apiKey) : 'N/A');
      console.log('- Query:', query);
      console.log('- Count:', count);
      console.log('- Orientation:', orientation);
      console.log('- Size:', size);
      console.log('- Color:', color);
      
      if (!apiKey) {
        console.log('❌ No API key found in environment variables');
        return {
          error: true,
          message: 'Pexels API key is not configured. Please check your environment variables.',
          photos: []
        };
      }

      // Clean the API key (remove any potential whitespace)
      const cleanApiKey = apiKey.trim();
      console.log('🧹 Cleaned API key length:', cleanApiKey.length);
      console.log('🧹 Original vs cleaned length match:', apiKey.length === cleanApiKey.length);

      // Construct the URL with query parameters
      const url = new URL('https://api.pexels.com/v1/search');
      url.searchParams.append('query', query);
      url.searchParams.append('per_page', count.toString());
      url.searchParams.append('page', '1');
      
      if (orientation) {
        url.searchParams.append('orientation', orientation);
      }
      
      if (size) {
        url.searchParams.append('size', size);
      }
      
      if (color) {
        url.searchParams.append('color', color);
      }

      console.log('🌐 Request URL:', url.toString());

      const headers = {
        'Authorization': `Bearer ${cleanApiKey}`,
        'User-Agent': 'AI Agent Tool'
      };

      console.log('📋 Request Headers:');
      console.log('- Authorization header length:', headers.Authorization.length);
      console.log('- Authorization starts with "Bearer":', headers.Authorization.startsWith('Bearer '));
      console.log('- User-Agent:', headers['User-Agent']);

      const response = await fetch(url.toString(), {
        headers
      });

      console.log('📡 Response Status:', response.status);
      console.log('📡 Response Status Text:', response.statusText);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error Response Body:', errorText);
        
        return {
          error: true,
          message: `Pexels API error: ${response.status} ${response.statusText}`,
          photos: []
        };
      }

      const data: PexelsSearchResponse = await response.json();

      console.log('✅ Success! Total results:', data.total_results);
      console.log('✅ Photos returned:', data.photos.length);

      if (!data.photos || data.photos.length === 0) {
        return {
          error: false,
          message: `No photos found for "${query}". Try a different search term.`,
          photos: [],
          total_results: 0
        };
      }

      // Transform the Pexels API response into a simpler format for the UI
      const simplifiedPhotos: SimplifiedPhoto[] = data.photos.map((photo: PexelsPhoto) => ({
        id: photo.id,
        src_medium: photo.src.medium,
        src_large: photo.src.large,
        alt: photo.alt || `Photo by ${photo.photographer}`,
        photographer_name: photo.photographer,
        photographer_url: photo.photographer_url,
        photo_url: photo.url,
        width: photo.width,
        height: photo.height,
        avg_color: photo.avg_color
      }));

      return {
        error: false,
        message: `Found ${data.total_results} photos for "${query}"`,
        photos: simplifiedPhotos,
        total_results: data.total_results,
        query: query
      };

    } catch (error) {
      console.error('💥 Pexels API error:', error);
      return {
        error: true,
        message: 'Failed to search for photos. Please try again later.',
        photos: []
      };
    }
  }
}); 