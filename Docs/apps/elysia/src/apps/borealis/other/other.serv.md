# other.serv.ts

- **Source**: [`apps/borealis/other/other.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/other/other.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisOtherServ extends BaseBorealisMediaService`

## Exported Types, Methods & Algorithms

### `class BorealisOtherServ` extends `BaseBorealisMediaService` (L22)

#### `getCatalog(query)` (L26)
Get public catalog of custom items with pagination and filters.

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `search`
  ```typescript
  const skip = query?.cursor ? 0 : (page - 1) * limit
  const search = query?.search?.trim()
  ```
- **4.** `[Sequence]` Calls `parseList` and stores result as `formats`
- **5.** `[Sequence]` Define `sortBy`, `sortOrder`
  ```typescript
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'title' ? 'asc' : 'desc'
  ```
- **6.** `[Sequence]` Database `query` on `Other` and stores it as `q`
- **7.** `[If]` `search`
  - **7.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => or( m.titlePrimary.ilike(`%${search}%`), m.titleSecondary.ilike(`%${search}%`) ) )
    ```
- **8.** `[If]` `formats.length > 0`
  - **8.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => m.format.in(formats))
    ```
- **9.** `[If]` `query?.cursor`
  - **9.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((m) => sortOrder === 'asc' ? m.id.gt(query.cursor!) : m.id.lt(query.cursor!) )
    ```
- **10.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **11.** `[If]` `sortBy === 'score'`
  - **11.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.averageScore.asc() : x.averageScore.desc() )
    ```
- **12.** `[Else]` Otherwise
  - **12.1.** `[If]` `sortBy === 'title'`
    - **12.1.1.** `[Sequence]` Assign `itemsQ`
      ```typescript
      itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.titlePrimary.asc() : x.titlePrimary.desc() )
      ```
  - **12.2.** `[Else]` Otherwise
    - **12.2.1.** `[If]` `sortBy === 'releaseDate'`
      - **12.2.1.1.** `[Sequence]` Assign `itemsQ`
        ```typescript
        itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.startDate.asc() : x.startDate.desc() )
        ```
    - **12.2.2.** `[Else]` Otherwise
      - **12.2.2.1.** `[If]` `sortBy === 'favorites'`
        - **12.2.2.1.1.** `[Sequence]` Assign `itemsQ`
          ```typescript
          itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.favorites.asc() : x.favorites.desc() )
          ```
      - **12.2.2.2.** `[Else]` Otherwise
        - **12.2.2.2.1.** `[If]` `sortBy === 'updatedAt'`
          - **12.2.2.2.1.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.updatedAt.asc() : x.updatedAt.desc() )
            ```
        - **12.2.2.2.2.** `[Else]` Otherwise
          - **12.2.2.2.2.1.** `[Sequence]` Assign `itemsQ`
            ```typescript
            itemsQ = itemsQ.orderBy((x) => sortOrder === 'asc' ? x.popularity.asc() : x.popularity.desc() )
            ```
- **13.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawItems]`
- **14.** `[Sequence]` Define `items`, `nextCursor`, `hasMore`
  ```typescript
  const items = rawItems.map((m: any) => ({ id: m.id, titlePrimary: m.titlePrimary, titleSecondary: m.titleSecondary ?? null, titleNative: m.titleSecondary ?? null, coverImage: m.coverImage ?? null, bannerImage: m.bannerImage ?? null, ...)
  const nextCursor = items.length === limit ? items[items.length - 1]!.id : null
  const hasMore = query?.cursor ? nextCursor !== null : skip + limit < total
  ```
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items>",
    "nextCursor": "<nextCursor>",
    "hasMore": "<hasMore>",
    "total": "<total>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit)>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getFilters()` (L124)
Get available catalog filters for other items.

- **1.** `[Sequence]` Database `all` on `Other` and stores it as `allPublished`
- **2.** `[Sequence]` Define `formatCounts`, `yearCounts`
  ```typescript
  const formatCounts: Record<string, number> = {}
  const yearCounts: Record<number, number> = {}
  ```
