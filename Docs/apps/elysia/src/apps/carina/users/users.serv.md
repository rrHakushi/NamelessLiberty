# users.serv.ts

- **Source**: [`apps/carina/users/users.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/users/users.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaUsersServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaUsersServ` extends `BaseService` (L176)

#### `constructor()` (L179)

- _No executable statements_

#### `resolveUser(identifier)` (L185)
Resolves a user strictly by database user ID.

- **1.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = identifier.trim()
  ```
- **2.** `[If]` `!trimmed`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **3.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **4.** `[If]` `!user`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User "${trimmed}" not found`
- **5.** `[Return]`  — `user`

#### `getUserProfileByUsername(username)` (L203)
Resolves a user profile by case-insensitive username.

- **1.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = username.trim()
  ```
- **2.** `[If]` `!trimmed`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **3.** `[Sequence]` Database `first` on `User` and stores it as `user`
- **4.** `[If]` `!user`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User "${trimmed}" not found`
- **5.** `[Return]`  — `await this.getUserProfile(user.id)`

#### `listUsers(query)` (L221)
Search / list public users with pagination (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `searchTerm`
  ```typescript
  const skip = page - 1 * limit
  const searchTerm = query?.q?.trim()
  ```
- **4.** `[Sequence]` Database `query` on `User` and stores it as `queryUsers`
- **5.** `[If]` `searchTerm`
  - **5.1.** `[Sequence]` Assign `queryUsers`
    ```typescript
    queryUsers = queryUsers.where((u) => u.username.ilike(`%${searchTerm}%`))
    ```
- **6.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawUsers]`
- **7.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **8.** `[Sequence]` Define `hasMore`, `users`
  ```typescript
  const hasMore = page < totalPages
  const users = rawUsers.map((u) => { const profile = getProfileCustomization(u.customization) return { id: u.id, username: u.username, displayName: profile.displayName || null, avatarUrl: profile.avatarUrl || null, ...)
  ```
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "users": "<users>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getUserProfile(identifier, viewerUserId)` (L280)
Get user public profile info by ID or username.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Define `isOwner`
  ```typescript
  const isOwner = viewerUserId === target.id
  ```
- **3.** `[Sequence]` Database `all` on `Friend` and stores it as `[friendsCount, favoritesCount, rawConnections]`
- **4.** `[Sequence]` Define `connections`
  ```typescript
  const connections = rawConnections.filter((c) => isOwner || (c.settings as any)?.isPrivate !== true).map((c) => ({ id: c.id, provider: c.provider, displayName: c.displayName, avatarUrl: c.avatarUrl, profileUrl: c.profileUrl, status: c.status, ...)
  ```
- **5.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "user": {
      "id": "<target.id>",
      "username": "<target.username>",
      "displayName": "<profile.displayName || null>",
      "avatarUrl": "<profile.avatarUrl || null>",
      "avatarFrame": "<profile.avatarFrame || null>",
      "bannerUrl": "<profile.bannerUrl || null>",
      "bannerOverlayUrl": "<profile.bannerOverlayUrl || null>",
      "nameplateUrl": "<profile.nameplateUrl || null>",
      "bio": "<profile.bio || null>",
      "statusText": "<profile.statusText || null>",
      "pronouns": "<profile.pronouns || null>",
      "badges": [
        "<...target.badges>"
      ],
      "customization": "<target.customization as any>",
      "createdAt": "<toDate(target.createdAt).toISOString()>",
      "stats": {
        "friendsCount": "<friendsCount>",
        "favoritesCount": "<favoritesCount>",
        "badgesCount": "<target.badges.length>"
      },
      "connections": "<connections>"
    }
  }
  ```

#### `blockUser(currentUserId, targetIdentifier)` (L340)
Block a target user.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[If]` `target.id === currentUserId`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'You cannot block yourself'
- **3.** `[Sequence]` Database `first` on `UserBlock` and stores it as `existingBlock`
- **4.** `[If]` `!existingBlock`
  - **4.1.** `[Sequence]` Database `create` on `UserBlock`
- **5.** `[Sequence]` Database `all` on `Friend`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "User blocked successfully",
    "blockedId": "<target.id>"
  }
  ```

#### `unblockUser(currentUserId, targetIdentifier)` (L386)
Unblock a target user.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Database `deleteAll` on `UserBlock`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "User unblocked successfully"
  }
  ```

#### `getFriendshipStatus(currentUserId, targetIdentifier)` (L403)
Get friendship & relation status between authenticated user and target user.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[If]` `target.id === currentUserId`
  - **2.1.** `[Return]` 
    ```json
    {
      "success": true,
      "status": "<'self' as const>",
      "isFriend": false,
      "isBlocked": false,
      "isBlockedBy": false,
      "isPending": false,
      "requestId": null
    }
    ```
- **3.** `[Sequence]` Database `first` on `UserBlock` and stores it as `blockedByCaller`
- **4.** `[If]` `blockedByCaller`
  - **4.1.** `[Return]` 
    ```json
    {
      "success": true,
      "status": "<'blocked' as const>",
      "isFriend": false,
      "isBlocked": true,
      "isBlockedBy": false,
      "isPending": false,
      "requestId": null
    }
    ```
- **5.** `[Sequence]` Database `first` on `UserBlock` and stores it as `blockedByTarget`
- **6.** `[If]` `blockedByTarget`
  - **6.1.** `[Return]` 
    ```json
    {
      "success": true,
      "status": "<'blocked_by' as const>",
      "isFriend": false,
      "isBlocked": false,
      "isBlockedBy": true,
      "isPending": false,
      "requestId": null
    }
    ```
- **7.** `[Sequence]` Database `first` on `Friend` and stores it as `friend`
- **8.** `[If]` `friend`
  - **8.1.** `[Return]` 
    ```json
    {
      "success": true,
      "status": "<'friends' as const>",
      "isFriend": true,
      "isBlocked": false,
      "isBlockedBy": false,
      "isPending": false,
      "requestId": null
    }
    ```
- **9.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `friendReq`
- **10.** `[If]` `friendReq`
  - **10.1.** `[Sequence]` Define `isOutgoing`
    ```typescript
    const isOutgoing = friendReq.senderId === currentUserId
    ```
  - **10.2.** `[Return]` 
    ```json
    {
      "success": true,
      "status": "<isOutgoing ? ('outgoing_request' as const) : ('incoming_request' as const)>",
      "isFriend": false,
      "isBlocked": false,
      "isBlockedBy": false,
      "isPending": true,
      "requestId": "<friendReq.id>"
    }
    ```
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "status": "<'none' as const>",
    "isFriend": false,
    "isBlocked": false,
    "isBlockedBy": false,
    "isPending": false,
    "requestId": null
  }
  ```

#### `getUserAssets(targetIdentifier)` (L515)
Get user public assets (avatar, banner, decor).

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "assets": {
      "avatarUrl": "<profile.avatarUrl || null>",
      "avatarFrame": "<profile.avatarFrame || null>",
      "bannerUrl": "<profile.bannerUrl || null>",
      "bannerOverlayUrl": "<profile.bannerOverlayUrl || null>",
      "nameplateUrl": "<profile.nameplateUrl || null>",
      "sidebarBannerUrl": "<profile.sidebarBannerUrl || null>",
      "accentColor": "<profile.accentColor || null>"
    }
  }
  ```

#### `getUserBadges(targetIdentifier)` (L536)
Get user badges mapped with metadata from @NamelessLiberty/shared.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Define `richBadges`
  ```typescript
  const richBadges = target.badges.map((id) => getBadgeById(id)).filter((b): b is NonNullable<typeof b> => Boolean(b)).map((badge) => ({ id: badge.id, name: badge.name, description: badge.description, icon: badge.icon, color: badge.color, category: badge.category, ...)
  ```
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "badges": "<richBadges>",
    "total": "<richBadges.length>"
  }
  ```

#### `evaluateBadges(currentUser, targetIdentifier)` (L562)
Evaluate and award eligible badges for target user.

- **1.** `[Sequence]` Define `target`, `isSelf`
  ```typescript
  const target = targetIdentifier === 'me' ? await this.resolveUser(currentUser.id) : await this.resolveUser(targetIdentifier)
  const isSelf = target.id === currentUser.id
  ```
- **2.** `[Sequence]` Calls `new IRISBitField(currentUser.permissions).has` and stores result as `isAdmin`
- **3.** `[If]` `!isSelf && !isAdmin`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You cannot evaluate badges for other users'
- **4.** `[Sequence]` Database `all` on `AnimeList` and stores it as `[ animeCount, mangaCount, movieCount, tvCount, gameCount, bookCount, ...`
- **5.** `[Sequence]` Define `earnedBadgeIds`, `evaluateTrack`
  ```typescript
  const earnedBadgeIds = new Set<number>()
  const evaluateTrack = (count: number, badgeIds?: readonly number[]) => { if (!badgeIds) return for (let i = 0; i < MEDIA_MILESTONES.length; i++) { const threshold = MEDIA_MILESTONES[i] const badgeId = badgeIds[i] if (threshold !== undefined && badgeId !== undefined && count >= threshold) { earnedBadgeIds.add(badgeId) ...
  ```
- **6.** `[Sequence]` Calls `evaluateTrack`
- **7.** `[Sequence]` Calls `evaluateTrack`
- **8.** `[Sequence]` Calls `evaluateTrack`
- **9.** `[Sequence]` Calls `evaluateTrack`
- **10.** `[Sequence]` Calls `evaluateTrack`
- **11.** `[Sequence]` Calls `evaluateTrack`
- **12.** `[Sequence]` Calls `evaluateTrack`
- **13.** `[Loop]` Loop `i < CUSTOM_LIST_MILESTONES.length`
  - **13.1.** `[Sequence]` Define `threshold`, `badgeId`
    ```typescript
    const threshold = CUSTOM_LIST_MILESTONES[i]
    const badgeId = CUSTOM_LIST_BADGE_IDS[i]
    ```
  - **13.2.** `[If]` `threshold !== undefined && badgeId !== undefined && customListCount >= threshold`
    - **13.2.1.** `[Sequence]` Calls `earnedBadgeIds.add`
- **14.** `[Sequence]` Calls `new IRISBitField(target.permissions).has` and stores result as `targetIsAdmin`
- **15.** `[If]` `targetIsAdmin`
  - **15.1.** `[Sequence]` Calls `earnedBadgeIds.add`
- **16.** `[Sequence]` Define `currentBadgesSet`, `newlyAwardedBadgeIds`, `updatedBadges`
  ```typescript
  const currentBadgesSet = new Set(target.badges)
  const newlyAwardedBadgeIds = Array.from(earnedBadgeIds).filter((id) => !currentBadgesSet.has(id))
  let updatedBadges = [...target.badges]
  ```
- **17.** `[If]` `newlyAwardedBadgeIds.length > 0`
  - **17.1.** `[Sequence]` Assign `updatedBadges`
    ```typescript
    updatedBadges = [...target.badges, ...newlyAwardedBadgeIds]
    ```
  - **17.2.** `[Sequence]` Database `update` on `User`
  - **17.3.** `[Loop]` Iterate `const badgeId` over `newlyAwardedBadgeIds`
    - **17.3.1.** `[Sequence]` Calls `ActivityServ.recordBadgeMilestone`
- **18.** `[Return]` 
  ```json
  {
    "success": true,
    "newlyAwardedCount": "<newlyAwardedBadgeIds.length>",
    "newlyAwardedBadgeIds": "<newlyAwardedBadgeIds>",
    "badges": "<updatedBadges>",
    "message": "<newlyAwardedBadgeIds.length > 0 ? `Successfully unlocked ${newlyAwardedBadgeIds.length} new badge(s)!` : 'All badge achievements are up to date.'>"
  }
  ```

#### `evaluateBadgesNonBlocking(userId)`: `void` (L667)
Fires background badge evaluation for a user after list or playlist milestones.

- **1.** `[Sequence]` Calls `setImmediate`

#### `getUserActivity(targetIdentifier, query, sessionUser)` (L676)
Get user full activity feed with pagination and privacy gating.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **3.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **4.** `[Sequence]` Define `skip`, `isOwner`, `isAdmin`
  ```typescript
  const skip = page - 1 * limit
  const isOwner = sessionUser?.id === target.id
  const isAdmin = sessionUser ? new IRISBitField(sessionUser.permissions).has(IRISFlags.ADMINISTRATOR) : false
  ```
- **5.** `[Sequence]` Database `query` on `ActivityLog` and stores it as `activityQuery`
- **6.** `[If]` `!isOwner && !isAdmin`
  - **6.1.** `[Sequence]` Assign `activityQuery`
    ```typescript
    activityQuery = activityQuery.where({ isPrivate: false })
    ```
- **7.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawActivities]`
- **8.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **9.** `[Sequence]` Define `hasMore`
  ```typescript
  const hasMore = page < totalPages
  ```
- **10.** `[Sequence]` Calls `ActivityServ.formatActivityEntries` and stores result as `activities`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "activities": "<activities>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getUserActivityByCategory(targetIdentifier, category, query, sessionUser)` (L731)
Get user activity feed filtered by category or media domain.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Define `normCategory`, `allEnumKeys`, `mediaTypeFilter`, `allowedTypes`
  ```typescript
  const normCategory = category.toLowerCase().trim()
  const allEnumKeys: ActivityType[] = [ 'LIST_ITEM_ADDED', 'LIST_STATUS_UPDATED', 'LIST_PROGRESS_UPDATED', 'LIST_SCORE_UPDATED', 'LIST_COMPLETED', 'LIST_REWATCH_STARTED', ...
  let mediaTypeFilter: MediaType | undefined
  let allowedTypes: ActivityType[] | undefined
  ```
- **3.** `[If]` `normCategory === 'all' || normCategory === 'overview'`
  - **3.1.** `[Sequence]` Assign `allowedTypes`
    ```typescript
    allowedTypes = undefined
    ```
- **4.** `[Else]` Otherwise
  - **4.1.** `[If]` `MEDIA_ACTIVITY_DOMAINS[normCategory]`
    - **4.1.1.** `[Sequence]` Assign `mediaTypeFilter`
      ```typescript
      mediaTypeFilter = MEDIA_ACTIVITY_DOMAINS[normCategory]
      ```
    - **4.1.2.** `[Sequence]` Assign `allowedTypes`
      ```typescript
      allowedTypes = [ 'LIST_ITEM_ADDED', 'LIST_STATUS_UPDATED', 'LIST_PROGRESS_UPDATED', 'LIST_SCORE_UPDATED', 'LIST_COMPLETED', 'LIST_REWATCH_STARTED', ...
      ```
  - **4.2.** `[Else]` Otherwise
    - **4.2.1.** `[If]` `ACTIVITY_CATEGORIES[normCategory]`
      - **4.2.1.1.** `[Sequence]` Assign `allowedTypes`
        ```typescript
        allowedTypes = ACTIVITY_CATEGORIES[normCategory]
        ```
    - **4.2.2.** `[Else]` Otherwise
      - **4.2.2.1.** `[Sequence]` Define `upper`
        ```typescript
        const upper = category.toUpperCase().trim() as ActivityType
        ```
      - **4.2.2.2.** `[If]` `allEnumKeys.includes(upper)`
        - **4.2.2.2.1.** `[Sequence]` Assign `allowedTypes`
          ```typescript
          allowedTypes = [upper]
          ```
      - **4.2.2.3.** `[Else]` Otherwise
        - **4.2.2.3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid activity category "${category}". Valid categories: anime, manga, movie, tv, game, book, music, other, media, lists, social, posts, status.`
- **5.** `[If]` `query?.action`
  - **5.1.** `[Sequence]` Define `normAction`
    ```typescript
    const normAction = query.action.toLowerCase().trim()
    ```
  - **5.2.** `[If]` `ACTION_TYPE_MAP[normAction]`
    - **5.2.1.** `[Sequence]` Assign `allowedTypes`
      ```typescript
      allowedTypes = ACTION_TYPE_MAP[normAction]
      ```
  - **5.3.** `[Else]` Otherwise
    - **5.3.1.** `[Sequence]` Define `upperAction`
      ```typescript
      const upperAction = query.action.toUpperCase().trim() as ActivityType
      ```
    - **5.3.2.** `[If]` `allEnumKeys.includes(upperAction) && !allowedTypes || allowedTypes.includes(upperAction)`
      - **5.3.2.1.** `[Sequence]` Assign `allowedTypes`
        ```typescript
        allowedTypes = [upperAction]
        ```
- **6.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **7.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **8.** `[Sequence]` Define `skip`, `isOwner`, `isAdmin`
  ```typescript
  const skip = page - 1 * limit
  const isOwner = sessionUser?.id === target.id
  const isAdmin = sessionUser ? new IRISBitField(sessionUser.permissions).has(IRISFlags.ADMINISTRATOR) : false
  ```
- **9.** `[Sequence]` Database `query` on `ActivityLog` and stores it as `activityQuery`
- **10.** `[If]` `mediaTypeFilter`
  - **10.1.** `[Sequence]` Assign `activityQuery`
    ```typescript
    activityQuery = activityQuery.where({ mediaType: mediaTypeFilter })
    ```
- **11.** `[If]` `allowedTypes && allowedTypes.length > 0`
  - **11.1.** `[Sequence]` Assign `activityQuery`
    ```typescript
    activityQuery = activityQuery.where((a) => a.type.in(allowedTypes!))
    ```
- **12.** `[If]` `!isOwner && !isAdmin`
  - **12.1.** `[Sequence]` Assign `activityQuery`
    ```typescript
    activityQuery = activityQuery.where({ isPrivate: false })
    ```
- **13.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawActivities]`
- **14.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **15.** `[Sequence]` Define `hasMore`
  ```typescript
  const hasMore = page < totalPages
  ```
- **16.** `[Sequence]` Calls `ActivityServ.formatActivityEntries` and stores result as `activities`
- **17.** `[Return]` 
  ```json
  {
    "success": true,
    "activities": "<activities>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `deleteActivity(currentUserId, currentUserPermissions, activityId)` (L861)
Delete an activity log item.

- **1.** `[Sequence]` Database `first` on `ActivityLog` and stores it as `activity`
- **2.** `[If]` `!activity`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Activity item not found'
- **3.** `[Sequence]` Define `isAuthor`
  ```typescript
  const isAuthor = activity.userId === currentUserId
  ```
- **4.** `[Sequence]` Calls `new IRISBitField(currentUserPermissions).has` and stores result as `isAdmin`
- **5.** `[If]` `!isAuthor && !isAdmin`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this activity item'
- **6.** `[Sequence]` Database `delete` on `ActivityLog`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Activity item deleted successfully"
  }
  ```

#### `enrichFavoritesWithEntities(rawFavorites, targetUserId)` (L890)
Helper to enrich raw favorite records with entity metadata (title, cover, link, format, score, list entry, media).

- **1.** `[If]` `!rawFavorites.length`
  - **1.1.** `[Return]`  — `[]`
- **2.** `[Sequence]` Define `animeIds`, `mangaIds`, `movieIds`, `tvIds`, `gameIds`, `bookIds`, `musicIds`, `characterIds`, `personIds`, `studioIds`, `otherIds`
  ```typescript
  const animeIds: number[] = []
  const mangaIds: number[] = []
  const movieIds: number[] = []
  const tvIds: number[] = []
  const gameIds: number[] = []
  const bookIds: number[] = []
  const musicIds: number[] = []
  const characterIds: number[] = []
  const personIds: number[] = []
  const studioIds: number[] = []
  const otherIds: number[] = []
  ```
- **3.** `[Loop]` Iterate `const item` over `rawFavorites`
  - **3.1.** `[If]` `item.type === 'ANIME'`
  - **3.2.** `[Else]` Otherwise
    - **3.2.1.** `[If]` `item.type === 'MANGA'`
    - **3.2.2.** `[Else]` Otherwise
      - **3.2.2.1.** `[If]` `item.type === 'MOVIE'`
      - **3.2.2.2.** `[Else]` Otherwise
        - **3.2.2.2.1.** `[If]` `item.type === 'TV'`
        - **3.2.2.2.2.** `[Else]` Otherwise
          - **3.2.2.2.2.1.** `[If]` `item.type === 'GAME'`
          - **3.2.2.2.2.2.** `[Else]` Otherwise
            - **3.2.2.2.2.2.1.** `[If]` `item.type === 'BOOK'`
            - **3.2.2.2.2.2.2.** `[Else]` Otherwise
              - **3.2.2.2.2.2.2.1.** `[If]` `item.type === 'MUSIC_ALBUM' || item.type === 'MUSIC_TRACK'`
              - **3.2.2.2.2.2.2.2.** `[Else]` Otherwise
                - **3.2.2.2.2.2.2.2.1.** `[If]` `item.type === 'OTHER'`
                - **3.2.2.2.2.2.2.2.2.** `[Else]` Otherwise
                  - **3.2.2.2.2.2.2.2.2.1.** `[If]` `item.type === 'CHARACTER'`
                  - **3.2.2.2.2.2.2.2.2.2.** `[Else]` Otherwise
                    - **3.2.2.2.2.2.2.2.2.2.1.** `[If]` `item.type === 'PERSON'`
                    - **3.2.2.2.2.2.2.2.2.2.2.** `[Else]` Otherwise
                      - **3.2.2.2.2.2.2.2.2.2.2.1.** `[If]` `item.type === 'STUDIO'`
- **4.** `[Sequence]` Database `all` on `Anime` and stores it as `[ animeList, mangaList, movieList, tvList, gameList, bookList, ...`
- **5.** `[Sequence]` Define `animeMap`, `mangaMap`, `movieMap`, `tvMap`, `gameMap`, `bookMap`, `musicMap`, `characterMap`, `personMap`, `studioMap`, `otherMap`, `userAnimeMap`, `userMangaMap`, `userMovieMap`, `userTvMap`, `userGameMap`, `userBookMap`, `userOtherMap`
  ```typescript
  const animeMap = new Map<number, any>(animeList.map((i: any): [number, any] => [i.id, i]))
  const mangaMap = new Map<number, any>(mangaList.map((i: any): [number, any] => [i.id, i]))
  const movieMap = new Map<number, any>(movieList.map((i: any): [number, any] => [i.id, i]))
  const tvMap = new Map<number, any>(tvList.map((i: any): [number, any] => [i.id, i]))
  const gameMap = new Map<number, any>(gameList.map((i: any): [number, any] => [i.id, i]))
  const bookMap = new Map<number, any>(bookList.map((i: any): [number, any] => [i.id, i]))
  const musicMap = new Map<number, any>(musicList.map((i: any): [number, any] => [i.id, i]))
  const characterMap = new Map<number, any>(characterList.map((i: any): [number, any] => [i.id, i]))
  const personMap = new Map<number, any>(personList.map((i: any): [number, any] => [i.id, i]))
  const studioMap = new Map<number, any>(studioList.map((i: any): [number, any] => [i.id, i]))
  const otherMap = new Map<number, any>(otherList.map((i: any): [number, any] => [i.id, i]))
  const userAnimeMap = new Map<number, any>(userAnimeEntries.map((e: any): [number, any] => [e.animeId, formatEntry(e)]))
  const userMangaMap = new Map<number, any>(userMangaEntries.map((e: any): [number, any] => [e.mangaId, formatEntry(e)]))
  const userMovieMap = new Map<number, any>(userMovieEntries.map((e: any): [number, any] => [e.movieId, formatEntry(e)]))
  const userTvMap = new Map<number, any>(userTvEntries.map((e: any): [number, any] => [e.tvId, formatEntry(e)]))
  const userGameMap = new Map<number, any>(userGameEntries.map((e: any): [number, any] => [e.gameId, formatEntry(e)]))
  const userBookMap = new Map<number, any>(userBookEntries.map((e: any): [number, any] => [e.bookId, formatEntry(e)]))
  const userOtherMap = new Map<number, any>(userOtherEntries.map((e: any): [number, any] => [e.otherId, formatEntry(e)]))
  ```
- **6.** `[Return]`  — `rawFavorites.map((f) => { let title = '' let subtitle: string | null = null let coverImage: string | null = null let link = '' let format: string | null = null let userEntry: any = null ...)`

#### `getUserFavorites(targetIdentifier, query)` (L1421)
Get user favorites with pagination.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **3.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **4.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **5.** `[Sequence]` Database `query` on `Favorite` and stores it as `favQuery`
- **6.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawFavorites]`
- **7.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **8.** `[Sequence]` Define `hasMore`
  ```typescript
  const hasMore = page < totalPages
  ```
- **9.** `[Sequence]` Calls `this.enrichFavoritesWithEntities` and stores result as `favorites`
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "favorites": "<favorites>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getUserFavoritesByCategory(targetIdentifier, category, query)` (L1462)
Get user favorites filtered by category.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Define `normCategory`, `targetType`
  ```typescript
  const normCategory = category.toLowerCase().trim()
  const targetType = FAVORITE_TYPE_MAP[normCategory]
  ```
