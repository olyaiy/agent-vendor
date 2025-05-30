import { pgTable, text, timestamp, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
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
  // primaryModelId: text("primary_model_id").notNull().references(() => models.id, { onDelete: "no action" }), // Corrected onDelete
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
}, (table) => { 
  return {
    modelNameIdx: uniqueIndex("model_name_idx").on(table.model),
  };
});

export type Model = typeof models.$inferSelect;



// --- Agent-Model Schema --- //
export const agentModels = pgTable("agent_models", {
  agentId: text("agent_id")
    .notNull()
    .references(() => agent.id, { onDelete: "cascade" }),

  modelId: text("model_id")
    .notNull()
    .references(() => models.id, { onDelete: "no action" }),

  role: text("role").$type<"primary" | "secondary">().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.agentId, t.modelId] }),
  uniquePrimaryPerAgent: uniqueIndex("unique_primary_model_per_agent")
    .on(t.agentId)
    .where(sql`${t.role} = 'primary'`),
}));

export type AgentModel = typeof agentModels.$inferSelect;




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
    pk: primaryKey({ columns: [table.agentId, table.tagId] }),
  };
});

export type AgentTag = typeof agentTags.$inferSelect;

// Add relations
export const agentRelations = relations(agent, ({ one, many }) => ({
  creator: one(user, {
    fields: [agent.creatorId],
    references: [user.id],
  }),
  agentModels: many(agentModels),
  knowledge: many(knowledge),
  agentTags: many(agentTags),
}));

export const agentModelsRelations = relations(agentModels, ({ one }) => ({
  agent: one(agent, {
    fields: [agentModels.agentId],
    references: [agent.id],
  }),
  model: one(models, {
    fields: [agentModels.modelId],
    references: [models.id],
  }),
}));

export const modelsRelations = relations(models, ({ many }) => ({
  agentModels: many(agentModels),
}));

export const knowledgeRelations = relations(knowledge, ({ one }) => ({
  agent: one(agent, {
    fields: [knowledge.agentId],
    references: [agent.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  agentTags: many(agentTags),
}));

export const agentTagsRelations = relations(agentTags, ({ one }) => ({
  agent: one(agent, {
    fields: [agentTags.agentId],
    references: [agent.id],
  }),
  tag: one(tags, {
    fields: [agentTags.tagId],
    references: [tags.id],
  }),
}));