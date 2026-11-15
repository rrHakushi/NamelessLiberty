# index.ts

- **Source**: [`index.ts`](../../../../apps/elysia/src/index.ts)
- **Layer / Role**: Application Entrypoint

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [load-env.ts](./load-env.md) ([[load-env]])
- [core/bullmq/registry.ts](./core/bullmq/registry.md) ([[core/bullmq/registry]]) — `BullMQRegistry`
- [core/email/email.wrk.ts](./core/email/email.wrk.md) ([[core/email/email.wrk]]) — `emailWorker`
- [apps/borealis/sync/media.queue.ts](./apps/borealis/sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MediaQueueManager`
- [apps/carina/connections/connection-sync.queue.ts](./apps/carina/connections/connection-sync.queue.md) ([[apps/carina/connections/connection-sync.queue]]) — `ConnectionSyncQueueManager`
- [apps/carina/activity/activity.serv.ts](./apps/carina/activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `activityServ`
- [server.ts](./server.md) ([[server]]) — `app`, `App`, `startServer`

### External / Workspace Packages
- `node:cluster` — `cluster`
- `node:os` — `os`
- `node:process` — `process`
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- _None_