- **3.** `[If]` `!targetType`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid favorite category "${category}". Valid categories: anime, manga, movie, tv, game, book, music, other, character, person, studio, user.`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **5.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **6.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **7.** `[Sequence]` Database `query` on `Favorite` and stores it as `favQuery`
- **8.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawFavorites]`
- **9.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **10.** `[Sequence]` Define `hasMore`
  ```typescript
  const hasMore = page < totalPages
  ```
- **11.** `[Sequence]` Calls `this.enrichFavoritesWithEntities` and stores result as `favorites`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "favorites": "<favorites>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getAllUserFavorites(targetIdentifier, query)` (L1516)
Get all user favorites grouped by category at once (excludes music).

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limitPerCategory`
- **3.** `[Sequence]` Define `allowedTypes`
  ```typescript
  const allowedTypes: FavoriteType[] = [ 'ANIME', 'MANGA', 'MOVIE', 'TV', 'GAME', 'BOOK', ...
  ```
- **4.** `[Sequence]` Database `all` on `Favorite` and stores it as `rawFavorites`
- **5.** `[Sequence]` Calls `this.enrichFavoritesWithEntities` and stores result as `enriched`
- **6.** `[Sequence]` Define `categories`, `counts`
  ```typescript
  const categories: Record<string, any[]> = { anime: [], manga: [], movie: [], tv: [], game: [], book: [], ...
  const counts: Record<string, number> = { anime: 0, manga: 0, movie: 0, tv: 0, game: 0, book: 0, ...
  ```
- **7.** `[Loop]` Iterate `const fav` over `enriched`
  - **7.1.** `[Sequence]` Define `cat`
    ```typescript
    let cat = 'other'
    ```
  - **7.2.** `[If]` `fav.type === 'ANIME'`
    - **7.2.1.** `[Sequence]` Assign `cat`
      ```typescript
      cat = 'anime'
      ```
  - **7.3.** `[Else]` Otherwise
    - **7.3.1.** `[If]` `fav.type === 'MANGA'`
      - **7.3.1.1.** `[Sequence]` Assign `cat`
        ```typescript
        cat = 'manga'
        ```
    - **7.3.2.** `[Else]` Otherwise
      - **7.3.2.1.** `[If]` `fav.type === 'MOVIE'`
        - **7.3.2.1.1.** `[Sequence]` Assign `cat`
          ```typescript
          cat = 'movie'
          ```
      - **7.3.2.2.** `[Else]` Otherwise
        - **7.3.2.2.1.** `[If]` `fav.type === 'TV'`
          - **7.3.2.2.1.1.** `[Sequence]` Assign `cat`
            ```typescript
            cat = 'tv'
            ```
        - **7.3.2.2.2.** `[Else]` Otherwise
          - **7.3.2.2.2.1.** `[If]` `fav.type === 'GAME'`
            - **7.3.2.2.2.1.1.** `[Sequence]` Assign `cat`
              ```typescript
              cat = 'game'
              ```
          - **7.3.2.2.2.2.** `[Else]` Otherwise
            - **7.3.2.2.2.2.1.** `[If]` `fav.type === 'BOOK'`
              - **7.3.2.2.2.2.1.1.** `[Sequence]` Assign `cat`
                ```typescript
                cat = 'book'
                ```
            - **7.3.2.2.2.2.2.** `[Else]` Otherwise
              - **7.3.2.2.2.2.2.1.** `[If]` `fav.type === 'CHARACTER'`
                - **7.3.2.2.2.2.2.1.1.** `[Sequence]` Assign `cat`
                  ```typescript
                  cat = 'character'
                  ```
              - **7.3.2.2.2.2.2.2.** `[Else]` Otherwise
                - **7.3.2.2.2.2.2.2.1.** `[If]` `fav.type === 'PERSON'`
                  - **7.3.2.2.2.2.2.2.1.1.** `[Sequence]` Assign `cat`
                    ```typescript
                    cat = 'person'
                    ```
                - **7.3.2.2.2.2.2.2.2.** `[Else]` Otherwise
                  - **7.3.2.2.2.2.2.2.2.1.** `[If]` `fav.type === 'STUDIO'`
                    - **7.3.2.2.2.2.2.2.2.1.1.** `[Sequence]` Assign `cat`
                      ```typescript
                      cat = 'studio'
                      ```
                  - **7.3.2.2.2.2.2.2.2.2.** `[Else]` Otherwise
                    - **7.3.2.2.2.2.2.2.2.2.1.** `[If]` `fav.type === 'OTHER'`
                      - **7.3.2.2.2.2.2.2.2.2.1.1.** `[Sequence]` Assign `cat`
                        ```typescript
                        cat = 'other'
                        ```
  - **7.4.** `[Sequence]` Assign `counts[cat]`
    ```typescript
    counts[cat] = (counts[cat] || 0) + 1
    ```
  - **7.5.** `[Sequence]` Define `targetCategoryList`
    ```typescript
    const targetCategoryList = categories[cat]
    ```
  - **7.6.** `[If]` `targetCategoryList && targetCategoryList.length < limitPerCategory`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "favorites": "<categories>",
    "counts": "<counts as { anime: number manga: number movie: number tv: number game: number book: number ...>"
  }
  ```

#### `getUserFriends(targetIdentifier, query, viewerUserId)` (L1612)
Get user public friends with pagination.

- **1.** `[Sequence]` Calls `this.resolveUser` and stores result as `target`
- **2.** `[Sequence]` Define `isOwner`
  ```typescript
  const isOwner = viewerUserId === target.id
  ```
- **3.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **5.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **6.** `[Sequence]` Database `query` on `Friend` and stores it as `friendQuery`
- **7.** `[If]` `!isOwner`
  - **7.1.** `[Sequence]` Assign `friendQuery`
    ```typescript
    friendQuery = friendQuery.where({ isPrivate: false })
    ```
- **8.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawFriends]`
- **9.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **10.** `[Sequence]` Define `hasMore`, `friends`
  ```typescript
  const hasMore = page < totalPages
  const friends = rawFriends.map((f) => { const profile = getProfileCustomization(f.friend.customization) return { id: f.id, friendId: f.friendId, nickname: isOwner ? f.nickname : null, isPrivate: f.isPrivate, ...)
  ```
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "friends": "<friends>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `getMe(currentUserId)` (L1676)
Return full account info for authenticated user.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
- **2.** `[If]` `!dbUser`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "user": {
      "id": "<dbUser.id>",
      "username": "<dbUser.username>",
      "email": "<dbUser.email>",
      "customization": "<dbUser.customization as any>",
      "settings": "<dbUser.settings as any>",
      "permissions": [
        "<...dbUser.permissions>"
      ],
      "badges": [
        "<...dbUser.badges>"
      ],
      "TOTPEnabled": "<dbUser.TOTPEnabled>",
      "emailMfaEnabled": "<dbUser.emailMfaEnabled>",
      "publicKey": "<dbUser.publicKey>",
      "createdAt": "<toDate(dbUser.createdAt).toISOString()>",
      "updatedAt": "<toDate(dbUser.updatedAt).toISOString()>"
    }
  }
  ```

#### `updateMe(currentUserId, body)` (L1705)
Update account info, customization, settings, and assets for authenticated user.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `currentUser`
- **2.** `[If]` `!currentUser`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **3.** `[Sequence]` Define `updates`
  ```typescript
  const updates: Record<string, any> = {}
  ```
- **4.** `[If]` `body?.username`
  - **4.1.** `[Sequence]` Define `newUsername`
    ```typescript
    const newUsername = body.username.trim()
    ```
  - **4.2.** `[If]` `newUsername.toLowerCase() !== currentUser.username.toLowerCase()`
    - **4.2.1.** `[Sequence]` Database `first` on `User` and stores it as `existingUser`
    - **4.2.2.** `[If]` `existingUser`
      - **4.2.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Username "${newUsername}" is already taken`
    - **4.2.3.** `[Sequence]` Assign `updates.username`
      ```typescript
      updates.username = newUsername
      ```
- **5.** `[If]` `body?.email`
  - **5.1.** `[Sequence]` Define `newEmail`
    ```typescript
    const newEmail = body.email.trim().toLowerCase()
    ```
  - **5.2.** `[If]` `newEmail !== currentUser.email.toLowerCase()`
    - **5.2.1.** `[Sequence]` Database `first` on `User` and stores it as `existingEmail`
    - **5.2.2.** `[If]` `existingEmail`
      - **5.2.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Email "${newEmail}" is already in use`
    - **5.2.3.** `[Sequence]` Assign `updates.email`
      ```typescript
      updates.email = newEmail
      ```
- **6.** `[Sequence]` Define `currentCustomization`
  ```typescript
  let currentCustomization = body?.customization !== undefined ? body.customization : currentUser.customization
  ```
- **7.** `[If]` `body?.assets`
  - **7.1.** `[Sequence]` Define `patchAssets`
    ```typescript
    const patchAssets: Record<string, string | null> = {}
    ```
  - **7.2.** `[If]` `body.assets.avatarUrl !== undefined`
    - **7.2.1.** `[Sequence]` Assign `patchAssets.avatarUrl`
      ```typescript
      patchAssets.avatarUrl = body.assets.avatarUrl
      ```
  - **7.3.** `[If]` `body.assets.bannerUrl !== undefined`
    - **7.3.1.** `[Sequence]` Assign `patchAssets.bannerUrl`
      ```typescript
      patchAssets.bannerUrl = body.assets.bannerUrl
      ```
  - **7.4.** `[If]` `body.assets.bannerOverlayUrl !== undefined`
    - **7.4.1.** `[Sequence]` Assign `patchAssets.bannerOverlayUrl`
      ```typescript
      patchAssets.bannerOverlayUrl = body.assets.bannerOverlayUrl
      ```
  - **7.5.** `[If]` `body.assets.nameplateUrl !== undefined`
    - **7.5.1.** `[Sequence]` Assign `patchAssets.nameplateUrl`
      ```typescript
      patchAssets.nameplateUrl = body.assets.nameplateUrl
      ```
  - **7.6.** `[If]` `body.assets.avatarFrame !== undefined`
    - **7.6.1.** `[Sequence]` Assign `patchAssets.avatarFrame`
      ```typescript
      patchAssets.avatarFrame = body.assets.avatarFrame
      ```
  - **7.7.** `[Sequence]` Assign `currentCustomization`
    ```typescript
    currentCustomization = setProfileCustomization( currentCustomization ?? {}, patchAssets )
    ```
- **8.** `[If]` `currentCustomization !== undefined`
  - **8.1.** `[Sequence]` Assign `updates.customization`
    ```typescript
    updates.customization = currentCustomization as any
    ```
- **9.** `[If]` `body?.settings !== undefined`
  - **9.1.** `[Sequence]` Define `existingSettings`, `patchSettings`
    ```typescript
    const existingSettings = typeof currentUser.settings === 'object' && currentUser.settings !== null ? (currentUser.settings as Record<string, unknown>) : {}
    const patchSettings = typeof body.settings === 'object' && body.settings !== null ? (body.settings as Record<string, unknown>) : {}
    ```
  - **9.2.** `[Sequence]` Assign `updates.settings`
    ```typescript
    updates.settings = { ...existingSettings, ...patchSettings } as any
    ```
- **10.** `[Sequence]` Database `update` on `User` and stores it as `updatedUser`
- **11.** `[If]` `!updatedUser`
  - **11.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Account updated successfully",
    "user": {
      "id": "<updatedUser.id>",
      "username": "<updatedUser.username>",
      "email": "<updatedUser.email>",
      "customization": "<updatedUser.customization as any>",
      "settings": "<updatedUser.settings as any>",
      "permissions": [
        "<...updatedUser.permissions>"
      ],
      "badges": [
        "<...updatedUser.badges>"
      ],
      "TOTPEnabled": "<updatedUser.TOTPEnabled>",
      "emailMfaEnabled": "<updatedUser.emailMfaEnabled>",
      "publicKey": "<updatedUser.publicKey>",
      "createdAt": "<toDate(updatedUser.createdAt).toISOString()>",
      "updatedAt": "<toDate(updatedUser.updatedAt).toISOString()>"
    }
  }
  ```

#### `uploadAsset(userId, body)` (L1830)
Upload user asset (avatar, banner, etc.) to RustFS S3 storage.

- **1.** `[Sequence]` Define `{ file, assetType }`, `allowedTypes`
  ```typescript
  const { file, assetType } = body
  const allowedTypes = [ 'image/jpeg', 'image/png', 'image/webp', 'image/gif', ]
  ```
- **2.** `[If]` `!allowedTypes.includes(file.type)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Unsupported file format. Please upload JPEG, PNG, WebP, or GIF.'
- **3.** `[Sequence]` Define `maxSizeBytes`
  ```typescript
  const maxSizeBytes = 10 * 1024 * 1024
  ```
- **4.** `[If]` `file.size > maxSizeBytes`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'File size exceeds 10MB limit.'
- **5.** `[Try]` Try block
  - **5.1.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **5.2.** `[If]` `user`
    - **5.2.1.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
    - **5.2.2.** `[Sequence]` Define `oldUrl`
      ```typescript
      let oldUrl: string | null | undefined = null
      ```
    - **5.2.3.** `[If]` `assetType === 'avatar'`
      - **5.2.3.1.** `[Sequence]` Assign `oldUrl`
        ```typescript
        oldUrl = profile.avatarUrl
        ```
    - **5.2.4.** `[Else]` Otherwise
      - **5.2.4.1.** `[If]` `assetType === 'banner'`
        - **5.2.4.1.1.** `[Sequence]` Assign `oldUrl`
          ```typescript
          oldUrl = profile.bannerUrl
          ```
      - **5.2.4.2.** `[Else]` Otherwise
        - **5.2.4.2.1.** `[If]` `assetType === 'bannerOverlay'`
          - **5.2.4.2.1.1.** `[Sequence]` Assign `oldUrl`
            ```typescript
            oldUrl = profile.bannerOverlayUrl
            ```
        - **5.2.4.2.2.** `[Else]` Otherwise
          - **5.2.4.2.2.1.** `[If]` `assetType === 'nameplate' || assetType === 'sidebarBanner'`
            - **5.2.4.2.2.1.1.** `[Sequence]` Assign `oldUrl`
              ```typescript
              oldUrl = profile.nameplateUrl || profile.sidebarBannerUrl
              ```
          - **5.2.4.2.2.2.** `[Else]` Otherwise
            - **5.2.4.2.2.2.1.** `[If]` `assetType === 'avatarFrame'`
              - **5.2.4.2.2.2.1.1.** `[Sequence]` Assign `oldUrl`
                ```typescript
                oldUrl = profile.avatarFrame
                ```
    - **5.2.5.** `[If]` `oldUrl`
      - **5.2.5.1.** `[Sequence]` Calls `extractS3Key` and stores result as `oldKey`
      - **5.2.5.2.** `[If]` `oldKey && oldKey.startsWith(`users/${userId}/`)`
        - **5.2.5.2.1.** `[Sequence]` Calls `deletePublicAsset`
- **6.** `[Catch]` Catch (`cleanupErr`)
  - **6.1.** `[Warning]` Logs warning — '[Assets] Warning during old asset cleanup:', cleanupErr
- **7.** `[Sequence]` Define `ext`
  ```typescript
  let ext = 'png'
  ```
- **8.** `[If]` `file.type === 'image/jpeg'`
  - **8.1.** `[Sequence]` Assign `ext`
    ```typescript
    ext = 'jpg'
    ```
- **9.** `[Else]` Otherwise
  - **9.1.** `[If]` `file.type === 'image/webp'`
    - **9.1.1.** `[Sequence]` Assign `ext`
      ```typescript
      ext = 'webp'
      ```
  - **9.2.** `[Else]` Otherwise
    - **9.2.1.** `[If]` `file.type === 'image/gif'`
      - **9.2.1.1.** `[Sequence]` Assign `ext`
        ```typescript
        ext = 'gif'
        ```
- **10.** `[Sequence]` Define `key`
  ```typescript
  const key = `users/${userId}/${assetType}-${Date.now()}.${ext}`
  ```
- **11.** `[Sequence]` Calls `Buffer.from` and stores result as `buffer`
- **12.** `[If]` `!matchesImageMagicBytes(buffer, file.type)`
  - **12.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Uploaded file contents do not match the declared image format.'
- **13.** `[Sequence]` Calls `uploadPublicAsset` and stores result as `{ publicUrl }`
- **14.** `[Return]` 
  ```json
  {
    "success": true,
    "url": "<publicUrl>",
    "key": "<key>",
    "assetType": "<assetType>"
  }
  ```

#### `deleteAsset(userId, key)` (L1912)
Delete user asset from RustFS S3 storage.

- **1.** `[Sequence]` Define `targetKey`
  ```typescript
  const targetKey = extractS3Key(key) || key
  ```
- **2.** `[If]` `!targetKey.startsWith(`users/${userId}/`)`
  - **2.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Cannot delete another user's asset'
- **3.** `[Sequence]` Calls `deletePublicAsset` and stores result as `success`
- **4.** `[Return]` 
  ```json
  {
    "success": "<success>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `Forbidden`, `NotFound`
- [core/utils/s3.ts](../../../core/utils/s3.md) ([[core/utils/s3]]) — `uploadPublicAsset`, `deletePublicAsset`, `extractS3Key`
- [apps/carina/activity/activity.serv.ts](../activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `countOf`, `toDate`, `ActivityType`, `FavoriteType`, `MediaType`
- `@NamelessLiberty/shared` — `getBadgeById`, `getProfileCustomization`, `setProfileCustomization`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/borealis/lists/lists.serv.ts](../../borealis/lists/lists.serv.md) ([[apps/borealis/lists/lists.serv]]) — `CarinaUsersServ`
- [apps/borealis/playlists/playlists.serv.ts](../../borealis/playlists/playlists.serv.md) ([[apps/borealis/playlists/playlists.serv]]) — `CarinaUsersServ`
- [apps/carina/connections/connections.serv.ts](../connections/connections.serv.md) ([[apps/carina/connections/connections.serv]]) — `CarinaUsersServ`
- [apps/carina/favorites/favorites.ctrl.ts](../favorites/favorites.ctrl.md) ([[apps/carina/favorites/favorites.ctrl]]) — `CarinaUsersServ`
- [apps/carina/users/users.ctrl.ts](./users.ctrl.md) ([[apps/carina/users/users.ctrl]]) — `CarinaUsersServ`
