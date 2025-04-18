# Agent Tool Usage Implementation Plan

**Version:** 1.0
**Date:** 2025-04-17

**Goal:** Implement a flexible and extensible system allowing AI agents within the marketplace to utilize tools, starting with pre-built tools and user-defined sequences of those tools.

**Guiding Principles:**
*   **Phased Rollout:** Introduce functionality incrementally, starting with core features.
*   **Efficiency:** Optimize for performance by minimizing unnecessary database calls and network payloads. Leverage local code for static definitions.
*   **Scalability:** Design database schemas and API interactions to handle growth in users, agents, and tools.
*   **Maintainability:** Keep code organized with clear separation of concerns. Centralize complex logic where appropriate.
*   **Extensibility:** Design with future tool types (e.g., API calls) in mind.

**Chosen Architecture: Hybrid Approach**
*   **Base/Pre-built Tools:** Defined locally in the codebase for speed and version control.
*   **Custom/Sequence Tools:** Definitions stored in the database (specifically, sequence logic stored in a JSONB column within the main `tools` table).
*   **Execution:** A generic `sequenceRunner` tool, defined locally, is called by the AI. This runner fetches the sequence definition from the DB based on an ID and programmatically executes the steps, calling the local base tool functions.

---

## Phase 1: Foundational Infrastructure & Pre-built Tools (MVP)

**Goal:** Enable agents to use individual, pre-defined tools executed server-side.

**Tasks:**

