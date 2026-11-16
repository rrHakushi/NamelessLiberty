# playlists.serv.ts

- **Source**: [`apps/borealis/playlists/playlists.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/playlists/playlists.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisPlaylistsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface ListPlaylistsQuery` (L9)

### `interface GetEntriesQuery` (L18)

### `class BorealisPlaylistsServ` extends `BaseService` (L80)

#### `getPlaylistAccess(playlistId, userId)` (L84)
Helper to check access levels (Owner, Editor, Viewer) for a custom playlist.

- **1.** `[Sequence]` Database `first` on `CustomList` and stores it as `playlist`
- **2.** `[If]` `!playlist`
  - **2.1.** `[Return]` 
    ```json
    {
      "playlist": null,
      "canView": false,
      "canEdit": false,
      "isOwner": false,
      "role": null
    }
    ```
- **3.** `[Sequence]` Define `isOwner`, `collab`, `role`, `canEdit`, `canView`
  ```typescript
  const isOwner = playlist.userId === userId
  const collab = (playlist.collaborators as any[])?.find((c: any) => c.userId === userId)
  const role: 'OWNER' | 'EDITOR' | 'VIEWER' | null = isOwner ? 'OWNER' : collab ? (collab.role as 'EDITOR' | 'VIEWER') : null
  const canEdit = isOwner || role === 'EDITOR'
  const canView = isOwner || !!role || !playlist.isPrivate
  ```
- **4.** `[Return]` 
  ```json
  {
    "playlist": "<playlist>",
    "canView": "<canView>",
    "canEdit": "<canEdit>",
    "isOwner": "<isOwner>",
    "role": "<role>"
  }
  ```

#### `listPlaylists(userId, query)` (L118)
List custom playlists belonging to the user or where user is a collaborator.

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `all` on `CustomListCollaborator` and stores it as `collabRecords`
- **5.** `[Sequence]` Define `collabListIds`, `collabRoleMap`
  ```typescript
  const collabListIds = collabRecords.map((c: any) => c.listId)
  const collabRoleMap = new Map<string, string>( collabRecords.map((c: any) => [c.listId, c.role]) )
  ```
- **6.** `[Sequence]` Database `query` on `CustomList` and stores it as `q`
- **7.** `[If]` `collabListIds.length > 0`
  - **7.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((cl) => or(cl.userId.eq(userId), cl.id.in(collabListIds)))
    ```
- **8.** `[Else]` Otherwise
  - **8.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ userId })
    ```
- **9.** `[If]` `query?.q`
  - **9.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((cl) => cl.name.ilike(`%${query.q!.trim()}%`))
    ```
- **10.** `[If]` `query?.isPrivate !== undefined`
  - **10.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ isPrivate: Boolean(query.isPrivate) })
    ```
- **11.** `[Sequence]` Calls `Promise.all` and stores result as `[total, playlists]`
- **12.** `[Sequence]` Define `playlistIds`, `coversMap`
  ```typescript
  const playlistIds = playlists.map((p: any) => p.id)
  const coversMap = new Map<string, string[]>()
  ```
- **13.** `[If]` `playlistIds.length > 0`
  - **13.1.** `[Try]` Try block
    - **13.1.1.** `[Sequence]` Database `all` on `CustomListEntry` and stores it as `topEntries`
    - **13.1.2.** `[Loop]` Iterate `const entry` over `topEntries`
      - **13.1.2.1.** `[Sequence]` Define `cover`
        ```typescript
        const cover = (entry as any).anime?.coverImage || (entry as any).manga?.coverImage || (entry as any).movie?.coverImage || (entry as any).tv?.coverImage || (entry as any).game?.coverImage || (entry as any).book?.coverImage || (entry as any).music?.coverImage || null
        ```
      - **13.1.2.2.** `[If]` `cover`
        - **13.1.2.2.1.** `[Sequence]` Define `list`
          ```typescript
          const list = coversMap.get(entry as any.listId) || []
          ```
        - **13.1.2.2.2.** `[If]` `list.length < 5`
          - **13.1.2.2.2.1.** `[Sequence]` Calls `coversMap.set`
  - **13.2.** `[Catch]` Catch (`err`)
    - **13.2.1.** `[Sequence]` Calls `console.error`
- **14.** `[Sequence]` Define `containing`
  ```typescript
  let containing = new Set<string>()
  ```
- **15.** `[If]` `query?.mediaType && query?.mediaId && playlists.length > 0`
  - **15.1.** `[Sequence]` Define `mType`
    ```typescript
    const mType = String(query.mediaType).toUpperCase() as MediaType
    ```
  - **15.2.** `[Sequence]` Calls `Number` and stores result as `mId`
  - **15.3.** `[Sequence]` Database `all` on `CustomListEntry` and stores it as `entries`
  - **15.4.** `[Sequence]` Define `ids`
    ```typescript
    const ids = new Set(playlists.map((p: any) => p.id))
    ```
  - **15.5.** `[Sequence]` Assign `containing`
    ```typescript
    containing = new Set( entries.map((e: any) => e.listId).filter((id: string) => ids.has(id)) )
    ```
- **16.** `[Sequence]` Calls `Boolean` and stores result as `checkMembership`
- **17.** `[Return]` 
  ```json
  {
    "success": true,
    "playlists": "<playlists.map((p: any) => { const isOwner = p.userId === userId const role = isOwner ? 'OWNER' : (collabRoleMap.get(p.id) || 'VIEWER') const owner = formatUser(p.user) return { ...formatPlaylist(p, undefined, role, isOwner, owner, coversMap.get(p.id) || []), ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `createPlaylist(userId, body)` (L240)
Create a new custom playlist for the user.

- **1.** `[Sequence]` Define `name`
  ```typescript
  const name = body.name.trim()
  ```
- **2.** `[If]` `!name`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Playlist name cannot be empty'
- **3.** `[Sequence]` Database `create` on `CustomList` and stores it as `created`
- **4.** `[Sequence]` Database `create` on `ActivityLog`
- **5.** `[Sequence]` Calls `CarinaUsersServ.evaluateBadgesNonBlocking`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Playlist created successfully",
    "playlist": "<formatPlaylist(created, 0, 'OWNER', ...)>"
  }
  ```

#### `updatePlaylist(userId, playlistId, body)` (L290)
Update details of an existing playlist (owner or editor).

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canEdit`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to edit this playlist'
- **4.** `[Sequence]` Define `updateData`
  ```typescript
  const updateData: any = {}
  ```
- **5.** `[If]` `body.name !== undefined`
  - **5.1.** `[Sequence]` Define `trimmed`
    ```typescript
    const trimmed = body.name.trim()
    ```
  - **5.2.** `[If]` `!trimmed`
    - **5.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Playlist name cannot be empty'
  - **5.3.** `[Sequence]` Assign `updateData.name`
    ```typescript
    updateData.name = trimmed
    ```
- **6.** `[If]` `body.description !== undefined`
  - **6.1.** `[Sequence]` Assign `updateData.description`
    ```typescript
    updateData.description = body.description
    ```
- **7.** `[If]` `body.isPrivate !== undefined`
  - **7.1.** `[If]` `!access.isOwner`
    - **7.1.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the list owner can change playlist privacy'
  - **7.2.** `[Sequence]` Assign `updateData.isPrivate`
    ```typescript
    updateData.isPrivate = Boolean(body.isPrivate)
    ```
- **8.** `[If]` `body.coverImage !== undefined`
  - **8.1.** `[Sequence]` Assign `updateData.coverImage`
    ```typescript
    updateData.coverImage = body.coverImage
    ```
- **9.** `[If]` `body.order !== undefined`
  - **9.1.** `[Sequence]` Assign `updateData.order`
    ```typescript
    updateData.order = Number(body.order)
    ```
- **10.** `[Sequence]` Database `update` on `CustomList` and stores it as `updated`
- **11.** `[If]` `body.isPrivate !== undefined`
  - **11.1.** `[Sequence]` Calls `Boolean` and stores result as `nextPrivate`
  - **11.2.** `[Sequence]` Database `all` on `CustomListCollaborator` and stores it as `collabs`
  - **11.3.** `[Sequence]` Calls `Array.from` and stores result as `memberIds`
  - **11.4.** `[Sequence]` Database `all` on `ActivityLog`
- **12.** `[Sequence]` Database `all` on `CustomListEntry` and stores it as `count`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Playlist updated successfully",
    "playlist": "<formatPlaylist(updated, count.length, access.role || 'EDITOR', ...)>"
  }
  ```

#### `deletePlaylist(userId, playlistId)` (L372)
Delete a playlist (strictly owner only).

- **1.** `[Sequence]` Database `first` on `CustomList` and stores it as `existing`
- **2.** `[If]` `!existing`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `existing.userId !== userId`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the list owner can delete this playlist'
- **4.** `[Sequence]` Database `delete` on `CustomList`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Playlist deleted successfully"
  }
  ```

#### `getPlaylistEntries(userId, playlistId, query)` (L396)
Get entries of a playlist with pagination and resolved media details.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canView`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Access to this playlist is denied'
- **4.** `[Sequence]` Define `playlist`
  ```typescript
  const playlist = access.playlist
  ```
