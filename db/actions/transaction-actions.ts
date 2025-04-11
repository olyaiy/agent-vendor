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
