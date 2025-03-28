# Rate Limiting with Upstash Redis

This application uses Upstash Redis to implement rate limiting for API endpoints. This helps prevent abuse and ensures fair usage of the application resources.

## Configuration

Rate limiting is configured in `lib/ratelimit.ts` with the following limiters:

- **API Limiter**: 10 requests per 10 seconds for general API endpoints
- **Auth Limiter**: 20 requests per minute for authentication-related endpoints
- **Model Limiter**: 100 requests per hour for AI model/chat endpoints

## Implementation

Rate limiting is implemented in two ways:

1. **Global API Middleware**: All API routes are automatically rate limited via the middleware in `app/api/middleware.ts`.

2. **Per-Route Implementation**: Some critical routes have direct rate limiting for more control. Example: `app/api/agents/[id]/minimal/route.ts`.

## Environment Variables

To use rate limiting, you need to set up the following environment variables:

```
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token
```

## Setting Up Upstash

1. Create an account at [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and REST Token from the Upstash dashboard
4. Add these credentials to your `.env.local` file

## Rate Limit Response

When a rate limit is exceeded, the API returns a 429 status code with the following response:

```json
{
  "error": "Too many requests",
  "limit": 10,
  "remaining": 0,
  "reset": 9000
}
```

The response includes the following headers:
- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Remaining requests in the current window
- `X-RateLimit-Reset`: Time in milliseconds until the rate limit resets

## Custom Rate Limiting

You can customize the rate limits by modifying the configurations in `lib/ratelimit.ts`. 