- **5.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **6.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **7.** `[Sequence]` Define `skip`, `order`
  ```typescript
  const skip = page - 1 * limit
  const order = query?.order === 'desc' ? 'desc' : 'asc'
  ```
- **8.** `[Sequence]` Database `query` on `CustomListEntry` and stores it as `q`
- **9.** `[If]` `query?.mediaType`
  - **9.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ mediaType: query.mediaType.toUpperCase() as MediaType })
    ```
- **10.** `[If]` `query?.q`
  - **10.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((cle) => cle.customNotes.ilike(`%${query.q!.trim()}%`))
    ```
- **11.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **12.** `[If]` `query?.sortBy === 'addedAt'`
  - **12.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((cle) => order === 'desc' ? cle.addedAt.desc() : cle.addedAt.asc() )
    ```
- **13.** `[Else]` Otherwise
  - **13.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((cle) => order === 'desc' ? cle.order.desc() : cle.order.asc() )
    ```
- **14.** `[Sequence]` Calls `Promise.all` and stores result as `[total, entries]`
- **15.** `[Return]` 
  ```json
  {
    "success": true,
    "playlist": {
      "id": "<playlist.id>",
      "name": "<playlist.name>",
      "description": "<playlist.description ?? null>",
      "isPrivate": "<playlist.isPrivate>",
      "coverImage": "<playlist.coverImage ?? null>",
      "entriesCount": "<total>",
      "role": "<access.role || 'VIEWER'>",
      "isOwner": "<access.isOwner>"
    },
    "items": "<entries.map((item) => { const media = item.anime || item.manga || item.movie || item.tv || item.game || ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `addPlaylistEntry(userId, playlistId, body)` (L562)
Add a media entry to the playlist (owner or editor).

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canEdit`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to add entries to this playlist'
- **4.** `[Sequence]` Define `mediaType`
  ```typescript
  const mediaType = body.mediaType.toUpperCase() as MediaType
  ```
