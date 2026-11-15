# src/core/bullmq

## Modules

| Module | Role | Routes | Exports |
| :--- | :--- | :--- | :--- |
| [base.queue.ts](./base.queue.md) ([[core/bullmq/base.queue]]) | BullMQ Queue Manager | 0 | `BaseQueueConfig`, `BaseBullMQQueue` |
| [base.wrk.ts](./base.wrk.md) ([[core/bullmq/base.wrk]]) | BullMQ Background Worker | 0 | `BaseWorkerConfig`, `BaseBullMQWorker` |
| [redis.ts](./redis.md) ([[core/bullmq/redis]]) | Core Infrastructure | 0 | `getBullMQConnectionOptions`, `isTransientSocketError`, `attachBullMQErrorHandler` |
| [registry.ts](./registry.md) ([[core/bullmq/registry]]) | Core Infrastructure | 0 | `BullMQRegistry` |
