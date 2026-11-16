# base-syncer.ts

- **Source**: [`apps/borealis/_shared/base-syncer.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/base-syncer.ts)
- **Layer / Role**: Module / Helper
- **Extended By**: [`MediaEntitySyncer`](../sync/media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]), [`MediaPreviewSyncer`](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]])

## Exported Types, Methods & Algorithms

### `class BaseMediaSyncer` (L6)

Abstract base class for Borealis entity and preview synchronization engines.

#### `constructor(syncerName)` (L9)

- **1.** `[Sequence]` Assign `this.logger`
  ```typescript
  this.logger = new LogFactory(`Syncer:${syncerName}`)
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/sync/media-entity.syncer.ts](../sync/media-entity.syncer.md) ([[apps/borealis/sync/media-entity.syncer]]) — `BaseMediaSyncer`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `BaseMediaSyncer`
