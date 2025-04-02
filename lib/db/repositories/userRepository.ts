import { genSaltSync, hashSync } from 'bcrypt-ts';
import { eq, sql, count, desc } from 'drizzle-orm';
import { db } from '../client';
import { user, type User, userCredits, type UserCredits, chat, message } from '../schema';
import { handleDbError } from '../utils/errorHandler';
import { updateUserCreditsCache } from '@/lib/credits';

/**
 * Represents a user combined with their credit information.
 */
export interface UserWithCredits extends User {
  credit_balance: string | null;
  lifetime_credits: string | null;
  messageCount: number;
}

/**
 * Get a user by email address
 */
export async function getUser(email: string): Promise<Array<User>> {
  try {
    // Will use the index on user.email
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    return handleDbError(error, 'Failed to get user from database', []);
  }
}

/**
 * Create a new user with email and password
 */
export async function createUser(email: string, password: string, userName?: string) {
  try {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);

    // Use a transaction to create both user and credits
    return await db.transaction(async (tx) => {
      // Create the user first
      const [newUser] = await tx.insert(user)
        .values({ email, password: hash, user_name: userName })
        .returning({ id: user.id });
      
      // Then create the credits for the user with a default starting amount
      const initialCredits = 1; // Starting credits (same as in the DB)
      
      if (newUser?.id) {
        await tx.insert(userCredits)
          .values({ 
            user_id: newUser.id,
            credit_balance: initialCredits.toString(),
            lifetime_credits: initialCredits.toString()
          });
          
        // Initialize Redis cache for the new user
        await updateUserCreditsCache(newUser.id, initialCredits);
      }
      
      return newUser;
    });
  } catch (error) {
    return handleDbError(error, 'Failed to create user in database');
  }
}

/**
 * Get a single user by ID with their credit details.
 */
export async function getUserByIdWithCredits(userId: string): Promise<UserWithCredits | null> {
  try {
    const result = await db
      .select({
        id: user.id,
        email: user.email,
        password: user.password,
        user_name: user.user_name,
        createdAt: user.createdAt, // Select createdAt
        credit_balance: userCredits.credit_balance,
        lifetime_credits: userCredits.lifetime_credits,
      })
      .from(user)
      .leftJoin(userCredits, eq(user.id, userCredits.user_id))
      .where(eq(user.id, userId));

    if (result.length === 0) {
      return null;
    }

    // Ensure the return type matches UserWithCredits
    return result[0] as UserWithCredits;
  } catch (error) {
    return handleDbError(error, 'Failed to get user by ID with credits', null);
  }
}

/**
 * Get all users with their credit balances, lifetime credits, and message count, sorted by message count descending.
 */
export async function getAllUsersWithCredits(): Promise<Array<UserWithCredits>> {
  try {
    const messageCountSql = sql<number>`count(distinct ${message.id})`.mapWith(Number).as('message_count');

    const result = await db
      .select({
        id: user.id,
        email: user.email,
        password: user.password,
        user_name: user.user_name,
        createdAt: user.createdAt,
        credit_balance: userCredits.credit_balance,
        lifetime_credits: userCredits.lifetime_credits,
        messageCount: messageCountSql,
      })
      .from(user)
      .leftJoin(userCredits, eq(user.id, userCredits.user_id))
      .leftJoin(chat, eq(user.id, chat.userId))
      .leftJoin(message, eq(chat.id, message.chatId))
      .groupBy(user.id, userCredits.user_id)
      .orderBy(desc(messageCountSql)); // Order by message count descending

    // Ensure the return type matches UserWithCredits[]
    // Cast is needed because groupBy changes the return shape slightly
    return result as Array<UserWithCredits>;
  } catch (error) {
    return handleDbError(error, 'Failed to get all users with credits and message count', []);
  }
} 