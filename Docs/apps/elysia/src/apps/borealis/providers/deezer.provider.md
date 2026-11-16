# deezer.provider.ts

- **Source**: [`apps/borealis/providers/deezer.provider.ts`](../../../../../../../apps/elysia/src/apps/borealis/providers/deezer.provider.ts)
- **Layer / Role**: External Metadata Provider
- **Inheritance**: `DeezerProvider extends BaseMediaProvider`

## Exported Types, Methods & Algorithms

### `interface DeezerTrackPayload` (L6)

### `interface DeezerAlbumPayload` (L28)

### `class DeezerProvider` extends `BaseMediaProvider` (L47)

#### `constructor()` (L48)

- _No executable statements_

#### `waitForRateLimit()`: `Promise<void>` (L55)

- **1.** `[Sequence]` Calls `Date.now` and stores result as `now`
- **2.** `[Sequence]` Define `elapsed`
  ```typescript
  const elapsed = now - this.lastRequestTime
  ```
- **3.** `[If]` `elapsed < this.minDelayMs`
- **4.** `[Sequence]` Assign `this.lastRequestTime`
  ```typescript
  this.lastRequestTime = Date.now()
  ```

#### `fetchJson(endpoint)`: `Promise<T | null>` (L64)

- **1.** `[Sequence]` Calls `this.waitForRateLimit`
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Define `url`
    ```typescript
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    ```
  - **2.2.** `[Sequence]` Calls `fetch` and stores result as `res`
  - **2.3.** `[If]` `!res.ok`
    - **2.3.1.** `[Return]`  — `null`
  - **2.4.** `[Sequence]` Calls `res.json` and stores result as `data`
  - **2.5.** `[If]` `typeofdata === 'object' && data !== null && 'error' in data`
    - **2.5.1.** `[Return]`  — `null`
  - **2.6.** `[Return]`  — `data as T`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Return]`  — `null`

#### `searchTracks(query, limit = 25)`: `Promise<DeezerTrackPayload[]>` (L83)

- **1.** `[Sequence]` Calls `this.fetchJson` and stores result as `res`
- **2.** `[Return]`  — `res?.data ?? []`

#### `searchAlbums(query, limit = 25)`: `Promise<DeezerAlbumPayload[]>` (L90)

- **1.** `[Sequence]` Calls `this.fetchJson` and stores result as `res`
- **2.** `[Return]`  — `res?.data ?? []`

#### `getTrack(id)`: `Promise<DeezerTrackPayload | null>` (L97)

- **1.** `[Return]`  — `this.fetchJson(`/track/${id}`)`

#### `getAlbum(id)`: `Promise<DeezerAlbumPayload | null>` (L101)

- **1.** `[Return]`  — `this.fetchJson(`/album/${id}`)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-provider.ts](../_shared/base-provider.md) ([[apps/borealis/_shared/base-provider]]) — `BaseMediaProvider`

### External / Workspace Packages
- `@NamelessLiberty/logger` — `LogFactory`

### Called By / Imported By
- [apps/borealis/providers/index.ts](./index.md) ([[apps/borealis/providers/index]]) — `DeezerProvider`
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `DeezerTrackPayload`, `DeezerAlbumPayload`
