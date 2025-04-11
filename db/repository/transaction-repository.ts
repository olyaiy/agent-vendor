import { db } from '../index';
import { transaction, userCredits, type Transaction, type UserCredits } from '../schema/transactions';


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
            ? `${userCredits.creditBalance} + ${amount}`
            : `${userCredits.creditBalance} - ${amount}`,
          lifetimeCredits: transactionType === 'top_up'
            ? `${userCredits.lifetimeCredits} + ${amount}`
            : userCredits.lifetimeCredits
        }
      })
      .returning();

    return credits;
  });
} 