'use server';

import { db } from '@/db';
import { waitlist } from '@/db/schema/waitlist';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth-utils';
import type { ActionResult } from './types';

// Infer the Waitlist row type from the schema
export type WaitlistEntry = typeof waitlist.$inferSelect;

/**
 * Fetch all wait-list entries (admin only)
 */
export async function getAllWaitlistEntriesAction(): Promise<ActionResult<WaitlistEntry[]>> {
  const authResult = await requireAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error ?? 'Admin access required' };
  }

  try {
    const entries = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
    return { success: true, data: entries };
  } catch (error) {
    console.error('Failed to fetch wait-list entries:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a wait-list entry by ID (admin only)
 */
export async function deleteWaitlistEntryAction(id: string): Promise<ActionResult<void>> {
  if (!id) return { success: false, error: 'Entry ID is required.' };

  const authResult = await requireAdmin();
  if (!authResult.success) {
    return { success: false, error: authResult.error ?? 'Admin access required' };
  }

  try {
    await db.delete(waitlist).where(eq(waitlist.id, id));
    // Revalidate admin path so UI updates on deletion
    // (Avoid importing next/cache in a shared action file to keep bundle small)
    return { success: true, data: undefined };
  } catch (error) {
    console.error(`Failed to delete wait-list entry ${id}:`, error);
    return { success: false, error: (error as Error).message };
  }
} 