- **5.** `[Sequence]` Calls `Number` and stores result as `mediaId`
- **6.** `[If]` `!mediaId || isNaN(mediaId)`
  - **6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Valid mediaId is required'
- **7.** `[Sequence]` Define `order`
  ```typescript
  let order = body.order
  ```
- **8.** `[If]` `order === undefined`
  - **8.1.** `[Sequence]` Database `first` on `CustomListEntry` and stores it as `highest`
  - **8.2.** `[Sequence]` Assign `order`
    ```typescript
    order = (highest?.order ?? 0) + 1
    ```
- **9.** `[Sequence]` Define `isMusic`
  ```typescript
  const isMusic = ['MUSIC', 'MUSIC_ALBUM', 'MUSIC_TRACK'].includes(mediaType)
  ```
- **10.** `[Sequence]` Database `first` on `CustomListEntry` and stores it as `existingEntry`
- **11.** `[Sequence]` Define `entry`
  ```typescript
  let entry: any
  ```
- **12.** `[If]` `existingEntry`
  - **12.1.** `[Sequence]` Assign `entry`
    ```typescript
    entry = await prisma.orm.public.CustomListEntry .where({ id: existingEntry.id }) .update({ order, ...(body.customNotes !== undefined ? { customNotes: body.customNotes } : {}), ...
    ```
