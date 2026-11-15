# connection-sync.queue.ts

- **Source**: [`apps/carina/connections/connection-sync.queue.ts`](../../../../../../../apps/elysia/src/apps/carina/connections/connection-sync.queue.ts)
- **Layer / Role**: BullMQ Queue Manager

## Exported Types, Methods & Algorithms

### `const SYNC_PROVIDERS` (L15)

### `function isProviderSupportedForMediaType` (L29)

Returns whether an external provider adapter supports updating a specific media category.

- **1.** `[Switch]` Branch on `provider`
  - **1.1.** `[Case]` Case `'ANILIST'`
  - **1.2.** `[Case]` Case `'MAL'`
  - **1.3.** `[Case]` Case `'HIKKA'`
    - **1.3.1.** `[Return]`  — `mediaType === 'ANIME' || mediaType === 'MANGA'`
  - **1.4.** `[Case]` Case `'MANGAUPDATES'`
  - **1.5.** `[Case]` Case `'MANGABAKA'`
    - **1.5.1.** `[Return]`  — `mediaType === 'MANGA' || mediaType === 'BOOK'`
  - **1.6.** `[Case]` Case `'SIMKL'`
    - **1.6.1.** `[Return]`  — `mediaType === 'ANIME' || mediaType === 'TV' || mediaType === 'MOVIE'`
  - **1.7.** `[Case]` Case `'TRAKT'`
    - **1.7.1.** `[Return]`  — `mediaType === 'TV' || mediaType === 'MOVIE'`
  - **1.8.** `[Case]` Case `'BANGUMI'`
    - **1.8.1.** `[Return]`  — `mediaType === 'ANIME' || mediaType === 'MANGA' || mediaType === 'BOOK' || mediaType === 'GAME' || mediaType === 'MUSIC'`
  - **1.9.** `[Case]` Default
    - **1.9.1.** `[Return]`  — `false`

### `interface EnqueueSyncOptions` (L58)

### `function getConnectionSyncQueue` (L103)

Returns a dedicated BullMQ queue for a specific connection provider. Queues are isolated per provider so outages and rate-limiting on one service never delay operations on others.

- **1.** `[Sequence]` Calls `providerQueues.get` and stores result as `wrapper`
- **2.** `[If]` `!wrapper`
  - **2.1.** `[Sequence]` Assign `wrapper`
    ```typescript
    wrapper = new ConnectionSyncProviderQueue(provider)
    ```
  - **2.2.** `[Sequence]` Calls `providerQueues.set`
- **3.** `[Return]`  — `wrapper.getQueue()`

### `class ConnectionSyncQueueManager` (L118)

#### `getQueue(provider)`: `Queue<ConnectionSyncJobData>` (L122)
Retrieves or initializes the provider's dedicated queue.

- **1.** `[Return]`  — `getConnectionSyncQueue(provider)`

#### `enqueueSyncJobs(options)`: `Promise<void>` (L131)
Enqueues connection sync jobs for each valid provider configured on the entry. Performs validation, resolves progress/status overrides, and dispatches to provider-specific BullMQ queues in fire-and-forget mode.

- **1.** `[Sequence]` Define `{ connections, userId, mediaType, mediaId, mediaTitle, entry }`
  ```typescript
  const { connections, userId, mediaType, mediaId, mediaTitle, entry } = options
  ```
