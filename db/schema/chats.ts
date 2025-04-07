import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { user } from './users';
import { agents } from './agents';
import { models } from './models';

// --------------------------------------------------
// Individual Chat Table (1:1 user-agent conversation)
// --------------------------------------------------
export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  agentId: uuid('agentId')  // Single agent associated with the chat
    .references(() => agents.id, { onDelete: 'cascade' }),
  visibility: varchar('visibility', { 
    enum: ['public', 'private', 'link']  // Controls chat access
  }).notNull().default('private'),
}, (table) => {
  return {
    userIdIdx: index("chat_user_id_idx").on(table.userId),  // Optimize user-based queries
    agentIdIdx: index("chat_agent_id_idx").on(table.agentId),  // Speed up agent lookups
    createdAtIdx: index("chat_created_at_idx").on(table.createdAt),  // Time-based sorting
  };
});

export type Chat = InferSelectModel<typeof chat>;

// Extended type for UI presentation needs
export type ExtendedChat = Chat & {
  agentDisplayName?: string | null;  // Cached display name for UI rendering
};

// --------------------------------------------------
// Deprecated Message Table (Legacy system)
// --------------------------------------------------
export const messageDeprecated = pgTable("Message", {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),  // 'user' or 'assistant'
  content: json('content').notNull(),  // Legacy message format
  createdAt: timestamp('createdAt').notNull(),
  model_id: uuid("model_id")  // Which model generated the response
    .references(() => models.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    chatIdIdx: index("message_chat_id_idx").on(table.chatId),  // Message lookup by chat
    modelIdIdx: index("message_model_id_idx").on(table.model_id),  // Model analysis
    createdAtIdx: index("message_created_at_idx").on(table.createdAt),  // Time filtering
  };
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

// --------------------------------------------------
// Modern Message Table (Supports complex content)
// --------------------------------------------------
export const message = pgTable("Message_v2", {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')  // Links to either Chat or GroupChat
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),  // 'user', 'assistant', or 'system'
  parts: json("parts").notNull(),    // Structured content blocks (text, images, etc)
  attachments: json("attachments").notNull(),  // File attachments metadata
  createdAt: timestamp('createdAt').notNull(),
  model_id: uuid("model_id")  // Model used for generation
    .references(() => models.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    chatIdIdx: index("message_v2_chat_id_idx").on(table.chatId),  // Optimized message retrieval
    modelIdIdx: index("message_v2_model_id_idx").on(table.model_id),  // Model performance tracking
    createdAtIdx: index("message_v2_created_at_idx").on(table.createdAt),  // Chronological sorting
  };
});

export type DBMessage = InferSelectModel<typeof message>;

// --------------------------------------------------
// Group Chat Table (Multi-agent conversations)
// --------------------------------------------------
export const groupChat = pgTable('GroupChat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')  // Group chat creator
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { 
    enum: ['public', 'private', 'link']  // Same visibility options as individual chats
  }).notNull().default('private'),
}, (table) => ({
  userIdIdx: index("group_chat_user_id_idx").on(table.userId),  // Creator-based lookups
  createdAtIdx: index("group_chat_created_at_idx").on(table.createdAt),  // Newest-first ordering
}));

// --------------------------------------------------
// Group Chat Agents Junction Table (Many-to-Many)
// --------------------------------------------------
export const groupChatAgents = pgTable('GroupChatAgents', {
  groupChatId: uuid('groupChatId')  // Reference to group chat
    .notNull()
    .references(() => groupChat.id, { onDelete: 'cascade' }),
  agentId: uuid('agentId')  // Participant agent
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joinedAt').notNull().defaultNow(),  // Timestamp for analytics
}, (table) => ({
  pk: primaryKey(table.groupChatId, table.agentId),  // Enforce unique combinations
  groupChatIdIdx: index("group_chat_agents_gc_id_idx").on(table.groupChatId),  // Group-centric queries
  agentIdIdx: index("group_chat_agents_agent_id_idx").on(table.agentId),  // Agent participation tracking
})); 