- **13.** `[Else]` Otherwise
  - **13.1.** `[Sequence]` Assign `entry`
    ```typescript
    entry = await prisma.orm.public.CustomListEntry.create({ listId: playlistId, mediaType, mediaId, order, customNotes: body.customNotes ? body.customNotes ...
    ```
- **14.** `[Sequence]` Calls `Boolean` and stores result as `playlistIsPrivate`
- **15.** `[Sequence]` Define `listName`
  ```typescript
  const listName = access.playlist.name
  ```
- **16.** `[Sequence]` Database `create` on `ActivityLog`
- **17.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Entry added to playlist successfully",
    "entry": "<formatEntry(entry, userId)>"
  }
  ```

#### `updatePlaylistEntry(userId, playlistId, body)` (L666)
Update an entry in the playlist (order, notes, or batch reorder).

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canEdit`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to modify entries in this playlist'
- **4.** `[If]` `body.reorder && Array.isArray(body.reorder)`
  - **4.1.** `[Loop]` Iterate `const item` over `body.reorder`
    - **4.1.1.** `[Sequence]` Database `update` on `CustomListEntry`
  - **4.2.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Playlist entries reordered successfully",
      "entry": null
    }
    ```
- **5.** `[Sequence]` Define `entry`
  ```typescript
  let entry: any = null
  ```
- **6.** `[If]` `body.id`
  - **6.1.** `[Sequence]` Assign `entry`
    ```typescript
    entry = await prisma.orm.public.CustomListEntry .where({ id: body.id, listId: playlistId }) .first()
    ```
- **7.** `[Else]` Otherwise
  - **7.1.** `[If]` `body.mediaType && body.mediaId`
    - **7.1.1.** `[Sequence]` Assign `entry`
      ```typescript
      entry = await prisma.orm.public.CustomListEntry .where({ listId: playlistId, mediaType: body.mediaType.toUpperCase() as MediaType, mediaId: Number(body.mediaId), }) .first()
      ```
- **8.** `[If]` `!entry`
  - **8.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Playlist entry not found'
- **9.** `[Sequence]` Define `updateData`
  ```typescript
  const updateData: any = {}
  ```
- **10.** `[If]` `body.order !== undefined`
  - **10.1.** `[Sequence]` Assign `updateData.order`
    ```typescript
    updateData.order = Number(body.order)
    ```
- **11.** `[If]` `body.customNotes !== undefined`
  - **11.1.** `[Sequence]` Assign `updateData.customNotes`
    ```typescript
    updateData.customNotes = body.customNotes
    ```
- **12.** `[Sequence]` Database `update` on `CustomListEntry` and stores it as `updated`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Playlist entry updated successfully",
    "entry": "<formatEntry(updated, userId)>"
  }
  ```

#### `removePlaylistEntry(userId, playlistId, target)` (L739)
Remove an entry from the playlist.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canEdit`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to remove entries from this playlist'
- **4.** `[Sequence]` Define `entry`
  ```typescript
  let entry: any = null
  ```
- **5.** `[If]` `target.id`
  - **5.1.** `[Sequence]` Assign `entry`
    ```typescript
    entry = await prisma.orm.public.CustomListEntry .where({ id: target.id, listId: playlistId }) .first()
    ```
- **6.** `[Else]` Otherwise
  - **6.1.** `[If]` `target.mediaType && target.mediaId`
    - **6.1.1.** `[Sequence]` Assign `entry`
      ```typescript
      entry = await prisma.orm.public.CustomListEntry .where({ listId: playlistId, mediaType: target.mediaType.toUpperCase() as MediaType, mediaId: Number(target.mediaId), }) .first()
      ```
- **7.** `[If]` `!entry`
  - **7.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Playlist entry not found'
- **8.** `[Sequence]` Database `delete` on `CustomListEntry`
- **9.** `[Sequence]` Calls `Boolean` and stores result as `playlistIsPrivate`
- **10.** `[Sequence]` Define `listName`
  ```typescript
  const listName = access.playlist.name
  ```
- **11.** `[Sequence]` Database `create` on `ActivityLog`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Entry removed from playlist successfully"
  }
  ```

