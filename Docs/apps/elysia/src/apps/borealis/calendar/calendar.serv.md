# calendar.serv.ts

- **Source**: [`apps/borealis/calendar/calendar.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/calendar/calendar.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisCalendarServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface CalendarQuery` (L5)

### `type CalendarMediaType` (L12)

### `interface CalendarItem` (L21)

### `interface CalendarResponse` (L41)

### `class BorealisCalendarServ` extends `BaseService` (L67)

#### `getCalendar(query, userId)`: `Promise<CalendarResponse>` (L68)

- **1.** `[Sequence]` Define `now`, `defaultStart`, `defaultEnd`, `startParam`, `endParam`, `startDate`, `endDate`, `validStart`, `validEnd`
  ```typescript
  const now = new Date()
  const defaultStart = new Date( Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) )
  const defaultEnd = new Date( Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999) )
  const startParam = typeof query?.start === 'string' ? query.start : undefined
  const endParam = typeof query?.end === 'string' ? query.end : undefined
  const startDate = startParam ? new Date(startParam) : defaultStart
  const endDate = endParam ? new Date(endParam) : defaultEnd
  const validStart = isNaN(startDate.getTime()) ? defaultStart : startDate
  const validEnd = isNaN(endDate.getTime()) ? defaultEnd : endDate
  ```
- **2.** `[Sequence]` Calls `validStart.getUTCFullYear` and stores result as `startYear`
- **3.** `[Sequence]` Calls `validEnd.getUTCFullYear` and stores result as `endYear`
- **4.** `[Sequence]` Define `typesParam`, `rawTypes`, `isRequested`, `onlyInLists`, `currentUserId`
  ```typescript
  const typesParam = typeof query?.types === 'string' ? query.types : undefined
  const rawTypes = typesParam ? typesParam .toLowerCase() .split(',') .map((t) => t.trim()) .filter(Boolean) .map((t) => (TYPE_ALIAS_MAP[t] ?? t) as CalendarMediaType) ...
  const isRequested = (type: CalendarMediaType) => rawTypes.length === 0 || rawTypes.includes(type)
  const onlyInLists = query?.onlyInLists === true || query?.onlyInLists === 'true' || query?.onlyInLists === '1'
  const currentUserId = userId ?? null
  ```
- **5.** `[If]` `onlyInLists && !currentUserId`
  - **5.1.** `[Return]` 
    ```json
    {
      "success": true,
      "items": [],
      "meta": {
        "start": "<validStart.toISOString()>",
        "end": "<validEnd.toISOString()>",
        "total": 0,
        "counts": {
          "anime": 0,
          "manga": 0,
          "movie": 0,
          "tv": 0,
          "game": 0,
          "book": 0,
          "music": 0
        }
      }
    }
    ```
- **6.** `[Sequence]` Define `startKey`, `endKey`, `typesKey`, `userScope`, `cacheKey`
  ```typescript
  const startKey = validStart.toISOString().split('T')[0]
  const endKey = validEnd.toISOString().split('T')[0]
  const typesKey = rawTypes.slice().sort().join(',') || 'all'
  const userScope = onlyInLists && currentUserId ? `user:${currentUserId}` : 'public'
  const cacheKey = `calendar:${startKey}:${endKey}:${typesKey}:${userScope}`
  ```
- **7.** `[Return]`  — `await cache.getOrSet(cacheKey, async () => { const calendarItems: CalendarItem[] = [] // 5. Parallel database queries for all requested media types const [ userAnimeIds, userMangaIds, ..., CALENDAR_CACHE_TTL)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/utils/cache.ts](../../../core/utils/cache.md) ([[core/utils/cache]]) — `cache`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `toDate`

### Called By / Imported By
- [apps/borealis/calendar/calendar.ctrl.ts](./calendar.ctrl.md) ([[apps/borealis/calendar/calendar.ctrl]]) — `BorealisCalendarServ`
