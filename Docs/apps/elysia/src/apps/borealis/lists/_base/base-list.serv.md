# base-list.serv.ts

- **Source**: [`apps/borealis/lists/_base/base-list.serv.ts`](../../../../../../../../apps/elysia/src/apps/borealis/lists/_base/base-list.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BaseBorealisListService extends BaseService`
- **Extended By**: [`BorealisListsServ`](../lists.serv.md) ([[apps/borealis/lists/lists.serv]])

## Exported Types, Methods & Algorithms

### `class BaseBorealisListService` extends `BaseService` (L7)

Abstract base service for Borealis user list CRUD, sync, and import/export workflows.

#### `constructor(loggerName = 'BorealisListsServ')` (L8)
Abstract base service for Borealis user list CRUD, sync, and import/export workflows.

- _No executable statements_

#### `validateRemoteImportUrl(rawUrl)`: `Promise<URL>` (L15)
Validates an external import/export URL against private IP / localhost SSRF targets.

- **1.** `[Return]`  — `await assertSafeExternalUrl(rawUrl)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/network.ts](../../../../core/utils/network.md) ([[core/utils/network]]) — `assertSafeExternalUrl`

### External / Workspace Packages
- _None_

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](../lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `BaseBorealisListService`
