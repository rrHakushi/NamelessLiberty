# freshness.ts

- **Source**: [`apps/borealis/_shared/freshness.ts`](../../../../../../../apps/elysia/src/apps/borealis/_shared/freshness.ts)
- **Layer / Role**: Module / Helper

## Exported Types, Methods & Algorithms

### `interface FreshnessRecord` (L7)

### `interface FreshnessEvaluation` (L18)

### `const THREE_MONTH_STATUSES` (L29)

Unified statuses considered finished: released or cancelled. Media with these statuses must be at least 3 calendar months old to be eligible for update.

### `function normalizeToStartOfDay` (L35)

Normalizes a date to midnight (00:00:00.000) so time of day is completely ignored in accordance with the day/month calendar difference rule.

- **1.** `[Sequence]` Define `d`
  ```typescript
  const d = new Date(date)
  ```
- **2.** `[Sequence]` Calls `d.setHours`
- **3.** `[Return]`  — `d`

### `function isRecordHydrated` (L45)

Checks if a record has completed its initial external provider data fetch. Stubs created with null provider timestamps are unhydrated and must always be fetched.

- **1.** `[Switch]` Branch on `mediaType`
  - **1.1.** `[Case]` Case `'ANIME'`
  - **1.2.** `[Case]` Case `'MANGA'`
    - **1.2.1.** `[Return]`  — `record.alUpdatedAt !== null && record.alUpdatedAt !== undefined && record.alUpdatedAt > 0`
  - **1.3.** `[Case]` Case `'TV'`
  - **1.4.** `[Case]` Case `'MOVIE'`
    - **1.4.1.** `[Return]`  — `record.tvdbUpdatedAt !== null && record.tvdbUpdatedAt !== undefined && record.tvdbUpdatedAt > 0`
  - **1.5.** `[Case]` Case `'BOOK'`
    - **1.5.1.** `[Return]`  — `record.googleBooksUpdatedAt !== null && record.googleBooksUpdatedAt !== undefined && record.googleBooksUpdatedAt > 0`
  - **1.6.** `[Case]` Case `'GAME'`
    - **1.6.1.** `[Return]`  — `record.igdbUpdatedAt !== null && record.igdbUpdatedAt !== undefined && record.igdbUpdatedAt > 0`
  - **1.7.** `[Case]` Case `'MUSIC'`
    - **1.7.1.** `[Return]`  — `record.deezerUpdatedAt !== null && record.deezerUpdatedAt !== undefined && record.deezerUpdatedAt > 0`
  - **1.8.** `[Case]` Default
    - **1.8.1.** `[Return]`  — `true`

### `function evaluateRecordFreshness` (L78)

Evaluates whether a media entity record is still fresh in the local database. Rules: - If record does not exist or has no updatedAt -> stale (must fetch). - If record is an unhydrated stub (missing provider sync timestamp) -> stale (must fetch initial payload). - Finished/Ended/Released/Published/Cancelled -> fresh unless ≥ 3 calendar months old. - Releasing/Upcoming/In Production/Unknown etc. -> fresh unless ≥ 7 calendar days old. - Date comparison normalizes both dates to start-of-day (ignoring time).

- **1.** `[If]` `!record || !record.updatedAt`
  - **1.1.** `[Return]` 
    ```json
    {
      "isFresh": false,
      "isHydrated": false,
      "statusGroup": "one-week",
      "reason": "Record does not exist or has no updatedAt timestamp"
    }
    ```
- **2.** `[Sequence]` Calls `isRecordHydrated` and stores result as `hydrated`
- **3.** `[If]` `!hydrated`
  - **3.1.** `[Return]` 
    ```json
    {
      "isFresh": false,
      "isHydrated": false,
      "statusGroup": "one-week",
      "reason": "Unhydrated stub (missing provider sync timestamp)"
    }
    ```
- **4.** `[Sequence]` Calls `normalizeToStartOfDay` and stores result as `today`
- **5.** `[Sequence]` Calls `normalizeToStartOfDay` and stores result as `lastUpdated`
- **6.** `[Sequence]` Calls `normalizeMediaStatus` and stores result as `normStatus`
- **7.** `[Sequence]` Calls `THREE_MONTH_STATUSES.has` and stores result as `isThreeMonthStatus`
- **8.** `[If]` `isThreeMonthStatus`
  - **8.1.** `[Sequence]` Define `targetDate`
    ```typescript
    const targetDate = new Date(lastUpdated)
    ```
  - **8.2.** `[Sequence]` Calls `targetDate.setMonth`
  - **8.3.** `[Sequence]` Define `isFresh`
    ```typescript
    const isFresh = today.getTime() < targetDate.getTime()
    ```
  - **8.4.** `[Return]` 
    ```json
    {
      "isFresh": "<isFresh>",
      "isHydrated": true,
      "statusGroup": "three-months",
      "reason": "<isFresh ? `Status \"${normStatus}\" is fresh until ${targetDate.toISOString().split('T')[0]}` : `Status \"${normStatus}\" reached 3-month threshold (${targetDate.toISOString().split('T')[0]})`>"
    }
    ```
- **9.** `[Else]` Otherwise
  - **9.1.** `[Sequence]` Define `targetDate`
    ```typescript
    const targetDate = new Date(lastUpdated)
    ```
  - **9.2.** `[Sequence]` Calls `targetDate.setDate`
  - **9.3.** `[Sequence]` Define `isFresh`
    ```typescript
    const isFresh = today.getTime() < targetDate.getTime()
    ```
  - **9.4.** `[Return]` 
    ```json
    {
      "isFresh": "<isFresh>",
      "isHydrated": true,
      "statusGroup": "one-week",
      "reason": "<isFresh ? `Status \"${normStatus || 'UNKNOWN'}\" is fresh until ${targetDate.toISOString().split('T')[0]}` : `Status \"${normStatus || 'UNKNOWN'}\" reached 1-week threshold (${targetDate.toISOString().split('T')[0]})`>"
    }
    ```

### `function getEntityFreshness` (L140)

Queries the database for a media item's timestamps and evaluates its freshness.

- **1.** `[Sequence]` Define `record`
  ```typescript
  let record: FreshnessRecord | null = null
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Switch]` Branch on `mediaType`
    - **2.1.1.** `[Case]` Case `'ANIME'`
    - **2.1.2.** `[Case]` Case `'MANGA'`
    - **2.1.3.** `[Case]` Case `'TV'`
    - **2.1.4.** `[Case]` Case `'MOVIE'`
    - **2.1.5.** `[Case]` Case `'BOOK'`
    - **2.1.6.** `[Case]` Case `'GAME'`
    - **2.1.7.** `[Case]` Case `'MUSIC'`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Warning]` Logs warning — `Failed to query ${mediaType} #${mediaId} for freshness check: ${err?.message || err}`
  - **3.2.** `[Return]` 
    ```json
    {
      "isFresh": false,
      "isHydrated": false,
      "statusGroup": "one-week",
      "reason": "Failed to query database"
    }
    ```
- **4.** `[Return]`  — `evaluateRecordFreshness(mediaType, record, now)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/sync/media.queue.ts](../sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MediaType`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `toDate`, `normalizeMediaStatus`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/sync/media-preview.syncer.ts](../sync/media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `evaluateRecordFreshness`
- [apps/borealis/sync/media.queue.ts](../sync/media.queue.md) ([[apps/borealis/sync/media.queue]]) — `getEntityFreshness`, `evaluateRecordFreshness`, `FreshnessRecord`
