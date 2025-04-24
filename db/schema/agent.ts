import { pgTable, text, timestamp, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

// --- Agent Schema --- //

export const agent = pgTable("agent", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").unique(),         
  thumbnailUrl: text("thumbnail_url"),
  avatarUrl: text("avatar_url"),
  systemPrompt: text("system_prompt"),
  welcomeMessage: text("welcome_message"),
  primaryModelId: text("primary_model_id").notNull().references(() => models.id, { onDelete: "no action" }), // Corrected onDelete
  visibility: text("visibility").default("public").notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`now()`).notNull(),
  creatorId: text("creator_id").notNull().references(() => user.id, { onDelete: "no action" }),
});

export type Agent = typeof agent.$inferSelect;

// --- Model Schema --- //

export const models = pgTable("models", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  model: text("model").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => { // Corrected: Index definition as the third argument
  return {
    // Add a unique index to the model name
    modelNameIdx: uniqueIndex("model_name_idx").on(table.model),
  };
});

export type Model = typeof models.$inferSelect;

// --- Knowledge Item Schema --- //

export const knowledge = pgTable("knowledge", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: text("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`now()`).notNull(),
});

export type Knowledge = typeof knowledge.$inferSelect;

// --- Tag Schema --- //

export const tags = pgTable("tags", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => {
  return {
    // Add a unique index to the tag name for faster lookups and to enforce uniqueness
    nameIdx: uniqueIndex("tag_name_idx").on(table.name),
  };
});

export type Tag = typeof tags.$inferSelect;

// --- Agent-Tag Join Table Schema --- //

export const agentTags = pgTable("agent_tags", {
  agentId: text("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }), // Cascade delete if tag is removed
  assignedAt: timestamp("assigned_at", { mode: 'date' }).default(sql`now()`).notNull(), // Optional: track when tag was assigned
}, (table) => {
  return {
    // Define a composite primary key for the combination of agentId and tagId
    pk: primaryKey({ columns: [table.agentId, table.tagId] }),
  };
});

export type AgentTag = typeof agentTags.$inferSelect;