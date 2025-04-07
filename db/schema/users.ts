import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  primaryKey,
  index,
  numeric,
} from 'drizzle-orm/pg-core';

// Base tables (no foreign key dependencies)
export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  user_name: varchar('user_name', { length: 64 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: index("user_email_idx").on(table.email),
    createdAtIdx: index("user_created_at_idx").on(table.createdAt),
  };
});

export type User = InferSelectModel<typeof user>;

// Add new user_credits table
export const userCredits = pgTable('user_credits', {
  user_id: uuid('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  credit_balance: numeric('credit_balance', { precision: 19, scale: 9 }).default('0'),
  lifetime_credits: numeric('lifetime_credits', { precision: 19, scale: 9 }).default('0'),
}, (table) => {
  return {
    // Add composite index for credit balance checks
    balance_idx: index("credit_balance_idx").on(table.user_id, table.credit_balance),
  };
});

export type UserCredits = InferSelectModel<typeof userCredits>;

// Customer table for Stripe integration
export const customer = pgTable('customer', {
  id: uuid('id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  stripe_customer_id: varchar('stripe_customer_id', { length: 100 }),
  email: varchar('email', { length: 64 }),
});

export type Customer = InferSelectModel<typeof customer>; 