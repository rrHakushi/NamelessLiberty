# base.queue.ts

- **Source**: [`core/bullmq/base.queue.ts`](../../../../../../apps/elysia/src/core/bullmq/base.queue.ts)
- **Layer / Role**: BullMQ Queue Manager
- **Extended By**: [`EmailQueue`](../email/email.queue.md) ([[core/email/email.queue]])

## Exported Types, Methods & Algorithms

### `interface BaseQueueConfig` (L5)

### `class BaseBullMQQueue` (L15)

Abstract base class for BullMQ queues. Centralizes lazy Queue/QueueEvents initialization, exponential backoff defaults, bounded job retention, and repeatable schedule registration.

#### `constructor(config)` (L23)

- **1.** `[Sequence]` Assign `this.queueName`
  ```typescript
  this.queueName = config.queueName
  ```
- **2.** `[Sequence]` Assign `this.logger`
  ```typescript
  this.logger = new LogFactory(`BullMQ:Queue:${config.queueName}`)
  ```
- **3.** `[Sequence]` Assign `this.defaultJobOptions`
  ```typescript
  this.defaultJobOptions = { attempts: 3, backoff: { type: 'exponential', delay: 2000, }, removeOnComplete: { count: 200, age: 86400 }, ...
  ```

#### `getQueue()`: `Queue<TData, TResult>` (L41)
Returns (and lazily initializes) the underlying BullMQ `Queue` instance.

- **1.** `[If]` `this._queue`
  - **1.1.** `[Return]`  — `this._queue`
- **2.** `[Sequence]` Assign `this._queue`
  ```typescript
  this._queue = new Queue<TData, TResult>(this.queueName, { connection: getBullMQConnectionOptions(), defaultJobOptions: this.defaultJobOptions, })
  ```
- **3.** `[Sequence]` Calls `attachBullMQErrorHandler`
- **4.** `[Return]`  — `this._queue`

#### `getQueueEvents()`: `QueueEvents` (L57)
Returns (and lazily initializes) a `QueueEvents` listener for job telemetry.

- **1.** `[If]` `this._events`
  - **1.1.** `[Return]`  — `this._events`
- **2.** `[Sequence]` Assign `this._events`
  ```typescript
  this._events = new QueueEvents(this.queueName, { connection: getBullMQConnectionOptions(), })
  ```
- **3.** `[Sequence]` Calls `attachBullMQErrorHandler`
- **4.** `[Return]`  — `this._events`

#### `enqueue(name, data, opts)` (L72)
Enqueues a single job with merged default options.

- **1.** `[Return]`  — `await this.getQueue().add(name as any, data as any, { ...this.defaultJobOptions, ...opts, })`

#### `upsertRepeatable(jobId, name, data, repeat, opts)` (L83)
Registers or updates an idempotent repeatable/cron job with explicit timezone support.

- **1.** `[Sequence]` Define `normalizedRepeat`
  ```typescript
  const normalizedRepeat: RepeatOptions = { tz: 'UTC', ...repeat, }
  ```
- **2.** `[Return]`  — `await this.getQueue().add(name as any, data as any, { ...this.defaultJobOptions, ...opts, jobId, repeat: normalizedRepeat, } as any)`

#### `close()`: `Promise<void>` (L108)
Gracefully closes the Queue and QueueEvents connections.

- **1.** `[If]` `this._events`
  - **1.1.** `[Sequence]` Calls `this._events.close().catch`
  - **1.2.** `[Sequence]` Assign `this._events`
    ```typescript
    this._events = null
    ```
- **2.** `[If]` `this._queue`
  - **2.1.** `[Sequence]` Calls `this._queue.close().catch`
  - **2.2.** `[Sequence]` Assign `this._queue`
    ```typescript
    this._queue = null
    ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/redis.ts](./redis.md) ([[core/bullmq/redis]]) — `attachBullMQErrorHandler`, `getBullMQConnectionOptions`

### External / Workspace Packages
- `bullmq` — `Queue`, `QueueEvents`, `JobsOptions`, `RepeatOptions`
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/sync/media.queue.ts](../../apps/borealis/sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `BaseBullMQQueue`
- [apps/carina/connections/connection-sync.queue.ts](../../apps/carina/connections/connection-sync.queue.md) ([[apps/carina/connections/connection-sync.queue]]) — `BaseBullMQQueue`
- [core/bullmq/registry.ts](./registry.md) ([[core/bullmq/registry]]) — `BaseBullMQQueue`
- [core/email/email.queue.ts](../email/email.queue.md) ([[core/email/email.queue]]) — `BaseBullMQQueue`
