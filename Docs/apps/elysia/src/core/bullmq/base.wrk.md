# base.wrk.ts

- **Source**: [`core/bullmq/base.wrk.ts`](../../../../../../apps/elysia/src/core/bullmq/base.wrk.ts)
- **Layer / Role**: BullMQ Background Worker
- **Extended By**: [`MediaSyncWorker`](../../apps/borealis/sync/media.wrk.md) ([[apps/borealis/sync/media.wrk]]), [`ConnectionProviderWorker`](../../apps/carina/connections/connection-sync.wrk.md) ([[apps/carina/connections/connection-sync.wrk]]), [`EmailWorker`](../email/email.wrk.md) ([[core/email/email.wrk]])

## Exported Types, Methods & Algorithms

### `interface BaseWorkerConfig` (L6)

### `class BaseBullMQWorker` (L20)

Abstract base class for BullMQ workers. Provides standardized lifecycle management, `active`/`completed`/`failed`/`stalled`/`error` instrumentation, and coordinated graceful shutdown via `BullMQRegistry`.

#### `constructor(config)` (L27)

- **1.** `[Sequence]` Assign `this.queueName`
  ```typescript
  this.queueName = config.queueName
  ```
- **2.** `[Sequence]` Assign `this.config`
  ```typescript
  this.config = config
  ```
- **3.** `[Sequence]` Assign `this.logger`
  ```typescript
  this.logger = new LogFactory(`BullMQ:Worker:${config.queueName}`)
  ```

#### `start()`: `Worker<TData, TResult>` (L41)
Starts the BullMQ Worker if not already running and registers it for shutdown.

- **1.** `[If]` `this._worker`
  - **1.1.** `[Return]`  — `this._worker`
- **2.** `[Sequence]` Assign `this._worker`
  ```typescript
  this._worker = new Worker<TData, TResult>( this.queueName, async (job) => await this.processJob(job), { connection: getBullMQConnectionOptions(), concurrency: this.config.concurrency ?? 2, ...(this.config.limiter ? { limiter: this.config.limiter } : {}), ...
  ```
- **3.** `[Sequence]` Calls `attachBullMQErrorHandler`
- **4.** `[Sequence]` Calls `this._worker.on`
- **5.** `[Sequence]` Calls `this._worker.on`
- **6.** `[Warning]` Logs warning — 'stalled', (jobId) => { this.logger.warn(`Job ${jobId} stalled and will be reprocessed`) }
- **7.** `[Sequence]` Calls `BullMQRegistry.registerWorker`
- **8.** `[Sequence]` Calls `this.logger.info`
- **9.** `[Return]`  — `this._worker`

#### `isRunning()`: `boolean` (L84)
Returns true if the worker is currently instantiated.

- **1.** `[Return]`  — `this._worker !== null`

#### `shutdown()`: `Promise<void>` (L91)
Gracefully pauses intake and drains in-flight jobs before closing the Redis connection.

- **1.** `[If]` `!this._worker`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Define `worker`
  ```typescript
  const worker = this._worker
  ```
- **3.** `[Sequence]` Assign `this._worker`
  ```typescript
  this._worker = null
  ```
- **4.** `[Try]` Try block
  - **4.1.** `[Sequence]` Calls `worker.pause().catch`
  - **4.2.** `[Sequence]` Calls `worker.close`
  - **4.3.** `[Sequence]` Calls `this.logger.info`
- **5.** `[Catch]` Catch (`err`)
  - **5.1.** `[Sequence]` Calls `this.logger.error`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/redis.ts](./redis.md) ([[core/bullmq/redis]]) — `attachBullMQErrorHandler`, `getBullMQConnectionOptions`
- [core/bullmq/registry.ts](./registry.md) ([[core/bullmq/registry]]) — `BullMQRegistry`

### External / Workspace Packages
- `bullmq` — `Worker`, `Job`, `WorkerOptions`
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/sync/media.wrk.ts](../../apps/borealis/sync/media.wrk.md) ([[apps/borealis/sync/media.wrk]]) — `BaseBullMQWorker`
- [apps/carina/connections/connection-sync.wrk.ts](../../apps/carina/connections/connection-sync.wrk.md) ([[apps/carina/connections/connection-sync.wrk]]) — `BaseBullMQWorker`
- [core/bullmq/registry.ts](./registry.md) ([[core/bullmq/registry]]) — `BaseBullMQWorker`
- [core/email/email.wrk.ts](../email/email.wrk.md) ([[core/email/email.wrk]]) — `BaseBullMQWorker`