1.  **Database Schema & Migrations:**
    *   **`tools` Table:**
        *   Create using Drizzle ORM.
        *   Columns:
            *   `id`: `text().primaryKey().default(sql\`gen_random_uuid()\`)`
            *   `name`: `text().notNull()` (Consider uniqueness constraint: unique globally 
             *   `displayName`: `text()`
            *   `description`: `text()`
            *   `creatorId`: `text().references(() => user.id, { onDelete: "set null" })`
            *   `type`: `pgEnum('tool_type', ['basetool', 'sequence', 'api']).notNull()`
            *   `definition`: `jsonb("definition")` (NULL for prebuilt initially)
            *   `inputSchema`: `jsonb("input_schema")` (Stores Zod/JSON schema for tool inputs, useful for sequences/API)
            *   `createdAt`: `timestamp().default(sql\`now()\`).notNull()`
            *   `updatedAt`: `timestamp().default(sql\`now()\`).notNull()`
        *   Indexes: `name`, `creatorId`, `type`.
    *   **`agent_tools` Table:**
        *   Create using Drizzle ORM.
        *   Columns:
            *   `agent_id`: `text().notNull().references(() => agent.id, { onDelete: "cascade" })`
            *   `tool_id`: `text().notNull().references(() => tools.id, { onDelete: "cascade" })`
        *   Primary Key: Composite (`agent_id`, `tool_id`).
    *   **Migration:** Generate and apply the database migration script.

    ```mermaid
    erDiagram
        USER ||--o{ AGENT : creates
        USER ||--o{ TOOLS : creates (custom)
        AGENT ||--|{ AGENT_TOOLS : has
        TOOLS ||--|{ AGENT_TOOLS : used_in

        TOOLS {
            string id PK
            string name
            string description
            string creatorId FK "Nullable"
            string visibility
            enum type "prebuilt, sequence, api"
            jsonb definition "Stores sequence steps / API details"
            jsonb inputSchema "Defines initial input structure"
            timestamp createdAt
            timestamp updatedAt
        }
        AGENT_TOOLS {
            string agent_id PK, FK
            string tool_id PK, FK
        }
        AGENT { string id PK ... }
        USER { string id PK ... }
    ```

2.  **Define Pre-built Tools Locally:**
    *   Create directory: `/lib/tools/`
    *   Implement `getCurrentTime.ts`, `calculator.ts`, `stringUtils.ts` (e.g., reverse, uppercase).
    *   Use `ai` SDK's `tool()` helper.
    *   Define Zod schemas for `parameters`.
    *   Implement async `execute` functions.
    *   Ensure robust error handling within `execute`.

3.  **Seed Database with Pre-built Tools:**
    *   Create a script (`/db/seed.ts`?) or manually insert records into `tools` for each local tool.
    *   Set `type='prebuilt'`, `creatorId=null`, `visibility='public'`.
    *   Store the tool's unique ID (generated during seeding) for later reference. `definition` and `inputSchema` can be `null`.

4.  **API Endpoints for Agent Tool Association:**
    *   Location: `/app/api/agents/[agentId]/tools/route.ts` (or similar).
    *   Implement Next.js Route Handlers for:
        *   `GET`: Fetch associated `tool_id`s from `agent_tools` for the given `agentId`. Return list of tool IDs/names. (Requires DB query). Add authentication check.
        *   `POST`: Receive `{ toolId: string }` in body. Check if tool exists. Add entry to `agent_tools`. Return success/error. Add authentication/authorization check (is user the agent owner?).
        *   `DELETE`: Receive `{ toolId: string }` in body or via query param. Delete entry from `agent_tools`. Return success/error. Add authentication/authorization check.

5.  **Integrate Pre-built Tools into Chat API (`/app/api/chat/route.ts`):**
    *   Import all local pre-built tool definitions (e.g., `import { getCurrentTimeTool } from '@/lib/tools/getCurrentTime';`). Create a map or list for easy access.
    *   Inside the `POST` handler, *before* calling `streamText`:
        *   Authenticate the user (`auth.api.getSession`).
        *   Get `agentId` from the request body.
        *   Fetch the list of associated `tool_id`s for this `agentId` from the `agent_tools` table (DB query).
        *   Create the `toolsForModel` object/map.
        *   Iterate through the imported local pre-built tools. If a tool's corresponding database ID (from seeding) is present in the fetched `associated_tool_ids`, add its *full definition* (including the `execute` function) to `toolsForModel`.
        *   Call `streamText({ ..., tools: toolsForModel, ... })`.
    *   Test thoroughly: Send prompts that should trigger specific tools. Verify execution and results.

6.  **Basic Frontend UI:**
    *   **Agent Settings (`/app/[agent-id]/settings/page.tsx` or similar component):**
        *   Fetch all tools where `type='prebuilt'` and `visibility='public'` from `/api/tools` (needs a simple GET endpoint).
        *   Fetch the agent's current associated tools from `/api/agents/[agentId]/tools`.
        *   Render a section "Associated Tools".
        *   Use a multi-select component (e.g., `components/ui/multiselect`) populated with the available pre-built tools.
        *   Allow selecting/deselecting tools. On change/save, call the `POST`/`DELETE` endpoints created in Task 4.
    *   **Chat UI (`components/chat/message.tsx`):**
        *   Ensure rendering logic exists for message parts with `type: 'tool-invocation'`.
        *   Display the `toolName` and `args` when the call starts (`state: 'call'`).
        *   Display the `result` when execution finishes (`state: 'result'`). Keep it simple initially.

---

## Phase 2: Sequence Tool Definition & Execution

**Goal:** Allow users to define sequences of pre-built tools and enable AI execution via a runner.

**Tasks:**

1.  **Implement `sequenceRunner` Tool Locally:**
    *   Create file: `/lib/tools/sequenceRunner.ts`.
    *   Define parameters schema using Zod: `z.object({ sequence_tool_id: z.string().uuid(), initial_input: z.record(z.any()).optional() })`.
    *   Implement the `execute` function:
        *   Accepts `{ sequence_tool_id, initial_input }`.
        *   Use Drizzle to query the `tools` table: `db.select().from(tools).where(eq(tools.id, sequence_tool_id)).limit(1);`. Verify `type === 'sequence'`.
        *   Handle case where tool is not found or not a sequence.
        *   Parse the `definition` JSONB column from the fetched tool record. Validate its structure (e.g., using a Zod schema for the definition itself).
        *   Initialize execution state (e.g., `let context = { initial: initial_input, steps: {} };`).
        *   Initialize results/log array (e.g., `let executionLog = [];`).
        *   Import all local pre-built tools into this file (or have a central registry).
        *   Loop through `definition.steps`:
            *   Get `stepNumber`, `toolToRunId`, `inputMapping`, `outputDisplaySuccess`, `outputDisplayFailure`, `continueOnFailure`, `storeOutputAs`.
            *   Resolve input arguments for the step's tool based on `inputMapping` and the current `context`. Handle `initialInput`, `static`, and `previousStep` sources.
            *   Find the actual local pre-built tool function corresponding to `toolToRunId`.
            *   `try...catch` block around the execution:
                *   `const result = await prebuiltTool.execute(resolvedInputs);`
                *   Store `result` in `context.steps[storeOutputAs]`.
                *   Format success message using template and result. Add to `executionLog`.
            *   `catch (error)`:
                *   Format error message using template and error. Add to `executionLog`.
                *   If `!continueOnFailure`, break the loop and prepare final error result.
        *   Format the final result based on `definition.finalOutputMapping` or return the full `executionLog`.
        *   Return the final result/log.

2.  **API Endpoints for Creating/Managing Sequence Tools:**
    *   Location: `/app/api/tools/route.ts` and `/app/api/tools/[toolId]/route.ts`.
    *   `POST /api/tools`:
        *   Requires authentication.
        *   Accepts `{ name, description, visibility, type: 'sequence', definition: JSON, inputSchema: JSON }`.
        *   Validate the incoming `definition` and `inputSchema` JSON structures.
        *   Insert into the `tools` table, setting `creatorId` to the authenticated user's ID.
        *   Return the created tool ID/details.
    *   `GET /api/tools`: List available tools (e.g., public prebuilt + user's own sequences). Add filtering/pagination later.
    *   `GET /api/tools/[toolId]`: Fetch details of a specific tool. Add auth check based on visibility/creator.
    *   `PUT /api/tools/[toolId]`: Update a tool (name, description, definition, etc.). Add auth check.
    *   `DELETE /api/tools/[toolId]`: Delete a tool. Add auth check.

3.  **Frontend Sequence Builder UI:**
    *   Create route/page: `/tools/create` or `/tools/[toolId]/edit`.
    *   Use form components (`Input`, `Textarea`, `Select`, etc.).
    *   Fields for `name`, `description`, `visibility`.
    *   Field for `inputSchema` (start with simple JSON textarea, maybe CodeMirror).
    *   **Steps Builder:**
        *   Display steps in a list. Button to "Add Step".
        *   For each step:
            *   Dropdown to select `toolToRun` (populated by fetching tools where `type='prebuilt'`).
            *   UI for `inputMapping`: Add key-value pairs. For value, select source (Initial Input, Static Value, Previous Step Output) and provide corresponding key/value.
            *   Textareas for `outputDisplaySuccess`/`Failure` templates.
            *   Checkbox for `continueOnFailure`.
            *   Input for `storeOutputAs` variable name.
    *   On Save: Construct the `definition` and `inputSchema` JSON objects. Call `POST` or `PUT` to `/api/tools`. Handle API responses.

4.  **Enhance Chat API (`/app/api/chat/route.ts`):**
    *   Fetch associated sequence tool IDs/names/descriptions for the agent.
    *   Import the local `sequenceRunner` tool definition.
    *   Add the *local* `sequenceRunner` definition to the `toolsForModel` object passed to `streamText`.
    *   Add the *names/descriptions* (only) of the agent's associated sequence tools to `toolsForModel`.
    *   **Implement Mapping Logic:** This is critical. The exact implementation depends on how you process the stream/results from `streamText`.
        *   **Option A (If using `useChat` hook):** The `onToolCall` callback on the client might be suitable. If `toolCall.toolName` matches a known sequence tool name, *prevent default* and instead call a *new* API endpoint (e.g., `/api/chat/run-sequence`) that directly invokes the `sequenceRunner.execute` logic server-side, passing the `sequence_tool_id` and `args`. This bypasses the AI needing to call the runner directly but requires client-side logic and an extra endpoint.
        *   **Option B (Server-side interception):** Modify how `streamText` results are handled. If a `tool-call` part is detected for a tool known to be a sequence (by checking its type fetched earlier), *don't* immediately add it to the message history for the AI. Instead, trigger the `sequenceRunner.execute` function programmatically server-side with the mapped arguments (`sequence_tool_id`, `initial_input`). Once the runner finishes, add its result as a `tool-result` message to the history *before* letting the AI generate the final text response. This keeps logic server-side but requires careful handling of the `streamText` flow. *Option B is likely cleaner but more complex to implement correctly within the streaming context.*

5.  **Enhance Frontend Chat UI:**
    *   Update `message.tsx` to render the `executionLog` returned by the `sequenceRunner` in a user-friendly way (e.g., collapsible section showing each step's success/failure message).

---

## Phase 3: Refinements & Future Expansion

*   **Caching:** Implement caching (e.g., Redis, in-memory cache with TTL) for DB queries:
    *   Fetching tool lists (`/api/tools`).
    *   Fetching agent tool associations (`/api/agents/[agentId]/tools`).
    *   Fetching full sequence definitions within `sequenceRunner.execute`.
*   **Error Handling:** Improve error handling in `sequenceRunner` and API endpoints. Provide clearer feedback to the user.
*   **UI Improvements:** Enhance Sequence Builder (drag-and-drop steps?), improve chat rendering of tool execution.
*   **Input Schema Validation:** Use the `inputSchema` stored in the `tools` table to validate `initial_input` passed to the `sequenceRunner`.
*   **Testing:** Add unit tests for tool `execute` functions, sequence runner logic, and integration tests for API endpoints.
*   **API Tools:** Implement `type='api'` tools, storing definition details (URL, method, headers, body template) in the `definition` JSONB. Extend `sequenceRunner` or create an `apiRunner` if needed.
*   **Tool Visibility & Sharing:** Refine the `visibility` concept (e.g., organization-level sharing).
*   **Tool Versioning:** Consider adding versioning to tool definitions.
*   **Monitoring & Logging:** Add logging around tool execution and sequence running.

---

This plan provides a structured path from basic pre-built tools to user-defined sequences, keeping efficiency and future growth in mind.