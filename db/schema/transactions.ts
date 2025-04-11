import { pgTable, uuid, text, timestamp, numeric, varchar, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { message } from "./chat";

export const transaction = pgTable("transaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "no action" }),
  messageId: uuid("message_id")
    .references(() => message.id, { onDelete: "no action" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  type: varchar("type", { enum: ["usage", "top_up"] }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull()
}, (table) => ({
  userIdIdx: index("transaction_user_id_idx").on(table.userId),
  messageIdIdx: index("transaction_message_id_idx").on(table.messageId),
  createdAtIdx: index("transaction_created_at_idx").on(table.createdAt)
}));

export const userCredits = pgTable("user_credits", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "no action" }),
  creditBalance: numeric("credit_balance", { precision: 20, scale: 8 }).notNull().default("0"),
  lifetimeCredits: numeric("lifetime_credits", { precision: 20, scale: 8 }).notNull().default("0")
});

export type Transaction = typeof transaction.$inferSelect;
export type UserCredits = typeof userCredits.$inferSelect; 