import { sql } from 'drizzle-orm';

/**
 * Utility for case-insensitive text search
 */
export function ilike(column: any, term: string) {
  return sql`${column} ILIKE ${`%${term}%`}`;
}

/**
 * Creates a transaction wrapper that handles common transaction patterns
 * and provides proper error handling
 */
export async function withTransaction<T>(
  db: any,
  callback: (tx: any) => Promise<T>,
  errorMessage: string = 'Transaction failed'
): Promise<T> {
  try {
    return await db.transaction(async (tx: any) => {
      return await callback(tx);
    });
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw error;
  }
} 