#### `reorderEntries(userId, playlistId, entryIds)` (L813)
Reorder entries in bulk by passing ordered array of entry IDs.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canEdit`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to reorder this playlist'
- **4.** `[Loop]` Loop `i < entryIds.length`
  - **4.1.** `[Sequence]` Database `update` on `CustomListEntry`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Playlist entries reordered successfully"
  }
  ```

#### `listCollaborators(userId, playlistId)` (L837)
List collaborators of a playlist.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canView`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Access denied'
- **4.** `[Sequence]` Database `all` on `CustomListCollaborator` and stores it as `collabs`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "collaborators": "<collabs.map((c: any) => ({ id: c.id, userId: c.userId, role: c.role, createdAt: toDate(c.createdAt).toISOString(), user: formatUser(c.user) || { id: c.userId, ...)>"
  }
  ```

#### `addCollaborator(userId, playlistId, body)` (L871)
Add a collaborator by username (Owner only).

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.isOwner`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the list owner can add collaborators'
- **4.** `[Sequence]` Define `username`
  ```typescript
  const username = body.username.trim()
  ```
- **5.** `[Sequence]` Database `first` on `User` and stores it as `target`
- **6.** `[If]` `!target`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User @${username} not found`
- **7.** `[If]` `target.id === userId`
  - **7.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'You cannot add yourself as a collaborator'
- **8.** `[Sequence]` Database `first` on `CustomListCollaborator` and stores it as `existing`
- **9.** `[If]` `existing`
  - **9.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `@${target.username} is already a collaborator on this list`
- **10.** `[Sequence]` Define `role`
  ```typescript
  const role = body.role || 'EDITOR'
  ```
- **11.** `[Sequence]` Database `create` on `CustomListCollaborator` and stores it as `collab`
- **12.** `[Sequence]` Database `create` on `ActivityLog`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "<`Added @${target.username} as collaborator`>",
    "collaborator": {
      "id": "<collab.id>",
      "userId": "<collab.userId>",
      "role": "<collab.role>",
      "createdAt": "<toDate(collab.createdAt).toISOString()>",
      "user": "<formatUser(target)!>"
    }
  }
  ```

#### `updateCollaborator(userId, playlistId, collaboratorId, role)` (L944)
Update a collaborator's role (Owner only).

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.isOwner`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the list owner can update collaborator roles'
- **4.** `[Sequence]` Database `first` on `CustomListCollaborator` and stores it as `collab`
- **5.** `[If]` `!collab`
  - **5.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Collaborator not found'
