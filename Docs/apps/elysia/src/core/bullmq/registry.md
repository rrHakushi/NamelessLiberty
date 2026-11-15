# registry.ts

- **Source**: [`core/bullmq/registry.ts`](../../../../../../apps/elysia/src/core/bullmq/registry.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `class BullMQRegistry` (L10)

Coordinates primary-only BullMQ worker startup and graceful shutdown across the cluster.

#### `registerWorker(worker)`: `void` (L17)
Registers an active worker for coordinated shutdown.

- **1.** `[Sequence]` Calls `this.workers.add`

#### `registerQueue(queue)`: `void` (L24)
Registers a queue for coordinated shutdown.

- **1.** `[Sequence]` Calls `this.queues.add`

#### `shutdownAll()`: `Promise<void>` (L31)
Gracefully shuts down all registered BullMQ workers and queues.

- **1.** `[If]` `this.workers.size > 0`
  - **1.1.** `[Sequence]` Calls `Promise.allSettled`
  - **1.2.** `[Sequence]` Calls `this.workers.clear`
- **2.** `[If]` `this.queues.size > 0`
  - **2.1.** `[Sequence]` Calls `Promise.allSettled`
  - **2.2.** `[Sequence]` Calls `this.queues.clear`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.wrk.ts](./base.wrk.md) ([[core/bullmq/base.wrk]]) — `BaseBullMQWorker`
- [core/bullmq/base.queue.ts](./base.queue.md) ([[core/bullmq/base.queue]]) — `BaseBullMQQueue`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [core/bullmq/base.wrk.ts](./base.wrk.md) ([[core/bullmq/base.wrk]]) — `BullMQRegistry`
- [index.ts](../../index.md) ([[index]]) — `BullMQRegistry`