- **2.** `[If]` `!connections || typeofconnections !== 'object'`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Sequence]` Calls `Object.keys` and stores result as `providerKeys`
- **4.** `[If]` `providerKeys.length === 0`
  - **4.1.** `[Return]`  — `void`
- **5.** `[Loop]` Iterate `const rawKey` over `providerKeys`
  - **5.1.** `[Sequence]` Define `normProvider`
    ```typescript
    const normProvider = rawKey.trim().toUpperCase() as ConnectionProvider
    ```
  - **5.2.** `[If]` `!SYNC_PROVIDERS.includes(normProvider)`
  - **5.3.** `[If]` `!isProviderSupportedForMediaType(normProvider, mediaType)`
  - **5.4.** `[Sequence]` Define `rawVal`, `rawConn`
    ```typescript
    const rawVal = connections[rawKey]
    let rawConn: any
    ```
  - **5.5.** `[If]` `typeofrawVal === 'number' || typeofrawVal === 'string'`
    - **5.5.1.** `[Sequence]` Assign `rawConn`
      ```typescript
      rawConn = { id: rawVal }
      ```
  - **5.6.** `[Else]` Otherwise
    - **5.6.1.** `[If]` `rawVal && typeofrawVal === 'object'`
      - **5.6.1.1.** `[Sequence]` Assign `rawConn`
        ```typescript
        rawConn = rawVal
        ```
    - **5.6.2.** `[Else]` Otherwise
  - **5.7.** `[If]` `rawConn.sync === false`
  - **5.8.** `[Sequence]` Define `rawMediaId`
    ```typescript
    const rawMediaId = rawConn.id ?? rawConn.slug ?? rawConn.simklId ?? rawConn.providerId ?? rawConn.malId ?? rawConn.anilistId ?? rawConn.bangumiId
    ```
  - **5.9.** `[If]` `rawMediaId === undefined || rawMediaId === null || String(rawMediaId).trim() === ''`
  - **5.10.** `[Sequence]` Define `isPureNumeric`, `providerMediaId`
    ```typescript
    const isPureNumeric = typeofrawMediaId === 'number' || typeofrawMediaId === 'string' && /^\d+$/.test(rawMediaId.trim())
    const providerMediaId: number | string = isPureNumeric ? Number(rawMediaId) : String(rawMediaId).trim()
    ```
  - **5.11.** `[If]` `typeofproviderMediaId === 'number' && Number.isNaN(providerMediaId) || providerMediaId <= 0`
  - **5.12.** `[Sequence]` Define `connStatus`
    ```typescript
    let connStatus = entry.status
    ```
  - **5.13.** `[If]` `rawConn.overrideStatus && rawConn.status`
    - **5.13.1.** `[Sequence]` Assign `connStatus`
      ```typescript
      connStatus = rawConn.status
      ```
  - **5.14.** `[Sequence]` Define `connProgress`
    ```typescript
    let connProgress = entry.progress
    ```
  - **5.15.** `[If]` `rawConn.progressOffset !== undefined && rawConn.progressOffset !== null`
    - **5.15.1.** `[Sequence]` Assign `connProgress`
      ```typescript
      connProgress = (entry.progress || 0) + Number(rawConn.progressOffset)
      ```
  - **5.16.** `[Else]` Otherwise
    - **5.16.1.** `[If]` `rawConn.overrideProgress && rawConn.progress !== undefined && rawConn.progress !== null`
      - **5.16.1.1.** `[Sequence]` Assign `connProgress`
        ```typescript
        connProgress = Number(rawConn.progress)
        ```
  - **5.17.** `[Sequence]` Define `connScore`
    ```typescript
    let connScore = entry.score
    ```
  - **5.18.** `[If]` `rawConn.score !== undefined && rawConn.score !== null`
    - **5.18.1.** `[Sequence]` Assign `connScore`
      ```typescript
      connScore = Number(rawConn.score)
      ```
  - **5.19.** `[Sequence]` Define `connStartedAt`
    ```typescript
    let connStartedAt = entry.startedAt
    ```
  - **5.20.** `[If]` `rawConn.overrideDates && rawConn.startedAt !== undefined`
    - **5.20.1.** `[Sequence]` Assign `connStartedAt`
      ```typescript
      connStartedAt = rawConn.startedAt
      ```
  - **5.21.** `[Sequence]` Define `connCompletedAt`
    ```typescript
    let connCompletedAt = entry.completedAt
    ```
  - **5.22.** `[If]` `rawConn.overrideDates && rawConn.completedAt !== undefined`
    - **5.22.1.** `[Sequence]` Assign `connCompletedAt`
      ```typescript
      connCompletedAt = rawConn.completedAt
      ```
  - **5.23.** `[Sequence]` Define `connNotes`
    ```typescript
    let connNotes = entry.notes
    ```
  - **5.24.** `[If]` `rawConn.notes !== undefined`
    - **5.24.1.** `[Sequence]` Assign `connNotes`
      ```typescript
      connNotes = rawConn.notes
      ```
  - **5.25.** `[Sequence]` Define `connRewatched`
    ```typescript
    let connRewatched = entry.rewatched
    ```
  - **5.26.** `[If]` `rawConn.rewatched !== undefined`
    - **5.26.1.** `[Sequence]` Assign `connRewatched`
      ```typescript
      connRewatched = Number(rawConn.rewatched)
      ```
  - **5.27.** `[Sequence]` Define `jobData`
    ```typescript
    const jobData: ConnectionSyncJobData = { userId, provider: normProvider, providerMediaId, mediaType, mediaId, mediaTitle, ...
    ```
  - **5.28.** `[Try]` Try block
    - **5.28.1.** `[Sequence]` Calls `this.getQueue` and stores result as `queue`
    - **5.28.2.** `[Sequence]` Calls `queue.add`
  - **5.29.** `[Catch]` Catch (`err`)
    - **5.29.1.** `[Warning]` Logs warning — `${c.red('⚠️ [Sync Enqueue Error]')}: Failed to enqueue ${normProvider} job for media #${mediaId}: ${err?.message || err}`

#### `initWorkers()`: `void` (L287)
Initializes all provider background workers.

- **1.** `[Sequence]` Calls `initConnectionWorkers`

#### `shutdown()`: `Promise<void>` (L294)
Graceful shutdown of all connection sync queues and workers.

- **1.** `[If]` `isShuttingDown`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Assign `isShuttingDown`
  ```typescript
  isShuttingDown = true
  ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `closeConnectionWorkers`
- **4.** `[Catch]` Catch (`err`)
- **5.** `[Loop]` Iterate `const [provider, wrapper]` over `providerQueues.entries()`
  - **5.1.** `[Try]` Try block
    - **5.1.1.** `[Sequence]` Calls `wrapper.close`
  - **5.2.** `[Catch]` Catch (`err`)
    - **5.2.1.** `[Warning]` Logs warning — `Error closing queue for ${provider}: ${err?.message || err}`
- **6.** `[Sequence]` Calls `providerQueues.clear`
- **7.** `[Sequence]` Assign `isShuttingDown`
  ```typescript
  isShuttingDown = false
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.queue.ts](../../../core/bullmq/base.queue.md) ([[core/bullmq/base.queue]]) — `BaseBullMQQueue`
- [apps/carina/connections/connection-sync.wrk.ts](./connection-sync.wrk.md) ([[apps/carina/connections/connection-sync.wrk]]) — `initConnectionWorkers`, `closeConnectionWorkers`, `ConnectionSyncJobData`

### External / Workspace Packages
- `bullmq` — `Queue`
- `@NamelessLiberty/db` — `ConnectionProvider`, `MediaType`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](../../borealis/lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `ConnectionSyncQueueManager`
- [index.ts](../../../index.md) ([[index]]) — `ConnectionSyncQueueManager`
