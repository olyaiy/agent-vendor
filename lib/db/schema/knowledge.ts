import { pgTable, uuid, text, jsonb, timestamp, index, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { agents } from './agents';

export const knowledge_items = pgTable("knowledge_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: jsonb("content").notNull(), // Stores structured knowledge (text, markdown, or file references)
  type: varchar("type", { length: 50 }).notNull().default('text'), // 'text', 'file', 'url', 'markdown'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (table) => {
  return {
    titleIdx: index("knowledge_title_idx").on(table.title),
  };
});

export const agent_knowledge = pgTable("agent_knowledge", {
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  knowledgeId: uuid("knowledge_id")
    .notNull()
    .references(() => knowledge_items.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.agentId, table.knowledgeId] }),
    agentIdIdx: index("agent_knowledge_agent_id_idx").on(table.agentId),
    knowledgeIdIdx: index("agent_knowledge_knowledge_id_idx").on(table.knowledgeId),
  };
});

// Type definitions
export type KnowledgeItem = typeof knowledge_items.$inferSelect;
export type AgentKnowledge = typeof agent_knowledge.$inferSelect; 