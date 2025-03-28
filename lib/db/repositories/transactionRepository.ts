import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '../client';
import { userTransactions, userCredits, message, models } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { withTransaction } from '../utils/queryUtils';
import { updateUserCreditsCache } from '@/lib/credits';

/**
 * Get token usage for a specific user
 */
export async function getUserTokenUsage(userId: string) {
  try {
    // Fetch model data for all models
    const modelsData = await db
      .select({
        id: models.id,
        modelName: models.model_display_name,
        provider: models.provider,
        costPerMillionInputTokens: models.cost_per_million_input_tokens,
        costPerMillionOutputTokens: models.cost_per_million_output_tokens
      })
      .from(models);
    
    // Create a map of model ID to model info
    const modelInfoMap = new Map();
    modelsData.forEach(model => {
      modelInfoMap.set(model.id, {
        modelName: model.modelName,
        provider: model.provider,
        costPerMillionInputTokens: model.costPerMillionInputTokens ? Number(model.costPerMillionInputTokens) : null,
        costPerMillionOutputTokens: model.costPerMillionOutputTokens ? Number(model.costPerMillionOutputTokens) : null
      });
    });
    
    // Fetch usage transactions for the user
    const transactions = await db
      .select({
        modelId: userTransactions.modelId,
        tokenAmount: userTransactions.tokenAmount,
        tokenType: userTransactions.tokenType,
        amount: userTransactions.amount,
      })
      .from(userTransactions)
      .where(
        and(
          eq(userTransactions.userId, userId),
          eq(userTransactions.type, 'usage')
        )
      );
    
    // Prepare data structure for token usage by model
    const tokenUsageByModel = new Map();
    
    // Default "unknown model" for transactions without model info
    tokenUsageByModel.set('unknown', {
      modelName: 'Unknown Model',
      provider: '',
      inputTokens: 0,
      outputTokens: 0,
      costPerMillionInputTokens: null,
      costPerMillionOutputTokens: null,
      cost: 0
    });
    
    // Process each transaction and attribute to the right model
    transactions.forEach(transaction => {
      if (!transaction.modelId || !transaction.tokenAmount || !transaction.tokenType) {
        return; // Skip transactions with missing data
      }
      
      let modelKey = transaction.modelId || 'unknown';
      let modelName = 'Unknown Model';
      let provider = '';
      
      // If we can determine the model, use it
      if (modelInfoMap.has(modelKey)) {
        const modelInfo = modelInfoMap.get(modelKey);
        modelName = modelInfo.modelName;
        provider = modelInfo.provider;
      }
      
      // Initialize model data if not exists
      if (!tokenUsageByModel.has(modelKey)) {
        const modelInfo = modelInfoMap.get(modelKey) || {};
        tokenUsageByModel.set(modelKey, {
          modelName,
          provider,
          inputTokens: 0,
          outputTokens: 0,
          costPerMillionInputTokens: modelInfo.costPerMillionInputTokens || null,
          costPerMillionOutputTokens: modelInfo.costPerMillionOutputTokens || null,
          cost: 0
        });
      }
      
      // Add token usage to appropriate category
      const modelData = tokenUsageByModel.get(modelKey);
      
      if (transaction.tokenType === 'input') {
        modelData.inputTokens += transaction.tokenAmount;
      } else if (transaction.tokenType === 'output') {
        modelData.outputTokens += transaction.tokenAmount;
      }
      
      // Add the cost directly from the transaction amount
      if (transaction.amount) {
        modelData.cost += Number(transaction.amount);
      }
    });
    
    // Convert map to array and sort by total usage
    const result = Array.from(tokenUsageByModel.values())
      .filter(model => model.inputTokens > 0 || model.outputTokens > 0)
      .sort((a, b) => 
        (b.inputTokens + b.outputTokens) - (a.inputTokens + a.outputTokens)
      );
    
    return result;
  } catch (error) {
    return handleDbError(error, 'Failed to get user token usage from database', []);
  }
}

/**
 * Get transaction history for a user with pagination and filtering
 */
export async function getUserTransactions(
  userId: string, 
  page = 1, 
  pageSize = 10,
  type: "usage" | "purchase" | "refund" | "promotional" | "adjustment" | null = null,
  startDate: string | null = null,
  endDate: string | null = null
) {
  try {
    // Calculate offset based on page number and page size
    const offset = (page - 1) * pageSize;
    
    // Build the base condition with user ID
    let conditions = [eq(userTransactions.userId, userId)];
    
    // Add type filter if provided
    if (type) {
      conditions.push(eq(userTransactions.type, type));
    }
    
    // Add date range filters if provided
    if (startDate) {
      const startDateObj = new Date(startDate);
      conditions.push(gte(userTransactions.created_at, startDateObj));
    }
    
    if (endDate) {
      // Set the end date to the end of the day (23:59:59)
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      conditions.push(sql`${userTransactions.created_at} <= ${endDateObj}`);
    }
    
    // Combine all conditions with AND
    const whereConditions = and(...conditions);
    
    // First, get the total count of transactions for pagination with filters
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTransactions)
      .where(whereConditions);
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    // Get the transactions with message content if available, applying the same filters
    const transactions = await db
      .select({
        id: userTransactions.id,
        amount: userTransactions.amount,
        type: userTransactions.type,
        description: userTransactions.description,
        created_at: userTransactions.created_at,
        messageId: userTransactions.messageId,
        messageContent: message.parts,
      })
      .from(userTransactions)
      .leftJoin(message, eq(userTransactions.messageId, message.id))
      .where(whereConditions)
      .orderBy(desc(userTransactions.created_at))
      .limit(pageSize)
      .offset(offset);
    
    return {
      transactions,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    return handleDbError(error, 'Failed to get user transactions', {
      transactions: [],
      totalCount: 0,
      pageCount: 0
    });
  }
}

