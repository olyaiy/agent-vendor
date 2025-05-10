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

export const toolTypeEnum = pgEnum('tool_type', [
  'basetool',
  'sequence',
  'api',
]);

export const tools = pgTable(
  'tools',
  {
    id: text('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    displayName: text('displayName'),
    description: text('description'),
    creatorId: text('creator_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    type: toolTypeEnum('type').notNull(),
    definition: jsonb('definition'),
    inputSchema: jsonb('input_schema'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => {
    return {
      nameIdx: index('tools_name_idx').on(table.name),
      creatorIdIdx: index('tools_creator_id_idx').on(table.creatorId),
      typeIdx: index('tools_type_idx').on(table.type),
    };
  },
);

export const agentTools = pgTable(
  'agent_tools',
  {
    agentId: text('agent_id')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
    toolId: text('tool_id')
      .notNull()
      .references(() => tools.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.agentId, table.toolId] }),
    };
  },
);

export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type AgentTool = typeof agentTools.$inferSelect;
export type NewAgentTool = typeof agentTools.$inferInsert;