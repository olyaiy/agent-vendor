import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiLimiter, authLimiter, modelLimiter, getIP } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip rate limiting for webhook endpoints
  if (path.startsWith('/api/webhook')) {
    return NextResponse.next();
  }
  
  // Choose the appropriate rate limiter based on the path
  let limiter;
  if (path.startsWith('/api/chat')) {
    limiter = modelLimiter;
  } else if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
    limiter = authLimiter;
  } else {
    limiter = apiLimiter;
  }
  
  // Get client identifier - use IP address
  const ip = getIP(request);
  
  // Check if rate limit is exceeded
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  
  // If rate limit is exceeded, return 429 Too Many Requests
  if (!success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        limit,
        remaining,
        reset: reset - Date.now(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }
  
  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes except webhooks
    '/api/:path*',
    '!/api/webhook/:path*',
  ],
}; 