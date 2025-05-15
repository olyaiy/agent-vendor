import {
  pgTable,
  text,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from '../schema/auth-schema'; // Assuming this is the correct path
import { agent } from '../schema/agent'; // Assuming this is the correct path

/**
 * Enum defining tool types for type-safety and database validation
 * Values: 'basetool' (basic tool), 'sequence' (tool sequence), 'api' (external API integration)
 */
export const toolTypeEnum = pgEnum('tool_type', [
  'basetool',
  'sequence',
  'api',
]);

/**
 * Main tools table storing all available tools
 * Includes indexes for common query patterns on name, creator_id, and type
 */
export const tools = pgTable(
  'tools',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`), // Auto-generated UUID
    name: text('name').notNull(), // Unique machine-readable identifier
    displayName: text('displayName'), // Human-readable name for UI
    description: text('description'), // Tool functionality description
    creatorId: text('creator_id').references(() => user.id, {
      onDelete: 'set null', // Preserve tool if user is deleted
    }),
    type: toolTypeEnum('type').notNull(), // Type from toolTypeEnum
    prompt: text('prompt'), // Optional prompt for the agent about the tool
    definition: jsonb('definition'), // Tool configuration (type-specific)
    inputSchema: jsonb('input_schema'), // JSON Schema for input validation
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => ({
    // Indexes for common query patterns
    nameIdx: index('tools_name_idx').on(table.name), // Frequent lookups by name
    creatorIdIdx: index('tools_creator_id_idx').on(table.creatorId), // User tools listing
    typeIdx: index('tools_type_idx').on(table.type), // Filtering by tool type
  })
);

/**
 * Junction table for many-to-many relationship between agents and tools
 * Composite primary key ensures unique agent/tool combinations
 */
export const agentTools = pgTable(
  'agent_tools',
  {
    agentId: text('agent_id')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }), // Delete links when agent is removed
    toolId: text('tool_id')
      .notNull()
      .references(() => tools.id, { onDelete: 'cascade' }), // Delete links when tool is removed
  },
  (table) => ({
    pk: primaryKey({ columns: [table.agentId, table.toolId] }), // Enforce unique agent-tool pairs
  })
);

export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type AgentTool = typeof agentTools.$inferSelect;
export type NewAgentTool = typeof agentTools.$inferInsert;