- **3.** `[Loop]` Iterate `const item` over `allPublished`
  - **3.1.** `[If]` `item.format`
    - **3.1.1.** `[Sequence]` Assign `formatCounts[item.format]`
      ```typescript
      formatCounts[item.format] = (formatCounts[item.format] || 0) + 1
      ```
  - **3.2.** `[If]` `item.startDate`
    - **3.2.1.** `[Sequence]` Calls `toDate(item.startDate).getFullYear` and stores result as `y`
    - **3.2.2.** `[Sequence]` Assign `yearCounts[y]`
      ```typescript
      yearCounts[y] = (yearCounts[y] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "statuses": [
      {
        "value": "PUBLISHED",
        "count": "<allPublished.length>"
      }
    ],
    "formats": "<Object.entries(formatCounts).map(([value, count]) => ({ value, count }))>",
    "genres": [],
    "years": "<Object.entries(yearCounts).map(([value, count]) => ({ value: Number(value), count })).sort((a, b) => b.value - a.value)>"
  }
  ```

#### `createItem(userId, body, isAdmin)` (L156)
Create a custom trackable catalog item. Standard users are capped at 500 created items; ADMINISTRATOR users are unlimited.

- **1.** `[If]` `!isAdmin`
  - **1.1.** `[Sequence]` Database `query` on `Other` and stores it as `existingCount`
  - **1.2.** `[If]` `existingCount >= 500`
    - **1.2.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You have reached the maximum limit of 500 custom items. Administrator permission is required to create more.'
- **2.** `[If]` `!body.progressFields || body.progressFields.length === 0`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'At least one progress field must be defined.'
- **3.** `[Sequence]` Define `fieldKeys`
  ```typescript
  const fieldKeys = new Set(body.progressFields.map((f) => f.key))
  ```
- **4.** `[If]` `!fieldKeys.has(body.incrementFieldKey)`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Designated incrementFieldKey "${body.incrementFieldKey}" must match one of the defined progress field keys.`
- **5.** `[Sequence]` Define `startDate`, `endDate`, `format`
  ```typescript
  const startDate = body.startDate ? new Date(body.startDate) : null
  const endDate = body.endDate ? new Date(body.endDate) : null
  const format = body.format ? body.format.trim().toLowerCase() : null
  ```
- **6.** `[Sequence]` Database `create` on `Other` and stores it as `created`
- **7.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "item": "<item>"
  }
  ```

#### `getItem(otherId, currentUserId, isAdmin = false)` (L212)
Get single custom item by ID.

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **2.** `[If]` `!item`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **3.** `[If]` `!item.isPublished && item.creatorId !== currentUserId && !isAdmin`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "item": "<item>"
  }
  ```

#### `updateItem(userId, otherId, body, isAdmin = false)` (L238)
Update an existing custom item. If the item is published and tracked by other users, creates a pre-update snapshot and dispatches interactive notifications to tracking users with a one-click fork option.

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **3.** `[If]` `existing.creatorId !== userId && !isAdmin`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the creator or an administrator can edit this item'
- **4.** `[Sequence]` Define `progressFields`, `incrementFieldKey`
  ```typescript
  const progressFields = body.progressFields ?? existing.progressFields as any
  const incrementFieldKey = body.incrementFieldKey ?? existing.incrementFieldKey
  ```
- **5.** `[If]` `body.progressFields || body.incrementFieldKey`
  - **5.1.** `[If]` `!progressFields || progressFields.length === 0`
    - **5.1.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'At least one progress field must be defined.'
  - **5.2.** `[Sequence]` Define `fieldKeys`
    ```typescript
    const fieldKeys = new Set(progressFields.map((f: any) => f.key))
    ```
  - **5.3.** `[If]` `incrementFieldKey && !fieldKeys.has(incrementFieldKey)`
    - **5.3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Designated incrementFieldKey "${incrementFieldKey}" must match one of the defined progress field keys.`
- **6.** `[Sequence]` Database `all` on `OtherList` and stores it as `trackers`
- **7.** `[Sequence]` Define `preUpdateSnapshot`
  ```typescript
  let preUpdateSnapshot = existing.preUpdateSnapshot
  ```
- **8.** `[If]` `existing.isPublished && trackers.length > 0`
  - **8.1.** `[Sequence]` Assign `preUpdateSnapshot`
    ```typescript
    preUpdateSnapshot = { titlePrimary: existing.titlePrimary, titleSecondary: existing.titleSecondary, description: existing.description, coverImage: existing.coverImage, bannerImage: existing.bannerImage, format: existing.format, ...
    ```
  - **8.2.** `[Loop]` Iterate `const tracker` over `trackers`
    - **8.2.1.** `[Try]` Try block
      - **8.2.1.1.** `[Sequence]` Calls `CarinaNotificationsServ.createNotification`
    - **8.2.2.** `[Catch]` Catch (`err`)
      - **8.2.2.1.** `[Warning]` Logs warning — `[OtherServ] Failed to send update notification to user ${tracker.userId}:`, err
