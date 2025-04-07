import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  text,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { agents } from './agents';

// Tags system - for categorizing and finding agents
export const tagCategories = pgTable('tag_categories', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type TagCategory = typeof tagCategories.$inferSelect;

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    nameIdx: index("tags_name_idx").on(table.name),
  };
});

export type Tag = typeof tags.$inferSelect;

export const agentTags = pgTable('agent_tags', {
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.agentId, table.tagId] }),
    agentIdIdx: index("agent_tags_agent_id_idx").on(table.agentId),
    tagIdIdx: index("agent_tags_tag_id_idx").on(table.tagId),
  };
});

export type AgentTag = typeof agentTags.$inferSelect; 