/**
 * Record a transaction and update user credit balance
 */
export async function recordTransaction({
  userId,
  amount,
  type,
  description,
  messageId,
  tokenAmount,
  tokenType,
  modelId,
  agentId,
  costPerMillionInput,
  costPerMillionOutput,
  usage
}: {
  userId: string;
  amount?: number;
  type: 'usage' | 'purchase' | 'refund' | 'promotional' | 'adjustment' | 'self_usage';
  description?: string;
  messageId?: string;
  tokenAmount?: number;
  tokenType?: 'input' | 'output';
  modelId?: string;
  agentId?: string;
  costPerMillionInput?: string;
  costPerMillionOutput?: string;
  usage?: { promptTokens?: number; completionTokens?: number };
}) {
  try {
    // Calculate amount if usage data and cost rates are provided
    let calculatedAmount = amount;
    let inputCost = 0;
    let outputCost = 0;
    
    if ((type === 'usage' || type === 'self_usage') && usage && (costPerMillionInput || costPerMillionOutput)) {
      // Apply markup factor based on type
      const MARKUP_FACTOR = type === 'self_usage' ? -1.08 : -1.18;

      // Calculate input and output costs
      inputCost = usage.promptTokens 
        ? (((usage.promptTokens || 0) * parseFloat(costPerMillionInput || '0')) / 1000000) * MARKUP_FACTOR
        : 0;
        
      outputCost = usage.completionTokens
        ? (((usage.completionTokens || 0) * parseFloat(costPerMillionOutput || '0')) / 1000000) * MARKUP_FACTOR
        : 0;

      // Total cost is the sum of input and output costs
      calculatedAmount = inputCost + outputCost;
    }
    
    if (calculatedAmount === undefined) {
      throw new Error('Transaction amount is required or must be calculable from provided parameters');
    }
    
    // Use a transaction to ensure both operations are atomic
    return await withTransaction(db, async (tx) => {
      const result = [];
      
      // For usage transactions with both input and output tokens, create two separate transactions
      if ((type === 'usage' || type === 'self_usage') && usage && usage.promptTokens && usage.completionTokens) {
        // Create transaction for input tokens
        const [inputTransaction] = await tx
          .insert(userTransactions)
          .values({
            userId,
            agentId,
            amount: inputCost.toString(), // Only the input cost
            type: type,
            description: description ? `${description} (Input)` : 'Token usage (Input)',
            messageId,
            tokenAmount: usage.promptTokens,
            tokenType: 'input',
            modelId
          })
          .returning();
          
        result.push(inputTransaction);
        
        // Create transaction for output tokens
        const [outputTransaction] = await tx
          .insert(userTransactions)
          .values({
            userId,
            agentId,
            amount: outputCost.toString(), // Only the output cost
            type: type,
            description: description ? `${description} (Output)` : 'Token usage (Output)',
            messageId,
            tokenAmount: usage.completionTokens,
            tokenType: 'output',
            modelId
          })
          .returning();
          
        result.push(outputTransaction);
      } else {
        // For other transaction types or when only one token type exists, create a single transaction
        const [newTransaction] = await tx
          .insert(userTransactions)
          .values({
            userId,
            agentId,
            amount: calculatedAmount.toString(), // Convert to string for numeric type
            type: type,
            description,
            messageId,
            tokenAmount: tokenAmount || ((type === 'usage' || type === 'self_usage') ? (usage?.promptTokens || 0) + (usage?.completionTokens || 0) : undefined),
            tokenType,
            modelId
          })
          .returning();

        result.push(newTransaction);
      }
      
      // Update the user's credit balance based on transaction type
      let newBalance = 0;
      
      if (type === 'usage' || type === 'self_usage') {
        const [updatedCredits] = await tx
          .update(userCredits)
          .set({
            credit_balance: sql`${userCredits.credit_balance} + ${calculatedAmount.toString()}`
          })
          .where(eq(userCredits.user_id, userId))
          .returning({
            newBalance: userCredits.credit_balance
          });
          
        if (updatedCredits) {
          newBalance = parseFloat(updatedCredits.newBalance.toString());
        }
      } else if (type === 'purchase' || type === 'promotional') {
        const [updatedCredits] = await tx
          .update(userCredits)
          .set({
            credit_balance: sql`${userCredits.credit_balance} + ${calculatedAmount.toString()}`,
            lifetime_credits: sql`${userCredits.lifetime_credits} + ${calculatedAmount.toString()}`
          })
          .where(eq(userCredits.user_id, userId))
          .returning({
            newBalance: userCredits.credit_balance
          });
          
        if (updatedCredits) {
          newBalance = parseFloat(updatedCredits.newBalance.toString());
        }
      } else if (type === 'refund' || type === 'adjustment') {
        const [updatedCredits] = await tx
          .update(userCredits)
          .set({
            credit_balance: sql`${userCredits.credit_balance} + ${calculatedAmount.toString()}`
          })
          .where(eq(userCredits.user_id, userId))
          .returning({
            newBalance: userCredits.credit_balance
          });
          
        if (updatedCredits) {
          newBalance = parseFloat(updatedCredits.newBalance.toString());
        }
      }
      
      // Update Redis cache with new balance
      await updateUserCreditsCache(userId, newBalance);
      
      return result[0]; // Return the first transaction for backward compatibility
    }, 'Failed to record transaction');
  } catch (error) {
    return handleDbError(error, 'Failed to record transaction');
  }
} 