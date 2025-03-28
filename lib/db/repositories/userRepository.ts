import { genSaltSync, hashSync } from 'bcrypt-ts';
import { eq } from 'drizzle-orm';
import { db } from '../client';
import { user, type User, userCredits } from '../schema';
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

    // Use a transaction to create both user and credits
    return await db.transaction(async (tx) => {
      // Create the user first
      const [newUser] = await tx.insert(user)
        .values({ email, password: hash, user_name: userName })
        .returning({ id: user.id });
      
      // Then create the credits for the user with a default starting amount
      if (newUser?.id) {
        await tx.insert(userCredits)
          .values({ 
            user_id: newUser.id,
            credit_balance: '5', // Give new users 5 credits to start
            lifetime_credits: '5' 
          });
      }
      
      return newUser;
    });
  } catch (error) {
    return handleDbError(error, 'Failed to create user in database');
  }
} 