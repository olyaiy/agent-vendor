import { pgTable, uuid, text, jsonb, timestamp, index, varchar } from 'drizzle-orm/pg-core';
import { agents } from './agents';

export const knowledge_items = pgTable("knowledge_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").notNull(), // Stores structured knowledge (text, markdown, or file references)
  type: varchar("type", { length: 50 }).notNull().default('text'), // 'text', 'file', 'url', 'markdown'
  description: text("description"),
  agentId: uuid("agent_id")
    .references(() => agents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (table) => {
  return {
    titleIdx: index("knowledge_title_idx").on(table.title),
    agentIdIdx: index("knowledge_agent_id_idx").on(table.agentId),
  };
});

// Type definitions
export type KnowledgeItem = typeof knowledge_items.$inferSelect; 