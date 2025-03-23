import {
  pgTable,
  varchar,
  uuid,
  text,
  json,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { user } from './users';

// Tool Groups table
export const toolGroups = pgTable("tool_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  display_name: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: uuid("creator_id").references(() => user.id),
}, (table) => {
  return {
    creatorIdIdx: index("tool_groups_creator_id_idx").on(table.creatorId),
  };
});

export type ToolGroup = typeof toolGroups.$inferSelect;

export const tools = pgTable("tools", {
  id: uuid("id").defaultRandom().primaryKey(),
  tool_display_name: varchar("tool_display_name", { length: 255 }).notNull(),
  tool: varchar("tool", { length: 255 }).notNull().unique(),
  description: text("description"),
  parameter_schema: json("parameter_schema"), // Stores the Zod/JSON schema for tool parameters
  config: json("config"), 
});

export type Tool = typeof tools.$inferSelect;

// Many-to-many relationship between tools and tool groups
export const toolGroupTools = pgTable("tool_group_tools", {
  toolGroupId: uuid("tool_group_id")
    .notNull()
    .references(() => toolGroups.id, { onDelete: "cascade" }),
  toolId: uuid("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.toolGroupId, table.toolId] }),
    toolGroupIdIdx: index("tool_group_tools_tool_group_id_idx").on(table.toolGroupId),
    toolIdIdx: index("tool_group_tools_tool_id_idx").on(table.toolId),
  };
});

export type ToolGroupTool = typeof toolGroupTools.$inferSelect; 