- **9.** `[Sequence]` Database `update` on `Other`
- **10.** `[Sequence]` Database `first` on `Other` and stores it as `updated`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "item": "<updated>"
  }
  ```

#### `deleteItem(userId, otherId, isAdmin = false)` (L381)
Delete custom item. STRICT INTEGRITY: If any user other than creator has it in their list or favorited, deletion is strictly blocked (even for admins).

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **3.** `[If]` `existing.creatorId !== userId && !isAdmin`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the creator or an administrator can delete this item'
- **4.** `[Sequence]` Database `query` on `OtherList` and stores it as `otherUserTrackingCount`
- **5.** `[Sequence]` Database `query` on `Favorite` and stores it as `otherUserFavoriteCount`
- **6.** `[Sequence]` Database `all` on `CustomList` and stores it as `userCustomLists`
- **7.** `[Sequence]` Define `userCustomListIds`
  ```typescript
  const userCustomListIds = userCustomLists.map((cl) => cl.id)
  ```
- **8.** `[Sequence]` Database `query` on `CustomListEntry` and stores it as `customListEntryQuery`
- **9.** `[Sequence]` Calls `countOf` and stores result as `otherUserCustomListCount`
- **10.** `[If]` `otherUserTrackingCount > 0 || otherUserFavoriteCount > 0 || otherUserCustomListCount > 0`
  - **10.1.** `[Error]` Throws `Conflict` (HTTP 409) — 'This item cannot be deleted because other users have it tracked in their list, favorited, or in a custom list.'
- **11.** `[Sequence]` Calls `prisma.transaction`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Item removed successfully"
  }
  ```

#### `forkItem(userId, otherId, isAdmin = false)` (L456)
Fork pre-update snapshot (or current item) into a new private item for the requesting user, and repoint their list entry to the new private item.

- **1.** `[If]` `!isAdmin`
  - **1.1.** `[Sequence]` Database `query` on `Other` and stores it as `existingCount`
  - **1.2.** `[If]` `existingCount >= 500`
    - **1.2.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You have reached the maximum limit of 500 custom items. Administrator permission is required to create more.'
- **2.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **3.** `[If]` `!item`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **4.** `[Sequence]` Define `snapshot`
  ```typescript
  const snapshot = item.preUpdateSnapshot as any || item
  ```
- **5.** `[Sequence]` Database `create` on `Other` and stores it as `cloned`
- **6.** `[Sequence]` Define `updatedEntry`
  ```typescript
  let updatedEntry: any = null
  ```
- **7.** `[Sequence]` Database `first` on `OtherList` and stores it as `existingListEntry`
- **8.** `[If]` `existingListEntry`
  - **8.1.** `[Sequence]` Database `delete` on `OtherList`
  - **8.2.** `[Sequence]` Assign `updatedEntry`
    ```typescript
    updatedEntry = await prisma.orm.public.OtherList.create({ userId, otherId: cloned.id, status: existingListEntry.status, progressValues: existingListEntry.progressValues as any, score: existingListEntry.score, notes: existingListEntry.notes, ...
    ```
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Item copied successfully to your private items",
    "item": "<cloned>",
    "entry": "<updatedEntry>"
  }
  ```

#### `uploadAsset(userId, file, type)` (L526)
Upload and optimize an asset file (cover or banner) <= 1MB. Converts to WebP format with sharp.

- **1.** `[Sequence]` Define `allowedTypes`
  ```typescript
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ```
- **2.** `[If]` `!allowedTypes.includes(file.type)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Unsupported file format. Please upload JPEG, PNG, WebP, or GIF.'
- **3.** `[Sequence]` Define `maxSizeBytes`
  ```typescript
  const maxSizeBytes = 1 * 1024 * 1024
  ```
- **4.** `[If]` `file.size > maxSizeBytes`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'File size exceeds the 1MB limit.'
- **5.** `[Sequence]` Calls `Buffer.from` and stores result as `rawBuffer`
- **6.** `[Sequence]` Calls `new Bun.Image(rawBuffer).webp({ quality: 85 }).toBuffer` and stores result as `webpBuffer`
- **7.** `[Sequence]` Define `key`
  ```typescript
  const key = `borealis/other/${userId}/${type}-${Date.now()}.webp`
  ```
