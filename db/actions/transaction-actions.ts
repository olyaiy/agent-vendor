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
  // Validate input
  const validation = ChargeUserSchema.safeParse({ userId, amount, messageId, description });
  if (!validation.success) {
    return { 
      success: false, 
      error: "Invalid input data", 
      details: validation.error.format() 
    };
  }

  try {
    // Record transaction and update credits atomically
    const transaction = await recordTransaction({
      userId,
      type: 'usage',
      amount: validation.data.amount,
      messageId: validation.data.messageId,
      description: validation.data.description
    });

    const updatedCredits = await updateUserCredits(
      userId,
      validation.data.amount,
      'usage'
    );

    return { 
      success: true, 
      data: {
        transaction,
        newBalance: updatedCredits.creditBalance
      }
    };
  } catch (error) {
    console.error("Failed to charge user:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}
