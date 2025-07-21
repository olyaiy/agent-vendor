'use server';

import {
  selectDailyActiveUsers,
  selectDailySignups,
} from '@/db/repository/analytics.repository';
import { requireAdmin } from '@/lib/auth-utils';
import type { ActionResult } from './types';

export async function getDailyActiveUsersAction(days: number): Promise<ActionResult<Awaited<ReturnType<typeof selectDailyActiveUsers>>>> {
  if (!days || days <= 0) {
    return { success: false, error: 'Invalid number of days.' };
  }

  const auth = await requireAdmin();
  if (!auth.success) {
    return { success: false, error: auth.error ?? 'Admin access required' };
  }

  try {
    const data = await selectDailyActiveUsers(days);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch daily active users:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getDailySignupsAction(days: number): Promise<ActionResult<Awaited<ReturnType<typeof selectDailySignups>>>> {
  if (!days || days <= 0) {
    return { success: false, error: 'Invalid number of days.' };
  }

  const auth = await requireAdmin();
  if (!auth.success) {
    return { success: false, error: auth.error ?? 'Admin access required' };
  }

  try {
    const data = await selectDailySignups(days);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch daily signups:', error);
    return { success: false, error: (error as Error).message };
  }
}
