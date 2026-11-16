# activity.serv.ts

- **Source**: [`apps/carina/activity/activity.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/activity/activity.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `ActivityServ extends BaseService`

## Exported Types, Methods & Algorithms

### `type MediaListAction` (L17)

### `type ActivityDiffChange` (L26)

### `interface RecordMediaListActivityInput` (L38)

### `interface RecordFavoriteActivityInput` (L77)

### `interface RecordFriendActivityInput` (L88)

### `interface RecordRecommendationActivityInput` (L97)

### `interface RecordMilestoneActivityInput` (L112)

### `interface RecordImportOrSyncSummaryInput` (L127)

### `interface ResolvedMediaSummary` (L138)

### `function normalizeDisplayScore` (L167)

- **1.** `[If]` `score === null || score === undefined || Number.isNaN(Number(score))`
  - **1.1.** `[Return]`  — `null`
- **2.** `[Sequence]` Calls `Number` and stores result as `num`
- **3.** `[If]` `num <= 0`
  - **3.1.** `[Return]`  — `null`
- **4.** `[Sequence]` Define `normalized`
  ```typescript
  const normalized = num > 10 ? num / 10 : num
  ```
- **5.** `[Return]`  — `Math.round(normalized * 10) / 10`

### `function toActivityScoreInt` (L177)

- **1.** `[Sequence]` Calls `normalizeDisplayScore` and stores result as `displayScore`
- **2.** `[If]` `displayScore === null`
  - **2.1.** `[Return]`  — `null`
- **3.** `[Return]`  — `Math.round(displayScore * 10)`

### `function formatActivityAuthor` (L183)

- **1.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
- **2.** `[Sequence]` Define `displayName`
  ```typescript
  const displayName = typeof profile.displayName === 'string' && profile.displayName.trim() !== '' ? profile.displayName.trim() : null
  ```
- **3.** `[Return]` 
  ```json
  {
    "id": "<user.id>",
    "username": "<user.username>",
    "displayName": "<displayName>",
    "avatarUrl": "<profile.avatarUrl || null>",
    "avatarFrame": "<profile.avatarFrame || null>",
    "bannerUrl": "<profile.bannerUrl || null>",
    "bannerOverlayUrl": "<profile.bannerOverlayUrl || null>",
    "nameplateUrl": "<profile.nameplateUrl || null>",
    "accentColor": "<profile.accentColor || null>",
    "bio": "<profile.bio || null>",
    "statusText": "<profile.statusText || null>",
    "pronouns": "<profile.pronouns || null>",
    "displayNameStyle": "<profile.displayNameStyle || null>",
    "showcaseBadgeIds": "<profile.showcaseBadgeIds || []>",
    "pinnedSpotlight": "<profile.pinnedSpotlight || null>",
    "socialLinks": "<profile.socialLinks || []>"
  }
  ```

### `class ActivityServ` extends `BaseService` (L214)

#### `constructor()` (L218)

- _No executable statements_

#### `getInstance()`: `ActivityServ` (L222)

- **1.** `[If]` `!ActivityServ.instance`
  - **1.1.** `[Sequence]` Assign `ActivityServ.instance`
    ```typescript
    ActivityServ.instance = new ActivityServ()
    ```
- **2.** `[Return]`  — `ActivityServ.instance`

#### `runNonBlocking(task, context)`: `void` (L232)
Executes DB activity logging asynchronously without blocking HTTP request execution.

- **1.** `[Warning]` Logs warning — async () => { try { await task() } catch (err: any) { logger.warn( `${c.red(`⚠️ [${context}]`)} Failed to record activity log asynchronously: ${err?.message || err}` ) ...

#### `resolveEntitySummary(entityType, targetId)`: `Promise<ResolvedMediaSummary>` (L247)
Resolves canonical title/cover/banner/format for any catalog media or profile entity.

- **1.** `[Sequence]` Define `upper`
  ```typescript
  const upper = entityType.toUpperCase()
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[Sequence]` Define `mediaSpec`
    ```typescript
    const mediaSpec = MEDIA_MODEL_BY_TYPE[upper]
    ```
  - **2.2.** `[If]` `mediaSpec`
    - **2.2.1.** `[Sequence]` Database `query` on `Record` and stores it as `table`
    - **2.2.2.** `[If]` `table?.where`
      - **2.2.2.1.** `[Sequence]` Calls `table.where({ id: targetId }).first` and stores result as `item`
      - **2.2.2.2.** `[If]` `item`
        - **2.2.2.2.1.** `[Return]` 
          ```json
          {
            "title": "<item.titlePrimary || item.titleSecondary || item.titleNative || null>",
            "coverImage": "<item.coverImage ?? null>",
            "bannerImage": "<mediaSpec.hasBanner ? (item.bannerImage ?? null) : null>",
            "format": "<mediaSpec.formatField ? (item[mediaSpec.formatField] ?? null) : null>"
          }
          ```
  - **2.3.** `[Else]` Otherwise
    - **2.3.1.** `[If]` `upper === 'CHARACTER'`
      - **2.3.1.1.** `[Sequence]` Database `first` on `Character` and stores it as `ch`
      - **2.3.1.2.** `[If]` `ch`
        - **2.3.1.2.1.** `[Return]` 
          ```json
          {
            "title": "<ch.namePrimary ?? null>",
            "coverImage": "<ch.image ?? null>",
            "bannerImage": null,
            "format": null
          }
          ```
    - **2.3.2.** `[Else]` Otherwise
      - **2.3.2.1.** `[If]` `upper === 'PERSON'`
        - **2.3.2.1.1.** `[Sequence]` Database `first` on `Person` and stores it as `p`
        - **2.3.2.1.2.** `[If]` `p`
          - **2.3.2.1.2.1.** `[Return]` 
            ```json
            {
              "title": "<p.namePrimary ?? null>",
              "coverImage": "<p.image ?? null>",
              "bannerImage": null,
              "format": null
            }
            ```
      - **2.3.2.2.** `[Else]` Otherwise
        - **2.3.2.2.1.** `[If]` `upper === 'STUDIO'`
          - **2.3.2.2.1.1.** `[Sequence]` Database `first` on `Studio` and stores it as `s`
          - **2.3.2.2.1.2.** `[If]` `s`
            - **2.3.2.2.1.2.1.** `[Return]` 
              ```json
              {
                "title": "<s.name ?? null>",
                "coverImage": null,
                "bannerImage": null,
                "format": null
              }
              ```
- **3.** `[Catch]` Catch (`err`)
- **4.** `[Return]` 
  ```json
  {
    "title": null,
    "coverImage": null,
    "bannerImage": null,
    "format": null
  }
  ```

#### `formatActivityEntries(rawActivities, options)` (L306)
Formats raw ActivityLog rows into unified API payload with full author profile and viewer like state.

- **1.** `[Sequence]` Define `viewerUserId`, `likedIds`
  ```typescript
  const viewerUserId = options?.viewerUserId ?? null
  const likedIds = new Set<string>()
  ```
- **2.** `[If]` `viewerUserId && rawActivities.length > 0`
  - **2.1.** `[Try]` Try block
    - **2.1.1.** `[Sequence]` Define `activityLikeTable`
      ```typescript
      const activityLikeTable = (prisma as any)?.orm?.public?.ActivityLike
      ```
    - **2.1.2.** `[If]` `activityLikeTable?.where`
      - **2.1.2.1.** `[Sequence]` Define `ids`
        ```typescript
        const ids = rawActivities.map((a) => a.id).filter(Boolean)
        ```
      - **2.1.2.2.** `[If]` `ids.length > 0`
        - **2.1.2.2.1.** `[Sequence]` Calls `activityLikeTable.where((l: any) => and(l.userId.eq(viewerUserId), l.activityId.in(ids))).select('activityId').all` and stores result as `likes`
        - **2.1.2.2.2.** `[Loop]` Iterate `const like` over `likes`
          - **2.1.2.2.2.1.** `[Sequence]` Calls `likedIds.add`
  - **2.2.** `[Catch]` Catch (`err`)
- **3.** `[Return]`  — `rawActivities.map((a) => { const canDelete = Boolean(options?.isAdmin) || (viewerUserId ? a.userId === viewerUserId : Boolean(options?.isOwner)) const userObj = a.user ? formatActivityAuthor(a.user) : { ...)`

#### `assertCanViewActivity(activity, viewer)`: `Promise<void>` (L383)
Ensures viewer has access to read or engage with an activity item.

- **1.** `[If]` `!activity`
  - **1.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Activity item not found'
- **2.** `[If]` `!activity.isPrivate`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Sequence]` Define `isOwner`, `isAdmin`
  ```typescript
  const isOwner = viewer?.id === activity.userId
  const isAdmin = viewer?.permissions ? new IRISBitField(viewer.permissions).has(IRISFlags.ADMINISTRATOR) : false
  ```
- **4.** `[If]` `isOwner || isAdmin`
  - **4.1.** `[Return]`  — `void`
- **5.** `[Sequence]` Define `customListId`
  ```typescript
  const customListId = (activity.metadata as any)?.customListId
  ```
- **6.** `[If]` `customListId && viewer?.id`
  - **6.1.** `[Sequence]` Database `first` on `CustomList` and stores it as `list`
  - **6.2.** `[If]` `list`
    - **6.2.1.** `[Sequence]` Define `isCollab`
      ```typescript
      const isCollab = (list.collaborators as any[])?.some( (c) => c.userId === viewer.id )
      ```
    - **6.2.2.** `[If]` `list.userId === viewer.id || isCollab || !list.isPrivate`
      - **6.2.2.1.** `[Return]`  — `void`
- **7.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to view this private activity'

#### `checkCompletedMilestone(input)`: `Promise<void>` (L422)
Evaluates and records a USER_MILESTONE activity when completing a round count of titles.

- **1.** `[Sequence]` Database `query` on `Record` and stores it as `listTable`
- **2.** `[If]` `!listTable?.where`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Sequence]` Define `completedQuery`
  ```typescript
  const completedQuery = input.isPrivate ? listTable.where({ userId: input.userId, status: 'COMPLETED' }) : listTable.where({ userId: input.userId, status: 'COMPLETED', private: false })
  ```
- **4.** `[Sequence]` Calls `countOf` and stores result as `completedCount`
- **5.** `[Sequence]` Calls `[...COMPLETED_MILESTONE_THRESHOLDS].reverse().find` and stores result as `threshold`
- **6.** `[If]` `!threshold`
  - **6.1.** `[Return]`  — `void`
- **7.** `[Sequence]` Define `domainLabelMap`, `label`, `milestoneKey`
  ```typescript
  const domainLabelMap: Record<string, string> = { ANIME: 'Anime', MANGA: 'Manga', MOVIE: 'Movies', TV: 'TV Shows', GAME: 'Games', BOOK: 'Books', ...
  const label = domainLabelMap[input.mediaType] || input.mediaType
  const milestoneKey = `COMPLETED:${input.mediaType}:${threshold}`
  ```
- **8.** `[Sequence]` Calls `this.recordMilestoneActivitySync`

#### `recordMilestoneActivitySync(input)`: `Promise<boolean>` (L470)
Records a USER_MILESTONE activity if no matching milestoneKey already exists for the user.

- **1.** `[Sequence]` Database `all` on `ActivityLog` and stores it as `existingMilestones`
- **2.** `[Sequence]` Calls `existingMilestones.some` and stores result as `alreadyLogged`
- **3.** `[If]` `alreadyLogged`
  - **3.1.** `[Return]`  — `false`
- **4.** `[Sequence]` Database `create` on `ActivityLog`
- **5.** `[Return]`  — `true`

#### `recordBadgeMilestone(userId, badgeId)`: `void` (L508)
Non-blocking wrapper to emit a badge unlock USER_MILESTONE activity.

- **1.** `[Sequence]` Calls `getBadgeById` and stores result as `badge`
- **2.** `[If]` `!badge`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Sequence]` Calls `this.runNonBlocking`

#### `recordMediaListActivity(input)`: `void` (L531)
Records a media list tracking event (supports combined multi-field diff pills + milestones).

- **1.** `[Sequence]` Define `type`
  ```typescript
  let type: ActivityType
  ```
- **2.** `[Switch]` Branch on `input.action`
  - **2.1.** `[Case]` Case `'ADDED'`
    - **2.1.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_ITEM_ADDED'
      ```
  - **2.2.** `[Case]` Case `'COMPLETED'`
    - **2.2.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_COMPLETED'
      ```
  - **2.3.** `[Case]` Case `'STATUS_CHANGED'`
    - **2.3.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_STATUS_UPDATED'
      ```
  - **2.4.** `[Case]` Case `'PROGRESS_CHANGED'`
    - **2.4.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_PROGRESS_UPDATED'
      ```
  - **2.5.** `[Case]` Case `'SCORE_CHANGED'`
    - **2.5.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_SCORE_UPDATED'
      ```
  - **2.6.** `[Case]` Case `'REWATCH_STARTED'`
    - **2.6.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_REWATCH_STARTED'
      ```
  - **2.7.** `[Case]` Case `'REMOVED'`
    - **2.7.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_ITEM_REMOVED'
      ```
  - **2.8.** `[Case]` Default
    - **2.8.1.** `[Sequence]` Assign `type`
      ```typescript
      type = 'LIST_STATUS_UPDATED'
      ```
- **3.** `[Sequence]` Calls `toActivityScoreInt` and stores result as `scoreInt`
- **4.** `[Sequence]` Calls `normalizeDisplayScore` and stores result as `exactScore`
- **5.** `[Sequence]` Calls `normalizeDisplayScore` and stores result as `prevScore`
- **6.** `[Sequence]` Database `create` on `ActivityLog`

#### `recordFavoriteActivity(input)`: `void` (L616)
Records a user favorite addition or removal event.

- **1.** `[Sequence]` Define `isAdded`, `verb`
  ```typescript
  const isAdded = input.action === 'FAVORITE_ADDED'
  const verb = isAdded ? 'Added' : 'Removed'
  ```
- **2.** `[Sequence]` Calls `this.runNonBlocking`

#### `recordFriendActivity(input)`: `void` (L664)
Records a bilateral friend acceptance event.

- **1.** `[Sequence]` Database `create` on `ActivityLog`

#### `recordRecommendationActivity(input)`: `void` (L684)
Records a public media-to-media recommendation event.

- **1.** `[Sequence]` Calls `this.runNonBlocking`

#### `recordImportOrSyncSummaryActivity(input)`: `void` (L735)
Records a single concise summary activity entry for bulk list imports or connection syncs.

- **1.** `[Sequence]` Define `totalTouched`
  ```typescript
  const totalTouched = input.importedCount + input.updatedCount
  ```
- **2.** `[If]` `totalTouched <= 0`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Sequence]` Define `providerLabel`, `verb`
  ```typescript
  const providerLabel = input.provider ? input.provider.toUpperCase() : null
  const verb = input.source === 'CONNECTION_SYNC' ? `Synced ${totalTouched} item${totalTouched === 1 ? '' : 's'}${providerLabel ? ` from ${providerLabel}` : ''}` : `Imported ${totalTouched} list item${totalTouched === 1 ? '' : 's'}`
  ```
- **4.** `[Sequence]` Database `create` on `ActivityLog`

#### `createStatusPost(userId, body)` (L775)
Creates a user STATUS_POST activity with optional tagged media, spoiler flag, and privacy.

- **1.** `[Sequence]` Define `content`
  ```typescript
  const content = body.content?.trim()
  ```
- **2.** `[If]` `!content`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Status post cannot be empty'
- **3.** `[If]` `content.length > 2000`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Status post cannot exceed 2000 characters'
- **4.** `[Sequence]` Define `mediaType`, `mediaId`, `mediaSummary`
  ```typescript
  let mediaType: MediaType | null = null
  let mediaId: number | null = null
  let mediaSummary: ResolvedMediaSummary | null = null
  ```
- **5.** `[If]` `body.mediaType && body.mediaId`
  - **5.1.** `[Sequence]` Define `upper`
    ```typescript
    const upper = body.mediaType.trim().toUpperCase()
    ```
  - **5.2.** `[If]` `!MEDIA_MODEL_BY_TYPE[upper]`
    - **5.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Unsupported media type "${body.mediaType}"`
  - **5.3.** `[Sequence]` Assign `mediaType`
    ```typescript
    mediaType = (upper === 'MUSIC_ALBUM' || upper === 'MUSIC_TRACK' ? 'MUSIC' : upper) as MediaType
    ```
  - **5.4.** `[Sequence]` Assign `mediaId`
    ```typescript
    mediaId = Number(body.mediaId)
    ```
  - **5.5.** `[If]` `!Number.isInteger(mediaId) || mediaId < 1`
    - **5.5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Invalid mediaId'
  - **5.6.** `[Sequence]` Assign `mediaSummary`
    ```typescript
    mediaSummary = await this.resolveEntitySummary(mediaType, mediaId)
    ```
  - **5.7.** `[If]` `!mediaSummary.title`
    - **5.7.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Media item ${mediaType} #${mediaId} not found`
- **6.** `[Sequence]` Database `create` on `ActivityLog` and stores it as `created`
- **7.** `[Sequence]` Database `first` on `ActivityLog` and stores it as `hydrated`
- **8.** `[Sequence]` Calls `this.formatActivityEntries` and stores result as `[formatted]`
- **9.** `[If]` `!formatted`
  - **9.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Created activity entry could not be loaded'
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "activity": "<formatted>"
  }
  ```

#### `toggleLike(userId, permissions, activityId)` (L858)
Toggles a like on any visible ActivityLog entry and syncs likeCount.

- **1.** `[Sequence]` Database `first` on `ActivityLog` and stores it as `activity`
- **2.** `[Sequence]` Calls `this.assertCanViewActivity`
- **3.** `[Sequence]` Database `first` on `ActivityLike` and stores it as `existing`
- **4.** `[Sequence]` Define `liked`
  ```typescript
  let liked = false
  ```
- **5.** `[If]` `existing`
  - **5.1.** `[Sequence]` Database `delete` on `ActivityLike`
  - **5.2.** `[Sequence]` Assign `liked`
    ```typescript
    liked = false
    ```
- **6.** `[Else]` Otherwise
  - **6.1.** `[Sequence]` Database `create` on `ActivityLike`
  - **6.2.** `[Sequence]` Assign `liked`
    ```typescript
    liked = true
    ```
- **7.** `[Sequence]` Database `query` on `ActivityLike` and stores it as `likeCount`
- **8.** `[Sequence]` Database `update` on `ActivityLog`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "liked": "<liked>",
    "likeCount": "<likeCount>"
  }
  ```

#### `getReplies(activityId, query, viewer)` (L899)
Lists replies for an ActivityLog entry ordered oldest-first.

- **1.** `[Sequence]` Database `first` on `ActivityLog` and stores it as `activity`
- **2.** `[Sequence]` Calls `this.assertCanViewActivity`
- **3.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **5.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **6.** `[Sequence]` Database `query` on `ActivityReply` and stores it as `replyQuery`
- **7.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawReplies]`
- **8.** `[Sequence]` Define `isAdmin`, `replies`
  ```typescript
  const isAdmin = viewer ? new IRISBitField(viewer.permissions).has(IRISFlags.ADMINISTRATOR) : false
  const replies = rawReplies.map((r: any) => ({ id: r.id, activityId: r.activityId, userId: r.userId, content: r.content, likeCount: r.likeCount ?? 0, createdAt: toDate(r.createdAt).toISOString(), ...)
  ```
- **9.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "replies": "<replies>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<page < totalPages>"
    }
  }
  ```

#### `createReply(userId, permissions, activityId, body)` (L971)
Adds a reply to any visible ActivityLog entry and syncs replyCount.

- **1.** `[Sequence]` Database `first` on `ActivityLog` and stores it as `activity`
- **2.** `[Sequence]` Calls `this.assertCanViewActivity`
- **3.** `[Sequence]` Define `content`
  ```typescript
  const content = body.content?.trim()
  ```
- **4.** `[If]` `!content`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Reply content cannot be empty'
- **5.** `[If]` `content.length > 1000`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Reply content cannot exceed 1000 characters'
- **6.** `[Sequence]` Database `create` on `ActivityReply` and stores it as `created`
- **7.** `[Sequence]` Database `all` on `ActivityReply` and stores it as `[replyCount, hydrated]`
- **8.** `[Sequence]` Database `update` on `ActivityLog`
- **9.** `[Sequence]` Define `row`
  ```typescript
  const row = hydrated || created
  ```
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "reply": {
      "id": "<row.id>",
      "activityId": "<row.activityId>",
      "userId": "<row.userId>",
      "content": "<row.content>",
      "likeCount": "<row.likeCount ?? 0>",
      "createdAt": "<toDate(row.createdAt).toISOString()>",
      "updatedAt": "<toDate(row.updatedAt).toISOString()>",
      "user": "<(row as any).user ? formatActivityAuthor((row as any).user) : { id: userId, username: 'Unknown', displayName: null, avatarUrl: null, ...>",
      "canDelete": true
    },
    "replyCount": "<replyCount>"
  }
  ```

#### `deleteReply(userId, permissions, activityId, replyId)` (L1041)
Deletes an ActivityReply (reply author, activity owner, or admin) and syncs replyCount.

- **1.** `[Sequence]` Database `all` on `ActivityLog` and stores it as `[activity, reply]`
- **2.** `[If]` `!activity || !reply || reply.activityId !== activityId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Reply not found'
- **3.** `[Sequence]` Calls `new IRISBitField(permissions).has` and stores result as `isAdmin`
- **4.** `[Sequence]` Define `isAllowed`
  ```typescript
  const isAllowed = isAdmin || reply.userId === userId || activity.userId === userId
  ```
- **5.** `[If]` `!isAllowed`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this reply'
- **6.** `[Sequence]` Database `delete` on `ActivityReply`
- **7.** `[Sequence]` Database `query` on `ActivityReply` and stores it as `replyCount`
- **8.** `[Sequence]` Database `update` on `ActivityLog`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "replyCount": "<replyCount>",
    "message": "Reply deleted successfully"
  }
  ```

#### `purgeOldActivities(daysToKeep = 30)`: `Promise<number>` (L1083)
Purges ALL activity log records older than the retention window (default: 30 days).

- **1.** `[Sequence]` Define `cutoff`
  ```typescript
  const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
  ```
- **2.** `[Return]`  — `await prisma.orm.public.ActivityLog.where((a) => a.createdAt.lt(cutoff)).deleteAndCount()`

#### `initCron()`: `void` (L1093)
Initializes a recurring daily retention cleanup task (30 days across all activity types).

- **1.** `[If]` `this.cronJobTimer`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Define `runCleanup`
  ```typescript
  const runCleanup = async () => { try { const count = await ActivityServ.purgeOldActivities(30) if (count > 0) { logger.info( `${c.cyan('🧹 [Retention Cleanup]')}: Purged ${c.bold(String(count))} activity logs older than 30 days` ) ...
  ```
- **3.** `[Sequence]` Calls `setTimeout`
- **4.** `[Sequence]` Assign `this.cronJobTimer`
  ```typescript
  this.cronJobTimer = setInterval(() => { runCleanup().catch(() => {}) }, 24 * 60 * 60 * 1000)
  ```
- **5.** `[If]` `this.cronJobTimer && typeofthis.cronJobTimer.unref === 'function'`
  - **5.1.** `[Sequence]` Calls `this.cronJobTimer.unref`

#### `shutdown()`: `void` (L1128)

- **1.** `[If]` `this.cronJobTimer`
  - **1.1.** `[Sequence]` Calls `clearInterval`
  - **1.2.** `[Sequence]` Assign `this.cronJobTimer`
    ```typescript
    this.cronJobTimer = null
    ```

### `const activityServ` (L1136)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `Forbidden`, `NotFound`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `countOf`, `toDate`, `ActivityType`, `MediaType`
- `@NamelessLiberty/logger` — `LogFactory`, `c`
- `@NamelessLiberty/shared` — `getBadgeById`, `getProfileCustomization`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](../../borealis/lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `ActivityServ`, `normalizeDisplayScore`, `ActivityDiffChange`, `MediaListAction`
- [apps/borealis/playlists/playlists.serv.ts](../../borealis/playlists/playlists.serv.md) ([[apps/borealis/playlists/playlists.serv]]) — `ActivityServ`
- [apps/carina/activity/activity.ctrl.ts](./activity.ctrl.md) ([[apps/carina/activity/activity.ctrl]]) — `ActivityServ`
- [apps/carina/connections/connections.serv.ts](../connections/connections.serv.md) ([[apps/carina/connections/connections.serv]]) — `ActivityServ`
- [apps/carina/favorites/favorites.serv.ts](../favorites/favorites.serv.md) ([[apps/carina/favorites/favorites.serv]]) — `ActivityServ`
- [apps/carina/friends/friends.serv.ts](../friends/friends.serv.md) ([[apps/carina/friends/friends.serv]]) — `ActivityServ`
- [apps/carina/recommendations/recommendations.serv.ts](../recommendations/recommendations.serv.md) ([[apps/carina/recommendations/recommendations.serv]]) — `ActivityServ`
- [apps/carina/users/users.serv.ts](../users/users.serv.md) ([[apps/carina/users/users.serv]]) — `ActivityServ`
- [index.ts](../../../index.md) ([[index]]) — `activityServ`
