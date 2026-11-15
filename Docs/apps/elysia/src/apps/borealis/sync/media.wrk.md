# media.wrk.ts

- **Source**: [`apps/borealis/sync/media.wrk.ts`](../../../../../../../apps/elysia/src/apps/borealis/sync/media.wrk.ts)
- **Layer / Role**: BullMQ Background Worker
- **Inheritance**: `MediaSyncWorker extends BaseBullMQWorker`

## Exported Types, Methods & Algorithms

### `function executeMediaUpdate` (L20)

Updates a single media item record in the database. For weekly updates, depth is strictly 0 so only this specific item is updated without cascading to relations.

- **1.** `[Sequence]` Calls `performance.now` and stores result as `syncStart`
- **2.** `[Sequence]` Define `depthStr`
  ```typescript
  const depthStr = `Depth: ${depth}${maxDepth !== undefined ? ` (max: ${maxDepth})` : ''}`
  ```
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `MediaEntitySyncer.syncEntity` and stores result as `syncResult`
  - **3.2.** `[Sequence]` Calls `Math.round` and stores result as `elapsed`
  - **3.3.** `[If]` `syncResult.synced`
    - **3.3.1.** `[Sequence]` Define `currentDepth`, `effectiveMaxDepth`, `currentJobId`, `updatedLineage`
      ```typescript
      const currentDepth = depth
      const effectiveMaxDepth = maxDepth ?? Infinity
      const currentJobId = `media-update-${mediaType}-${mediaId}`
      const updatedLineage = [...lineage, currentJobId]
      ```
    - **3.3.2.** `[If]` `syncResult.discoveredRelations.length > 0 && currentDepth < effectiveMaxDepth`
      - **3.3.2.1.** `[Loop]` Iterate `const rel` over `syncResult.discoveredRelations`
        - **3.3.2.1.1.** `[Sequence]` Define `targetJobId`
          ```typescript
          const targetJobId = `media-update-${rel.targetType}-${rel.targetLocalId}`
          ```
        - **3.3.2.1.2.** `[If]` `updatedLineage.includes(targetJobId)`
        - **3.3.2.1.3.** `[Warning]` Logs warning — await MediaQueueManager.enqueueMediaUpdate(rel.targetType, rel.targetLocalId, { externalId: rel.targetExternalId, priority: 3, depth: currentDepth + 1, maxDepth, lineage: updatedLineage, triggeredBy: 'sync', ...).catch((err) => { logger.warn( `${c.red('⚠️ [Relation Enqueue Error]')}: Failed to enqueue relation ${rel.targetType} #${rel.targetLocalId}: ${err?.message || err}` ) })
    - **3.3.3.** `[Return]`  — `true`
  - **3.4.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **3.5.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnixSeconds`
  - **3.6.** `[Switch]` Branch on `mediaType`
    - **3.6.1.** `[Case]` Case `'ANIME'`
    - **3.6.2.** `[Case]` Case `'MANGA'`
    - **3.6.3.** `[Case]` Case `'TV'`
    - **3.6.4.** `[Case]` Case `'MOVIE'`
    - **3.6.5.** `[Case]` Case `'BOOK'`
    - **3.6.6.** `[Case]` Case `'GAME'`
    - **3.6.7.** `[Case]` Case `'MUSIC'`
    - **3.6.8.** `[Case]` Default
      - **3.6.8.1.** `[Error]` Throws `Error` — `Unsupported media type: ${mediaType}`
  - **3.7.** `[Return]`  — `true`
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Sequence]` Calls `logger.error`
  - **4.2.** `[Error]` Throws `err`

### `function processMediaJob` (L163)

Worker processor function handling jobs on the 'media-updates' queue.

- **1.** `[Sequence]` Define `data`
  ```typescript
  const data = job.data
  ```
- **2.** `[Sequence]` Calls `performance.now` and stores result as `jobStart`
- **3.** `[If]` `data.type === 'weekly-active-sync'`
  - **3.1.** `[If]` `Bun.env.BUN_ENV !== 'production'`
    - **3.1.1.** `[Return]`  — `true`
  - **3.2.** `[Sequence]` Calls `syncActiveMedia` and stores result as `stats`
  - **3.3.** `[Sequence]` Calls `Math.round` and stores result as `elapsed`
  - **3.4.** `[Return]`  — `true`
- **4.** `[If]` `data.type === 'media-update'`
  - **4.1.** `[Sequence]` Define `depth`, `maxDepth`, `lineage`
    ```typescript
    const depth = data.depth ?? 0
    const maxDepth = data.maxDepth
    const lineage = data.lineage ?? []
    ```
  - **4.2.** `[Sequence]` Calls `executeMediaUpdate` and stores result as `result`
  - **4.3.** `[Sequence]` Calls `Math.round` and stores result as `elapsed`
  - **4.4.** `[Return]`  — `result`
- **5.** `[Error]` Throws `Error` — `Unknown job data type: ${(data as any).type}`

### `interface CreateMediaWorkerOptions` (L209)

### `class MediaSyncWorker` extends `BaseBullMQWorker` (L213)

#### `constructor()` (L214)

- _No executable statements_

#### `processJob(job)`: `Promise<unknown>` (L225)

- **1.** `[Return]`  — `await processMediaJob(job)`

### `function getMediaSyncWorkerInstance` (L232)

- **1.** `[If]` `!mediaSyncWorkerInstance`
  - **1.1.** `[Sequence]` Assign `mediaSyncWorkerInstance`
    ```typescript
    mediaSyncWorkerInstance = new MediaSyncWorker()
    ```
- **2.** `[Return]`  — `mediaSyncWorkerInstance`

### `function createMediaWorker` (L239)

- **1.** `[Return]`  — `getMediaSyncWorkerInstance().start()`

### `function getMediaWorker` (L246)

Returns the singleton worker instance, initializing it if necessary.

- **1.** `[Return]`  — `getMediaSyncWorkerInstance().start()`

### `function closeMediaWorker` (L253)

Graceful shutdown for the media worker to prevent orphaned jobs.

- **1.** `[If]` `mediaSyncWorkerInstance`
  - **1.1.** `[Sequence]` Calls `mediaSyncWorkerInstance.shutdown`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/bullmq/base.wrk.ts](../../../core/bullmq/base.wrk.md) ([[core/bullmq/base.wrk]]) — `BaseBullMQWorker`
- [apps/borealis/sync/media.queue.ts](./media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MEDIA_QUEUE_NAME`, `syncActiveMedia`, `MediaQueueManager`, `MediaJobData`, `MediaType`
- [apps/borealis/sync/media-entity.syncer.ts](./media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `MediaEntitySyncer`

### External / Workspace Packages
- `bullmq` — `Worker`, `Job`
- `@NamelessLiberty/db` — `prisma`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/sync/media.queue.ts](./media.queue.md) ([[apps/borealis/sync/media.queue]]) — `getMediaWorker`, `closeMediaWorker`, `executeMediaUpdate`
