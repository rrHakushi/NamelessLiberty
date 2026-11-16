# redis.ts

- **Source**: [`core/bullmq/redis.ts`](../../../../../../apps/elysia/src/core/bullmq/redis.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `function getBullMQConnectionOptions` (L10)

Parses and validates Redis environment variables for BullMQ queues and workers. Enforces `maxRetriesPerRequest: null` as required by BullMQ blocking commands.

- **1.** `[Sequence]` Define `host`, `portRaw`
  ```typescript
  const host = Bun.env.REDIS_HOST
  const portRaw = Bun.env.REDIS_PORT
  ```
- **2.** `[If]` `!host || !portRaw`
  - **2.1.** `[Error]` Throws `Error` — 'Missing required Redis environment variable(s): REDIS_HOST and/or REDIS_PORT'
- **3.** `[Sequence]` Calls `Number` and stores result as `port`
- **4.** `[If]` `!Number.isFinite(port) || port <= 0`
  - **4.1.** `[Error]` Throws `Error` — `Invalid REDIS_PORT value: ${portRaw}`
- **5.** `[Sequence]` Define `dbRaw`, `db`
  ```typescript
  const dbRaw = Bun.env.REDIS_DB
  const db = dbRaw !== undefined && dbRaw !== '' ? Number(dbRaw) : 0
  ```
- **6.** `[Return]` 
  ```json
  {
    "host": "<host>",
    "port": "<port>",
    "...Bun.env.REDIS_PASSWORD ? { password: Bun.env.REDIS_PASSWORD } : {}": "...",
    "db": "<Number.isFinite(db) ? db : 0>",
    "maxRetriesPerRequest": null,
    "enableReadyCheck": false,
    "retryStrategy": "<(times: number) => Math.min(times * 250, 5000)>"
  }
  ```

### `function isTransientSocketError` (L42)

Checks whether a Redis/BullMQ error is a transient socket reset that BullMQ reconnects automatically.

- **1.** `[Sequence]` Define `message`
  ```typescript
  const message = (err as Error)?.message || String(err || '')
  ```
- **2.** `[Return]`  — `message.includes('ECONNRESET') || message.includes('EPIPE') || message.includes('ETIMEDOUT') || message.includes('Connection is closed') || message.includes('Socket closed unexpectedly')`

### `function attachBullMQErrorHandler` (L56)

Attaches standard error logging to any BullMQ Queue, Worker, or QueueEvents emitter.

- **1.** `[Warning]` Logs warning — 'error', (err: Error) => { if (isTransientSocketError(err)) { logger.warn(`[${scope}] Transient Redis socket error (auto-reconnecting): ${err.message}`) return } logger.error(`[${scope}] BullMQ error:`, err) }

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `bullmq` — `ConnectionOptions`
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [core/bullmq/base.queue.ts](./base.queue.md) ([[core/bullmq/base.queue]]) — `attachBullMQErrorHandler`, `getBullMQConnectionOptions`
- [core/bullmq/base.wrk.ts](./base.wrk.md) ([[core/bullmq/base.wrk]]) — `attachBullMQErrorHandler`, `getBullMQConnectionOptions`
- [core/email/email.queue.ts](../email/email.queue.md) ([[core/email/email.queue]]) — `getBullMQConnectionOptions`
