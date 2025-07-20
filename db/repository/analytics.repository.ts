import { db } from '..';
import { chat, message } from '../schema/chat';
import { sql, eq, gte } from 'drizzle-orm';

export type DailyActiveUsersRow = {
  day: Date;
  activeUsers: number;
};

/**
 * Returns the number of unique users that sent a message on each day
 * within the given time range.
 */
export async function selectDailyActiveUsers(days: number): Promise<DailyActiveUsersRow[]> {
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setDate(from.getDate() - (days - 1));

  const dayColumn = sql`date_trunc('day', ${message.createdAt})`;

  const results = await db
    .select({
      day: dayColumn,
      activeUsers: sql<number>`count(distinct ${chat.userId})`,
    })
    .from(message)
    .innerJoin(chat, eq(message.chatId, chat.id))
    .where(gte(message.createdAt, from))
    .groupBy(dayColumn)
    .orderBy(dayColumn);

  return results.map((row) => ({
    day: row.day as unknown as Date,
    activeUsers: Number(row.activeUsers),
  }));
}
