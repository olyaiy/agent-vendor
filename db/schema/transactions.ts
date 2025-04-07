import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  numeric,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './users';
import { models } from './models';
import { agents } from './agents';
import { message } from './chats';
import { transactionTypeEnum, tokenTypeEnum } from './enums';

export const userTransactions = pgTable('user_transactions', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id),
  amount: numeric('amount', { precision: 19, scale: 9 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  description: text('description'),
  messageId: uuid('message_id').references(() => message.id, { onDelete: 'set null' }),
  modelId: uuid('model_id').references(() => models.id, { onDelete: 'set null' }),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  tokenAmount: integer('token_amount'),
  tokenType: tokenTypeEnum('token_type'),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("user_transactions_user_id_idx").on(table.userId),
    messageIdIdx: index("user_transactions_message_id_idx").on(table.messageId),
    agentIdIdx: index("user_transactions_agent_id_idx").on(table.agentId),
    user_created_idx: index("user_transactions_user_created_idx").on(table.userId, table.created_at),
    amount_type_idx: index("transactions_amount_type_idx").on(table.amount, table.type),
  };
});

export type UserTransaction = InferSelectModel<typeof userTransactions>; 