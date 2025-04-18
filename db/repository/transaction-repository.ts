import { db } from '../index';
import { transaction, userCredits, type Transaction, type UserCredits } from '../schema/transactions';
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";


/**
 * Records a new transaction and updates user credits
 * @param transactionData - Transaction data without generated fields (id, createdAt)
 * @returns Newly created transaction record
 */
export async function recordTransaction({
  userId,
  messageId,
  type,
  description,
  amount
}: {
  userId: string;
  messageId?: string;
  type: 'usage' | 'top_up';
  description?: string;
  amount: string;
}): Promise<Transaction> {
  const [newTransaction] = await db.insert(transaction).values({
    userId,
    messageId,
    type,
    description,
    amount
  }).returning();

  return newTransaction;
}

/**
 * Updates user's credit balance atomically
 * @param userId - User ID to update credits for
 * @param amount - Absolute value of credit change
 * @param transactionType - Type of transaction determining balance direction
 */
export async function updateUserCredits(
  userId: string,
  amount: string,
  transactionType: 'usage' | 'top_up'
): Promise<UserCredits> {
  return db.transaction(async (tx) => {
    const [credits] = await tx
      .insert(userCredits)
      .values({
        userId,
        creditBalance: transactionType === 'top_up' ? amount : `-${amount}`,
        lifetimeCredits: transactionType === 'top_up' ? amount : '0'
      })
      .onConflictDoUpdate({
        target: userCredits.userId,
        set: {
          creditBalance: transactionType === 'top_up' 
            ? sql`${userCredits.creditBalance} + ${amount}::numeric`
            : sql`${userCredits.creditBalance} - ${amount}::numeric`,
          lifetimeCredits: transactionType === 'top_up'
            ? sql`${userCredits.lifetimeCredits} + ${amount}::numeric`
            : userCredits.lifetimeCredits
        }
      })
      .returning();

    return credits;
  });
}

/**
 * Retrieves user's current credit balance
 * @param userId - User ID to fetch credits for
 * @returns UserCredits object or undefined if not found
 */
export async function getUserCredits(userId: string): Promise<UserCredits | undefined> {
  const result = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .execute();

  return result[0];
} 