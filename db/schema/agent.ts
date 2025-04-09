import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

export const agent = pgTable("agent", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  avatarUrl: text("avatar_url"),
  systemPrompt: text("system_prompt"),
  welcomeMessage: text("welcome_message"),
  primaryModelId: text("primary_model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  visibility: text("visibility").default("public").notNull(),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`now()`).notNull(),
  creatorId: text("creator_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export type Agent = typeof agent.$inferSelect;


export const models = pgTable("models", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  model: text("model").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { mode: 'date' }).default(sql`now()`).notNull(),
});

export type Model = typeof models.$inferSelect;

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