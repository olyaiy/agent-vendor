# Resumable / Durable Chat Streams – Implementation Plan

> **Scope**: Introduce Redis-backed resumable streams using `resumable-stream` & `@upstash/redis` while changing only the files listed by the user:
> * `app/api/chat/route.ts`
> * `db/repository/chat-repository.ts`
> * `db/actions/chat-actions.tsx`
> * `components/chat.tsx`
> * `components/chat-mobile.tsx`
> * `app/agent/[agent-slug]/[chat-id]/page.tsx`
> * `app/agent/[agent-slug]/page.tsx`
>
> No other modules are modified unless explicitly mentioned here. All steps are additive or refactors that preserve current behaviour.

> Important Redis Credentials
Endpoints
TCP
rediss://default:Aa2sAAIjcDE5ZWMyNzA4YTQ2YzQ0YjNmYTYxYWU5MjUwYjllNzJhMnAxMA@musical-marmoset-44460.upstash.io:6379

https
https://musical-marmoset-44460.upstash.io


Token
Aa2sAAIjcDE5ZWMyNzA4YTQ2YzQ0YjNmYTYxYWU5MjUwYjllNzJhMnAxMA

---

## 0. High-level Flow After Migration
1. **POST** `/api/chat` gets a fresh `streamId`, records it (`ChatStream` table + Redis), then starts **streamText ➞ createDataStream ➞ resumableStream**.
2. Any client can **GET** `/api/chat?chatId=…` later. The handler finds the most recent `streamId` and calls `resumableStream()` to continue or fall back to the last assistant message.
3. On the client, `useChat()` exposes `experimental_resume`; `Chat` & `ChatMobile` call it once via `useAutoResume` when the last stored message is by **user**.

---

