# src/apps/borealis/sync

## Modules

| Module | Role | Routes | Exports |
| :--- | :--- | :--- | :--- |
| [media-entity.syncer.ts](./media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) | Media Syncer | 0 | `DiscoveredRelation`, `EntitySyncResult`, `mapRelationType`, `MediaEntitySyncer` |
| [media-preview.syncer.ts](./media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) | Media Syncer | 0 | `PreviewResult`, `mapAnimeFormat`, `mapMangaFormat`, `mapTvStatus` |
| [media.queue.ts](./media.queue.md) ([[apps/borealis/sync/media.queue]]) | BullMQ Queue Manager | 0 | `MEDIA_QUEUE_NAME`, `MediaType`, `MediaUpdateJobData`, `WeeklyCronJobData` |
| [media.wrk.ts](./media.wrk.md) ([[apps/borealis/sync/media.wrk]]) | BullMQ Background Worker | 0 | `executeMediaUpdate`, `processMediaJob`, `CreateMediaWorkerOptions`, `MediaSyncWorker` |
