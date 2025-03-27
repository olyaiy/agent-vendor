import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { user } from './users';
import { agents } from './agents';
import { models } from './models';

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  agentId: uuid('agentId')
    .references(() => agents.id, { onDelete: 'cascade' }),
  visibility: varchar('visibility', { enum: ['public', 'private', 'link'] })
    .notNull()
    .default('private'),
}, (table) => {
  return {
    userIdIdx: index("chat_user_id_idx").on(table.userId),
    agentIdIdx: index("chat_agent_id_idx").on(table.agentId),
    createdAtIdx: index("chat_created_at_idx").on(table.createdAt),
  };
});

export type Chat = InferSelectModel<typeof chat>;

export type ExtendedChat = Chat & {
  agentDisplayName?: string | null;
};

// DEPRECATED MESSAGES TABLE
export const messageDeprecated = pgTable("Message", {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
  model_id: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    chatIdIdx: index("message_chat_id_idx").on(table.chatId),
    modelIdIdx: index("message_model_id_idx").on(table.model_id),
    createdAtIdx: index("message_created_at_idx").on(table.createdAt),
  };
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

// NEW MESSAGES TABLE
export const message = pgTable("Message_v2", {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp('createdAt').notNull(),
  model_id: uuid("model_id")
    .references(() => models.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    chatIdIdx: index("message_v2_chat_id_idx").on(table.chatId),
    modelIdIdx: index("message_v2_model_id_idx").on(table.model_id),
    createdAtIdx: index("message_v2_created_at_idx").on(table.createdAt),
  };
});

export type DBMessage = InferSelectModel<typeof message>; 