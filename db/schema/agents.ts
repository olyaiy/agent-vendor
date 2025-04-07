import {
  pgTable,
  varchar,
  uuid,
  text,
  json,
  boolean,
  timestamp,
  index,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core';
import { user } from './users';
import { models } from './models';
import { toolGroups } from './tools';
import { visibilityEnum } from './enums';

export const agents = pgTable("agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  agent: varchar("agent", { length: 255 }).notNull().unique().default("temp_slug"),
  agent_display_name: varchar("agent_display_name", { length: 255 }).notNull(),
  system_prompt: text("system_prompt").notNull(),
  description: text("description"),
  visibility: visibilityEnum("visibility").default("public"),
  featured: boolean("featured").default(false),
  creatorId: uuid("creator_id").references(() => user.id),
  artifacts_enabled: boolean("artifacts_enabled").default(true),
  thumbnail_url: text("thumbnail_url"),
  avatar_url: text("avatar_url"),
  customization: json("customization").default({
    overview: {
      title: "Welcome to your AI assistant!",
      content: "Im here to help answer your questions and provide information. Feel free to ask me anything.",
      showPoints: false,
      points: []
    },
    style: {
      colorSchemeId: "default",
      // backgroundColor: "#ffffff",
      // customColors: false
    }
  }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (table) => {
  return {
    creatorIdIdx: index("agents_creator_id_idx").on(table.creatorId),
    visibilityIdx: index("agents_visibility_idx").on(table.visibility),
    visibilityCreatorIdx: index("agents_visibility_creator_idx").on(table.visibility, table.creatorId),
    visibilityCreatedAtIdx: index("agents_visibility_created_at_idx").on(
      table.visibility, table.createdAt
    ),
  };
});

export type Agent = typeof agents.$inferSelect;

export const suggestedPrompts = pgTable("suggested_prompts", {
  agentId: uuid("agent_id").primaryKey().references(() => agents.id, { onDelete: "cascade" }),
  prompts: jsonb("prompts").notNull().default([
    "What are the advantages of using Next.js?",
    "Help me write an essay about silicon valley",
    "Write code to demonstrate djikstras algorithm",
    "What is the weather in San Francisco?"
  ]),
}, (table) => {
  return {
    agentIdIdx: index("suggested_prompts_agent_id_idx").on(table.agentId),
  };
});

export type SuggestedPrompts = typeof suggestedPrompts.$inferSelect;

export interface AgentCustomization {
  overview: {
    title: string;
    content: string;
    showPoints: boolean;
    points: string[];
  };
  style: {
    colorSchemeId: string;
  };
}

// Many-to-many relationship between agents and models
export const agentModels = pgTable("agent_models", {
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => models.id, { onDelete: "cascade" }),
  isDefault: boolean("is_default").default(false),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.agentId, table.modelId] }),
    agentIdIdx: index("agent_models_agent_id_idx").on(table.agentId),
    modelIdIdx: index("agent_models_model_id_idx").on(table.modelId),
    isDefaultIdx: index("agent_models_is_default_idx").on(table.isDefault)
  };
});

export type AgentModel = typeof agentModels.$inferSelect;

// Many-to-many relationship between agents and tool groups
export const agentToolGroups = pgTable("agent_tool_groups", {
  agentId: uuid("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  toolGroupId: uuid("tool_group_id")
    .notNull()
    .references(() => toolGroups.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.agentId, table.toolGroupId] }),
    agentIdIdx: index("agent_tool_groups_agent_id_idx").on(table.agentId),
    toolGroupIdIdx: index("agent_tool_groups_tool_group_id_idx").on(table.toolGroupId),
  };
});

export type AgentToolGroup = typeof agentToolGroups.$inferSelect; 