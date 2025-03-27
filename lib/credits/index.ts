import { db } from '@/lib/db/queries';
import { userCredits } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Error message for insufficient credits
 */
export const INSUFFICIENT_CREDITS_MESSAGE = 'You have insufficient credits to continue. Please purchase more credits to continue chatting.';

/**
 * Check if user has any credits
 * @param userId User ID to check
 * @returns true if user has any credits, false otherwise
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const [credit] = await db.select({ 
    hasCredits: userCredits.credit_balance 
  })
    .from(userCredits)
    .where(eq(userCredits.user_id, userId))
    .limit(1);

  return credit?.hasCredits ? parseFloat(credit.hasCredits.toString()) > 0 : false;
} 