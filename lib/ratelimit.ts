import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Create Redis instance
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create different rate limiters for different use cases

// 10 requests per 10 seconds - for API endpoints
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// 20 requests per minute - for authentication attempts
export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// 5 registration attempts per hour per IP - much stricter for sign-ups
export const registrationLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: 'ratelimit:registration',
});

// 100 requests per hour - for model usage/chat endpoints
export const modelLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
  prefix: 'ratelimit:model',
});

// Helper function to get IP address from request
export function getIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  return xff ? xff.split(',')[0] : '127.0.0.1';
} 