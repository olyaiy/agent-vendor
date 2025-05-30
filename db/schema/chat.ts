import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  index,
//   primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth-schema';
import { agent, models } from './agent';




// --------------------------------------------------
// Chat Table 
// --------------------------------------------------
export const chat = pgTable('Chat', {

    id: uuid('id').primaryKey().notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id),
    agentId: text('agentId')  // Single agent associated with the chat
      .references(() => agent.id, { onDelete: 'cascade' }),
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
  





  // --------------------------------------------------
// Modern Message Table (Supports complex content)
// --------------------------------------------------
export const message = pgTable("Message", {
    // Use UUID v7 for better performance - time-ordered for efficient indexing
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chatId')  // Links to either Chat or GroupChat
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    role: varchar('role').notNull(),  // 'user', 'assistant', or 'system'
    parts: json("parts").notNull(),    // Structured content blocks (text, images, etc)
    attachments: json("attachments").notNull(),  // File attachments metadata
    createdAt: timestamp('createdAt').notNull(),
    model_id: text("model_id")  // Model used for generation
      .references(() => models.id, { onDelete: "cascade" }),
  }, (table) => {
    return {
      chatIdIdx: index("message_v2_chat_id_idx").on(table.chatId),  // Optimized message retrieval
      modelIdIdx: index("message_v2_model_id_idx").on(table.model_id),  // Model performance tracking
      createdAtIdx: index("message_v2_created_at_idx").on(table.createdAt),  // Chronological sorting
    };
  });
  
  export type DBMessage = InferSelectModel<typeof message>;
  
// Add relations
export const chatRelations = relations(chat, ({ one, many }) => ({
  user: one(user, {
    fields: [chat.userId],
    references: [user.id],
  }),
  agent: one(agent, {
    fields: [chat.agentId],
    references: [agent.id],
  }),
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
  model: one(models, {
    fields: [message.model_id],
    references: [models.id],
  }),
}));
  