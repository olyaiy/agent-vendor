import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  pgEnum,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth-schema';
import { chat } from './chat';

// --- Enums ---

export const documentKindEnum = pgEnum('document_kind', [
  'rich_text',
  'csv',
  'code',
]);

export const documentVisibilityEnum = pgEnum('document_visibility', [
  'public',
  'private',
  'link',
]);

// --- Documents Table ---

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  latest_version: integer('latest_version').notNull().default(1),
  document_kind: documentKindEnum('document_kind').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  visibility: documentVisibilityEnum('visibility').notNull().default('private'),
  owner_id: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }), // Cascade delete if owner is deleted
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// --- Document Versions Table ---

export const documentVersions = pgTable(
  'document_versions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    document_id: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }), // Cascade delete if document is deleted
    version: integer('version').notNull(),
    content: text('content').notNull(), // Using TEXT as decided
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    documentVersionIdx: uniqueIndex('document_version_idx').on(
      table.document_id,
      table.version
    ),
  })
);

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type NewDocumentVersion = typeof documentVersions.$inferInsert;

// --- Document Chat Relations Table ---

export const documentChatRelations = pgTable(
  'document_chat_relations',
  {
    document_id: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    chat_id: uuid('chat_id')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    linked_at: timestamp('linked_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.document_id, table.chat_id] }),
  })
);

export type DocumentChatRelation = typeof documentChatRelations.$inferSelect;
export type NewDocumentChatRelation = typeof documentChatRelations.$inferInsert;