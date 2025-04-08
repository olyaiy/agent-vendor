import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const agent = pgTable("agent", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  avatarUrl: text("avatar_url"),
  systemPrompt: text("system_prompt"),
  welcomeMessage: text("welcome_message"),
  primaryModelId: text("primary_model_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  creatorId: text("creator_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const models = pgTable("models", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