- **8.** `[Sequence]` Calls `uploadPublicAsset` and stores result as `{ publicUrl }`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "url": "<publicUrl>"
  }
  ```

#### `getStats(otherId)` (L560)
Get stats for custom item.

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **2.** `[If]` `!item`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "stats": {
      "averageScore": "<item.averageScore ?? null>",
      "favorites": "<item.favorites ?? 0>",
      "popularity": "<item.popularity ?? 0>",
      "scoreDistribution": "<item.scoreDistribution ?? {}>",
      "statusDistribution": "<item.statusDistribution ?? {}>"
    }
  }
  ```

#### `getFriends(otherId, currentUserId)` (L581)
Get friends tracking this custom item.

- **1.** `[If]` `!currentUserId`
  - **1.1.** `[Return]` 
    ```json
    {
      "success": true,
      "friends": []
    }
    ```
- **2.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **3.** `[If]` `!item`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **4.** `[Sequence]` Database `all` on `Friend` and stores it as `userFriends`
- **5.** `[Sequence]` Define `friendIds`
  ```typescript
  const friendIds = userFriends.map((f) => f.friendId)
  ```
- **6.** `[If]` `friendIds.length === 0`
  - **6.1.** `[Return]` 
    ```json
    {
      "success": true,
      "friends": []
    }
    ```
- **7.** `[Sequence]` Database `all` on `OtherList` and stores it as `rawEntries`
- **8.** `[Sequence]` Define `friends`
  ```typescript
  const friends = rawEntries.map((raw: any) => { const profile = getProfileCustomization(raw.user?.customization) const primary = item.incrementFieldKey ? (raw.progressValues as any)?.[item.incrementFieldKey] ?? null : null return { id: raw.id, ...)
  ```
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "friends": "<friends>"
  }
  ```

#### `getPeople(otherId, query)` (L635)
Get all public users tracking this custom item.

- **1.** `[Sequence]` Database `first` on `Other` and stores it as `item`
- **2.** `[If]` `!item`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Custom item with ID ${otherId} not found`
- **3.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **5.** `[Sequence]` Define `skip`, `filterStatus`
  ```typescript
  const skip = page - 1 * limit
  const filterStatus = query?.status?.toUpperCase()?.trim()
  ```
- **6.** `[Sequence]` Database `query` on `OtherList` and stores it as `q`
- **7.** `[If]` `filterStatus`
  - **7.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ status: filterStatus as any })
    ```
- **8.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawEntries]`
- **9.** `[Sequence]` Define `people`
  ```typescript
  const people = rawEntries.map((raw: any) => { const profile = getProfileCustomization(raw.user?.customization) const primary = item.incrementFieldKey ? (raw.progressValues as any)?.[item.incrementFieldKey] ?? null : null return { id: raw.id, ...)
  ```
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "mediaType": "other",
    "mediaId": "<otherId>",
    "total": "<total>",
    "page": "<page>",
    "limit": "<limit>",
    "totalPages": "<Math.ceil(total / limit)>",
    "people": "<people>"
  }
  ```

#### `getRecommendations(_otherId)` (L704)
Get recommendations for this custom item.

- **1.** `[Return]` 
  ```json
  {
    "success": true,
    "recommendations": []
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/_shared/base-media.serv.ts](../_shared/base-media.serv.md) ([[apps/borealis/_shared/base-media.serv]]) — `BaseBorealisMediaService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `Forbidden`, `NotFound`, `Conflict`
- [core/utils/s3.ts](../../../core/utils/s3.md) ([[core/utils/s3]]) — `uploadPublicAsset`
- [apps/carina/notifications/notifications.serv.ts](../../carina/notifications/notifications.serv.md) ([[apps/carina/notifications/notifications.serv]]) — `CarinaNotificationsServ`
- `apps/borealis/other/other.model.ts` — `CreateOtherBody`, `UpdateOtherBody`, `OtherCatalogQuery`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `not`, `countOf`, `toDate`
- `@NamelessLiberty/permissions` — `IRISFlags`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/borealis/other/other.ctrl.ts](./other.ctrl.md) ([[apps/borealis/other/other.ctrl]]) — `BorealisOtherServ`
