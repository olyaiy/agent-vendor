'use server'

import { recordTransaction, updateUserCredits } from "@/db/repository/transaction-repository";
import { z } from "zod";

// Validation schema for charge operation
const ChargeUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.string().regex(/^\d+(\.\d{1,8})?$/, "Invalid amount format"),
  messageId: z.string().uuid().optional(),
  description: z.string().optional()
});

export async function chargeUser({
  userId,
  amount,
  messageId,
  description
}: {
  userId: string;
  amount: string;
  messageId?: string;
  description?: string;
}) {
  console.log(`[Transaction] Charge initiated for user ${userId}, amount: ${amount}`);

  const validation = ChargeUserSchema.safeParse({ userId, amount, messageId, description });
  if (!validation.success) {
    console.error('[Transaction] Validation failed:', {
      userId,
      error: validation.error.format(),
      inputAmount: amount
    });
    return { 
      success: false, 
      error: "Invalid input data", 
      details: validation.error.format() 
    };
  }

  try {
    const transaction = await recordTransaction({
      userId,
      type: 'usage',
      amount: validation.data.amount,
      messageId: validation.data.messageId,
      description: validation.data.description
    });

    console.log(`[Transaction] Recorded transaction ${transaction.id} for user ${userId}`);

    const updatedCredits = await updateUserCredits(
      userId,
      validation.data.amount,
      'usage'
    );

    console.log(`[Transaction] Successfully charged user ${userId}. 
      Amount: ${validation.data.amount}, 
      New Balance: ${updatedCredits.creditBalance},
      Transaction ID: ${transaction.id}`);

    return { 
      success: true, 
      data: {
        transaction,
        newBalance: updatedCredits.creditBalance
      }
    };
  } catch (error) {
    console.error(`[Transaction] Charge failed for user ${userId}`, {
      amount,
      messageId,
      error: error instanceof Error ? error.stack : 'Unknown error'
    });
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

import { auth } from '@/lib/auth'; // Import auth for admin check
import { headers } from 'next/headers'; // Import headers for session check
import { getUserCredits as getUserCreditsRepo } from "@/db/repository/transaction-repository"; // Import repo function
import { UserCredits } from "../schema/transactions"; // Import return type

/**
 * Fetches the credit balance for a specific user by ID.
 * Requires admin privileges.
 * @param userId - The ID of the user whose credits to fetch.
 * @returns Promise with the user credits data or an error object.
 */
export async function getUserCreditsAction(userId: string): Promise<{ success: true, data: UserCredits | null } | { success: false, error: string }> {
  // --- Authorization Check ---
  let session;
  try {
      session = await auth.api.getSession({ headers: await headers() });
  } catch (sessionError) {
      console.error("Error fetching session in getUserCreditsAction:", sessionError);
      return { success: false, error: "Failed to verify session." };
  }

  if (!session?.user) {
      console.error("No user found in session within getUserCreditsAction.");
      return { success: false, error: "Authentication required." };
  }

  const isAdmin = session.user.role?.includes('admin');
  if (!isAdmin) {
     console.warn(`Unauthorized attempt to get credits for user ID: ${userId} by user ID: ${session.user.id}`);
     return { success: false, error: 'Unauthorized: Admin access required.' };
  }
  // --- End Authorization Check ---

  try {
    const credits = await getUserCreditsRepo(userId);

    // If credits is undefined (user has no entry yet), return null data
    return { success: true, data: credits || null };

  } catch (error) {
    console.error(`Error fetching credits for user ${userId}:`, error);
    return { success: false, error: `Failed to fetch user credits. ${(error as Error).message}` };
  }
}
