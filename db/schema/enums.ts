import { pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const modelTypeEnum = pgEnum("model_type", [
  "text-large",
  "text-small", 
  "reasoning",
  "image",
  "search"
]);

export const visibilityEnum = pgEnum("visibility", ["public", "private", "link"]);
export type AgentVisibility = typeof visibilityEnum.enumValues[number];

// Transaction enums
export const transactionTypeEnum = pgEnum("transaction_type", [
  "usage",
  "purchase",
  "refund",
  "promotional",
  "adjustment",
  "self_usage"
]);

// Token type enum
export const tokenTypeEnum = pgEnum("token_type", [
  "input",
  "output"
]);

// Tag source enum
export const tagSourceEnum = pgEnum("tag_source", [
  "system",
  "user"
]); 