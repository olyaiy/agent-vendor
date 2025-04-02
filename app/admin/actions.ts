'use server';

import { getAllUsersWithCredits } from '@/lib/db/repositories/userRepository';
import { revalidatePath } from 'next/cache';

/**
 * Server action to fetch all users with their credit details.
 */
export async function getAllUsersAction() {
  try {
    const users = await getAllUsersWithCredits();
    // Optionally revalidate the path if data might change frequently,
    // but likely not needed for just fetching.
    // revalidatePath('/admin');
    return { success: true, data: users };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users.' };
  }
}
