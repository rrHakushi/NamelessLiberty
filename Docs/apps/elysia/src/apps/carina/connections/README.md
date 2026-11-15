# src/apps/carina/connections

## Modules

| Module | Role | Routes | Exports |
| :--- | :--- | :--- | :--- |
| [connection-sync.queue.ts](./connection-sync.queue.md) ([[apps/carina/connections/connection-sync.queue]]) | BullMQ Queue Manager | 0 | `SYNC_PROVIDERS`, `isProviderSupportedForMediaType`, `EnqueueSyncOptions`, `getConnectionSyncQueue` |
| [connection-sync.wrk.ts](./connection-sync.wrk.md) ([[apps/carina/connections/connection-sync.wrk]]) | BullMQ Background Worker | 0 | `ConnectionSyncJobData`, `PROVIDER_DISPLAY_NAMES`, `PROVIDER_WORKER_CONFIGS`, `ProcessConnectionSyncJobDeps` |
| [connections.ctrl.ts](./connections.ctrl.md) ([[apps/carina/connections/connections.ctrl]]) | Controller (HTTP / WS Routes) | 12 | `carinaConnections` |
| [connections.serv.ts](./connections.serv.md) ([[apps/carina/connections/connections.serv]]) | Service (Business Logic) | 0 | `CarinaConnectionsServ` |
