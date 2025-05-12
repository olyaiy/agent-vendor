# Plan: Agent Document Creation & Modification

This plan outlines the steps to implement document creation and modification capabilities for agents.

**I. Database Layer:**

1.  **Define New Schemas** (in a new file, e.g., `db/schema/document.ts`):
    *   **`document_kind_enum`**: `pgEnum('document_kind', ['rich_text', 'csv', 'code'])`
    *   **`document_visibility_enum`**: `pgEnum('document_visibility', ['public', 'private', 'link'])`
    *   **`documents` Table:**
        *   `id`: `uuid('id').primaryKey().defaultRandom()`
        *   `title`: `text('title').notNull()`
        *   `latest_version`: `integer('latest_version').notNull().default(1)`
        *   `document_kind`: `document_kind_enum('document_kind').notNull()`
        *   `created_at`: `timestamp('created_at').notNull().defaultNow()`
        *   `updated_at`: `timestamp('updated_at').notNull().defaultNow()`
        *   `visibility`: `document_visibility_enum('visibility').notNull().default('private')`
        *   `owner_id`: `text('owner_id').notNull().references(() => user.id, { onDelete: 'cascade' })` (from `db/schema/auth-schema.ts`)
    *   **`document_versions` Table:**
        *   `id`: `uuid('id').primaryKey().defaultRandom()`
        *   `document_id`: `uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' })`
        *   `version`: `integer('version').notNull()`
        *   `content`: `text('content').notNull()`
        *   `created_at`: `timestamp('created_at').notNull().defaultNow()`
        *   Add `uniqueIndex('document_version_idx').on(document_versions.document_id, document_versions.version)`.
    *   **`document_chat_relations` Table:**
        *   `document_id`: `uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' })`
        *   `chat_id`: `uuid('chat_id').notNull().references(() => chat.id, { onDelete: 'cascade' })` (from `db/schema/chat.ts`)
        *   `linked_at`: `timestamp('linked_at').notNull().defaultNow()`
        *   `primaryKey({ columns: [document_chat_relations.document_id, document_chat_relations.chat_id] })`.
2.  **Update Schema Index:** Add these new tables and enums to `db/schema/index.ts`.
3.  **Generate & Apply Migration:** Use Drizzle Kit to generate and apply the database migration.

**II. Backend Logic (Repositories & Actions):**

1.  **Document Repository (`db/repository/document.repository.ts`):**
    *   `createDocumentAndVersion(data: { title, kind, content, visibility, ownerId })`: Creates document and its first version in a transaction. Returns `{ document: Document, version: DocumentVersion }`.
    *   `createNewVersion(data: { documentId, content, newLatestVersionNumber })`: Creates a new version. Returns `DocumentVersion`.
    *   `updateDocumentMetadata(documentId, data: { title?, visibility?, latest_version?, updatedAt? })`: Updates document. Returns `Document`.
    *   `selectDocumentById(documentId)`: Returns `Document | undefined`.
    *   `selectDocumentByIdWithLatestVersion(documentId)`: Fetches document with its latest version's content. Returns `{ document: Document, version: DocumentVersion } | undefined`.
    *   `selectDocumentVersion(documentId, versionNumber)`: Returns `DocumentVersion | undefined`.
    *   `linkDocumentToChat(documentId, chatId)`, `unlinkDocumentFromChat(documentId, chatId)`.
    *   `selectDocumentsByOwner(ownerId)`, `selectDocumentsForChat(chatId)`.
2.  **Document Actions (`db/actions/document.actions.ts`):**
    *   `createDocumentAction(artifactTitle: string, artifactKind: 'rich_text' | 'csv' | 'code', content: string, visibility: 'public' | 'private' | 'link', chatId?: string)`:
        *   Gets `ownerId` from session.
        *   Calls repository to create document and first version.
        *   Optionally links to chat.
        *   Returns: `{ success: true, documentId: string, version: 1, content: string }` or `{ success: false, error: string }`.
    *   `updateDocumentAction(documentId: string, content: string, artifactTitle?: string, visibility?: 'public' | 'private' | 'link')`:
        *   Gets `ownerId` from session, verifies ownership against `documents.owner_id`.
        *   Atomically increments `documents.latest_version` and creates new `document_versions` entry.
        *   Updates `documents.title` and `documents.visibility` if provided. Sets `documents.updated_at`.
        *   Returns: `{ success: true, documentId: string, version: number, content: string }` or `{ success: false, error: string }`.

**III. Tool Implementation:**

1.  **Tool Definitions (in `tools/` directory):**
    *   **`create_document_tool.ts`:**
        *   `name`: "create_document"
        *   `description`: "Creates a new document with the given title, kind, and content. Optionally sets visibility and links to the current chat."
        *   `inputSchema` (Zod): `{ artifactTitle: z.string(), artifactKind: z.enum(['rich_text', 'csv', 'code']), content: z.string(), visibility: z.enum(['public', 'private', 'link']).optional().default('private') }`
        *   `execute`: Calls `createDocumentAction`. Returns `{ documentId, version, content }`.
    *   **`update_document_tool.ts`:**
        *   `name`: "update_document"
        *   `description`: "Updates an existing document with new content. Can also update its title and visibility."
        *   `inputSchema` (Zod): `{ documentId: z.string(), content: z.string(), artifactTitle: z.string().optional(), visibility: z.enum(['public', 'private', 'link']).optional() }`
        *   `execute`: Calls `updateDocumentAction`. Returns `{ documentId, version, content }`.
2.  **Tool Registration:**
    *   Add to `tools/registry.ts`.
    *   Add entries to the `tools` DB table (via admin UI or a seed script) with their `name`, `displayName` (e.g., "Create Document", "Update Document"), `description`, `type` ('basetool'), and the JSON representation of their `inputSchema`.
3.  **Agent Integration:**
    *   Agents can be assigned these tools via the `agent_tools` table.

**IV. UI/Frontend (Minimal for agent interaction):**

1.  **Tool Messages (`components/chat/tool-message.tsx`):**
    *   Add `case` statements for `create_document` and `update_document`.
    *   When `toolInvocation.state === 'result'`, display the returned `documentId`, `version`, and a success message (e.g., "Document 'MyTitle' (v1) created." or "Document 'MyTitle' updated to v2.").
2.  **Agent Settings (`components/agents/settings/agent-tools-form.tsx`):**
    *   Ensure the new tools, once added to the `tools` DB table, appear in the list of available tools to assign to an agent.