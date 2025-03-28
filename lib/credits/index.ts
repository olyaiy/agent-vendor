import { db } from '@/lib/db/queries';
import { userCredits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redis } from '@/lib/ratelimit';

/**
 * Error message for insufficient credits
 */
export const INSUFFICIENT_CREDITS_MESSAGE = 'You have insufficient credits to continue. Please purchase more credits to continue chatting.';

/**
 * Redis key prefix for user credits
 */
const USER_CREDITS_KEY_PREFIX = 'user:credits:';

/**
 * Get Redis key for user credits
 */
function getUserCreditsKey(userId: string): string {
  return `${USER_CREDITS_KEY_PREFIX}${userId}`;
}

/**
 * Get user credits from Redis or database
 * @param userId User ID to check
 * @returns User's credit balance as a number, or null if user has no credits
 */
async function getUserCredits(userId: string): Promise<number | null> {
  // Try to get credits from Redis first
  const cachedCredits = await redis.get<string>(getUserCreditsKey(userId));
  
  // If found in cache, parse and return
  if (cachedCredits !== null) {
    // If already a number, return directly
    if (typeof cachedCredits === 'number') {
      return cachedCredits;
    }
    
    // If it's an object that Redis client might have already parsed
    if (typeof cachedCredits === 'object') {
      return Number(cachedCredits);
    }
    
    // Otherwise parse as string
    try {
      return parseFloat(cachedCredits);
    } catch (e) {
      console.error('Failed to parse cached credits:', e);
      // Continue to fetch from database if parsing fails
    }
  }
  
  // Otherwise, get from database
  const [credit] = await db.select({ 
    hasCredits: userCredits.credit_balance 
  })
    .from(userCredits)
    .where(eq(userCredits.user_id, userId))
    .limit(1);

  // If found in database, cache and return
  if (credit?.hasCredits) {
    const creditsValue = parseFloat(credit.hasCredits.toString());
    // Cache for 10 minutes (600 seconds)
    await redis.set(getUserCreditsKey(userId), creditsValue.toString(), { ex: 600 });
    return creditsValue;
  }
  
  return null;
}

/**
 * Update user credits in both database and Redis
 * @param userId User ID
 * @param newBalance New credit balance
 */
export async function updateUserCreditsCache(userId: string, newBalance: number): Promise<void> {
  // Update Redis cache immediately for fast reads
  await redis.set(getUserCreditsKey(userId), newBalance.toString(), { ex: 600 });
}

/**
 * Invalidate user credits cache
 * @param userId User ID
 */
export async function invalidateUserCreditsCache(userId: string): Promise<void> {
  await redis.del(getUserCreditsKey(userId));
}

/**
 * Check if user has any credits
 * @param userId User ID to check
 * @returns true if user has any credits, false otherwise
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits !== null && credits > 0;
} 