## 1. Dependencies & Tooling
| Task | Reason |
|------|--------|
| `pnpm add resumable-stream @upstash/redis` | Durable pub/sub and Redis client. |
| Create `lib/redis.ts` | Central Redis connection (reads env `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). |
| **Optional**: env example update | Document the two new env vars in `.env.example`. |

---

## 2. Database Migration (Drizzle)
**File**: `drizzle/0017_resumable_stream.sql`
```sql
CREATE TABLE "ChatStream" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"(id) ON DELETE CASCADE,
  "streamId" text NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "chat_stream_chat_idx" ON "ChatStream"("chatId");
```
*Purpose*: relational audit trail so we can trace historic streams even if Redis eviction occurs.

---

## 3. Shared Stream Context
**File (new)**: `app/api/chat/stream-context.ts`
```ts
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';

export const streamContext = createResumableStreamContext({ waitUntil: after });
```
*Purpose*: Single instance that coordinates publish/subscribe across requests.

---

## 4. chat-store Utilities
**File (new)**: `lib/chat-store.ts`
```ts
import { redis } from '@/lib/redis';

const KEY = (chatId: string) => `chat:${chatId}:streams`;

export async function appendStreamId({ chatId, streamId }: { chatId: string; streamId: string }) {
  // Add to the list & cap length to, say, last 5 ids.
  await redis.lpush(KEY(chatId), streamId);
  await redis.ltrim(KEY(chatId), 0, 4);
}

export async function loadStreams(chatId: string): Promise<string[]> {
  return (await redis.lrange(KEY(chatId), 0, -1)) ?? [];
}
```
*Purpose*: Tiny facade hiding Redis commands; keeps most-recent N streamIds.

---

## 5. Server-side Changes
### 5.1 `app/api/chat/route.ts`
1. `import { streamContext } from './stream-context'`.
2. **GET handler** (new):
   * Validate `chatId` QS.
   * `const streamIds = await loadStreams(chatId)`; pick `recentStreamId`.
   * `const stream = await streamContext.resumableStream(recentStreamId, () => emptyDataStream)`.
   * Fallback logic identical to doc (send last assistant message).
3. **POST handler** (augment existing logic):
   * `const streamId = generateId();`
   * `await appendStreamId({ chatId, streamId });` (and insert into `ChatStream` table via repository method, see §6).
   * Wrap current `streamText` in:
     ```ts
     const dataStream = createDataStream({
       execute: buffer => {
         const result = streamText({ /* all existing args */ });
         result.mergeIntoDataStream(buffer);
       },
     });
     return new Response(await streamContext.resumableStream(streamId, () => dataStream));
     ```
   * All credit/billing & DB writes stay inside `onFinish`.
4. Remove direct `console.timeEnd('Text streaming');` duplication – now executed inside wrapper.

### 5.2 Error handling remains the same – resumable-stream handles disconnects.

---

## 6. Repository Updates
### 6.1 `db/repository/chat-repository.ts`
* Add new table mapping using Drizzle types (mirror SQL above). Provide helpers:
  * `insertChatStream({ chatId, streamId })` – inserts a row.
  * `getRecentStreamId(chatId)` – returns the latest row’s `streamId`.
* These helpers are used **in addition** to Redis for auditing.

---

## 7. Server Actions
### 7.1 `db/actions/chat-actions.tsx`
* Export `appendStreamId` and `loadStreams` if we need them in actions (optional).
* No breaking change required; ensure tree-shaking.

---

## 8. Client-side Changes
### 8.1 `hooks/use-chat-manager.ts` (not in user list but internally used)
1. Replace `useChat` import line:
   ```ts
   const { messages, …, experimental_resume, data } = useChat({ id: chatId, … });
   ```
2. Expose `experimental_resume`, `data`, `setMessages` from hook so that components can auto-resume.

### 8.2 `hooks/use-auto-resume.ts` (new)
Add the utility exactly as in the doc.

### 8.3 `components/chat.tsx`
1. `import { useAutoResume } from '@/hooks/use-auto-resume';`
2. Destructure `experimental_resume`, `data`, `setMessages` from `useChatManager`.
3. Call `useAutoResume({ autoResume: true, initialMessages: messages, experimental_resume, data, setMessages });`

### 8.4 `components/chat-mobile.tsx`
Same three-line integration as desktop chat.

### 8.5 Notification UX (optional)
* Show small toast “Reconnected – continuing stream…” when resume starts (future enhancement).

---

## 9. Pages
### 9.1 `app/agent/[agent-slug]/[chat-id]/page.tsx`
* No major change; it already loads `initialMessages` from DB. The new resume logic will append additional tokens client-side.
### 9.2 `app/agent/[agent-slug]/page.tsx`
* Unchanged except that newly generated chat *will* get a `streamId` from POST.

---

## 10. Testing Checklist
1. **Unit**: mock Redis, assert `appendStreamId` caps length and order.
2. **Integration**:
   * Open chat, start long generation → refresh mid-way → content continues.
   * Simulate network drop (dev-tools offline) → restore → resume.
   * Second tab joins same chat during active stream, sees final message.
3. **Billing**: ensure `onFinish` still fires exactly once per POST request.
4. **Race conditions**: hammer resume endpoint while generation is ending – ensure no duplicate messages.

---

## 11. Rollback Strategy
* Feature flag (`RESUMABLE_STREAMS=0`). When disabled:
  * Skip `streamContext.resumableStream`, return `dataStream` directly.
  * Client skips `useAutoResume`.
* Database table is append-only; safe to leave in place.

---

## 12. Timeline & Responsibility Matrix
| Day | Task | Owner |
|-----|------|-------|
| 1 | Add deps, create migration | Backend |
| 2 | Implement server utils & POST refactor | Backend |
| 3 | Add GET handler + repo funcs | Backend |
| 4 | Client hook + Chat integration | Frontend |
| 5 | QA (manual + automated) | QA |
| 6 | Staging deploy, monitor | DevOps |
| 7 | Prod rollout behind flag | Lead Dev |

---

### Fin.  All code edits must follow the **minimal_changes** rules and be individually reviewed via PR. 