- **6.** `[Sequence]` Database `update` on `CustomListCollaborator` and stores it as `updated`
- **7.** `[If]` `!updated`
  - **7.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Failed to update collaborator'
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Collaborator role updated successfully",
    "collaborator": {
      "id": "<updated.id>",
      "userId": "<updated.userId>",
      "role": "<updated.role>",
      "createdAt": "<toDate(updated.createdAt).toISOString()>"
    }
  }
  ```

#### `removeCollaborator(userId, playlistId, collaboratorId)` (L989)
Remove a collaborator (Owner or the collaborator leaving).

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[Sequence]` Database `first` on `CustomListCollaborator` and stores it as `collab`
- **4.** `[If]` `!collab`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Collaborator not found'
- **5.** `[If]` `!access.isOwner && collab.userId !== userId`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to remove this collaborator'
- **6.** `[Sequence]` Database `delete` on `CustomListCollaborator`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Collaborator removed successfully"
  }
  ```

#### `listComments(userId, playlistId, query)` (L1024)
List comments on a custom playlist.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canView`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Access denied'
- **4.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **5.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **6.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **7.** `[Sequence]` Database `query` on `ListComment` and stores it as `commentQ`
- **8.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawComments]`
- **9.** `[Sequence]` Define `comments`
  ```typescript
  const comments = rawComments.map((c: any) => ({ id: c.id, listOwnerId: c.listOwnerId, customListId: c.customListId, authorId: c.authorId, content: c.content, isSpoiler: c.isSpoiler, ...)
  ```
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "comments": "<comments>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<page * limit < total>"
    }
  }
  ```

#### `createComment(userId, playlistId, body)` (L1095)
Post a comment on a custom playlist.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canView`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Access denied'
- **4.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = body.content.trim()
  ```
- **5.** `[If]` `!trimmed`
  - **5.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Comment content cannot be empty'
- **6.** `[Sequence]` Database `create` on `ListComment` and stores it as `created`
- **7.** `[Sequence]` Database `first` on `ListComment` and stores it as `comment`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "comment": {
      "id": "<comment!.id>",
      "listOwnerId": "<comment!.listOwnerId>",
      "customListId": "<comment!.customListId>",
      "authorId": "<comment!.authorId>",
      "content": "<comment!.content>",
      "isSpoiler": "<comment!.isSpoiler>",
      "createdAt": "<toDate(comment!.createdAt).toISOString()>",
      "updatedAt": "<toDate(comment!.updatedAt).toISOString()>",
      "author": "<formatUser(comment as any.author)>",
      "reply": null
    }
  }
  ```

#### `deleteComment(user, playlistId, commentId)` (L1147)
Delete a comment on a custom playlist.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[Sequence]` Database `first` on `ListComment` and stores it as `comment`
- **4.** `[If]` `!comment`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Comment not found'
- **5.** `[Sequence]` Define `isAuthor`, `isOwner`
  ```typescript
  const isAuthor = comment.authorId === user.id
  const isOwner = access.isOwner
  ```
- **6.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **7.** `[If]` `!isAuthor && !isOwner && !isAdmin`
  - **7.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this comment'
- **8.** `[Sequence]` Database `delete` on `ListComment`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Comment deleted successfully"
  }
  ```

#### `listActivity(userId, playlistId, query, permissions = [])` (L1184)
Get chronological activity log for a custom playlist.

- **1.** `[Sequence]` Calls `this.getPlaylistAccess` and stores result as `access`
- **2.** `[If]` `!access.playlist`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Playlist with ID ${playlistId} not found`
- **3.** `[If]` `!access.canView`
  - **3.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Access denied'
- **4.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **5.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **6.** `[Sequence]` Define `skip`, `collaboratorIds`
  ```typescript
  const skip = page - 1 * limit
  const collaboratorIds = access.playlist.collaborators as any[] || [].map((c: any) => c.userId)
  ```
- **7.** `[Sequence]` Calls `Array.from` and stores result as `memberIds`
- **8.** `[Sequence]` Database `all` on `ActivityLog` and stores it as `rawMemberLogs`
- **9.** `[Sequence]` Define `matchingLogs`
  ```typescript
  const matchingLogs = rawMemberLogs.filter((l: any) => l.metadata && (l.metadata as any).customListId === playlistId)
  ```
- **10.** `[Sequence]` Calls `new IRISBitField(permissions).has` and stores result as `isAdmin`
- **11.** `[Sequence]` Define `total`
  ```typescript
  const total = matchingLogs.length
  ```
- **12.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **13.** `[Sequence]` Define `hasMore`, `pageSlice`
  ```typescript
  const hasMore = page < totalPages
  const pageSlice = matchingLogs.slice(skip, skip + limit)
  ```
- **14.** `[Sequence]` Calls `ActivityServ.formatActivityEntries` and stores result as `listLogs`
- **15.** `[If]` `total === 0 && page === 1`
  - **15.1.** `[Sequence]` Assign `listLogs`
    ```typescript
    listLogs = await ActivityServ.formatActivityEntries( [ { id: `created-${access.playlist.id}`, userId: access.playlist.userId, type: 'CUSTOM_LIST_CREATED', mediaType: null, ...
    ```
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "activity": "<listLogs>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total === 0 ? 1 : total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`, `Forbidden`
- [apps/carina/activity/activity.serv.ts](../../carina/activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`
- [apps/carina/users/users.serv.ts](../../carina/users/users.serv.md) ([[apps/carina/users/users.serv]]) — `CarinaUsersServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `toDate`, `or`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/borealis/playlists/playlists.ctrl.ts](./playlists.ctrl.md) ([[apps/borealis/playlists/playlists.ctrl]]) — `BorealisPlaylistsServ`
