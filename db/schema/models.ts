import {
  pgTable,
  varchar,
  uuid,
  text,
  numeric,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { modelTypeEnum } from './enums';

export const models = pgTable("models", {
  id: uuid("id").defaultRandom().primaryKey(),
  model_display_name: varchar("model_display_name", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  model_type: modelTypeEnum("model_type").default("text-small"),
  description: text("description"),
  cost_per_million_input_tokens: numeric("cost_per_million_input_tokens", { precision: 10, scale: 4 }),
  cost_per_million_output_tokens: numeric("cost_per_million_output_tokens", { precision: 10, scale: 4 }),
  provider_options: jsonb("provider_options"), 
}, (table) => {
  return {
    modelIdx: index("model_idx").on(table.model),
    providerIdx: index("provider_idx").on(table.provider),
  };
});

export type Model = typeof models.$inferSelect; 