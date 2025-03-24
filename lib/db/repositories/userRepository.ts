import { genSaltSync, hashSync } from 'bcrypt-ts';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { user, type User } from '../schema';
import { handleDbError } from '../utils/errorHandler';

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

    return await db.insert(user).values({ email, password: hash, user_name: userName });
  } catch (error) {
    return handleDbError(error, 'Failed to create user in database');
  }
} 