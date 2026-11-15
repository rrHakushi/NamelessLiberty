# friends.serv.ts

- **Source**: [`apps/carina/friends/friends.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/friends/friends.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaFriendsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaFriendsServ` extends `BaseService` (L19)

#### `listFriends(currentUserId, query)` (L23)
Get friends list for authenticated user with pagination.

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `query` on `Friend` and stores it as `friendsQuery`
- **5.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawFriends, rawIncoming, rawOutgoing, rawBlocked]`
- **6.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **7.** `[Sequence]` Define `hasMore`, `friends`, `incomingRequests`, `outgoingRequests`, `blockedUsers`
  ```typescript
  const hasMore = page < totalPages
  const friends = rawFriends.map((f) => { const profile = getProfileCustomization(f.friend.customization) return { id: f.id, friendId: f.friendId, nickname: f.nickname, isPrivate: f.isPrivate, ...)
  const incomingRequests = rawIncoming.map((r) => { const senderProfile = getProfileCustomization(r.sender.customization) return { id: r.id, senderId: r.senderId, message: r.message, createdAt: toDate(r.createdAt).toISOString(), ...)
  const outgoingRequests = rawOutgoing.map((r) => { const receiverProfile = getProfileCustomization(r.receiver.customization) return { id: r.id, receiverId: r.receiverId, message: r.message, createdAt: toDate(r.createdAt).toISOString(), ...)
  const blockedUsers = rawBlocked.map((b) => { const blockedProfile = getProfileCustomization(b.blocked.customization) return { id: b.id, blockedId: b.blockedId, createdAt: toDate(b.createdAt).toISOString(), blocked: { ...)
  ```
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "friends": "<friends>",
    "incomingRequests": "<incomingRequests>",
    "outgoingRequests": "<outgoingRequests>",
    "blockedUsers": "<blockedUsers>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `updateFriend(currentUserId, friendId, body)` (L184)
Update friend relationship (privacy, nickname).

- **1.** `[Sequence]` Define `trimmedId`
  ```typescript
  const trimmedId = friendId.trim()
  ```
- **2.** `[Sequence]` Database `first` on `Friend` and stores it as `existing`
- **3.** `[If]` `!existing`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Friend not found'
- **4.** `[Sequence]` Define `data`
  ```typescript
  const data: { isPrivate?: boolean; nickname?: string | null } = {}
  ```
- **5.** `[If]` `body.isPrivate !== undefined`
  - **5.1.** `[Sequence]` Assign `data.isPrivate`
    ```typescript
    data.isPrivate = Boolean(body.isPrivate)
    ```
- **6.** `[If]` `body.nickname !== undefined`
  - **6.1.** `[Sequence]` Assign `data.nickname`
    ```typescript
    data.nickname = body.nickname?.trim() || null
    ```
- **7.** `[Sequence]` Database `update` on `Friend` and stores it as `updated`
- **8.** `[If]` `body.isPrivate !== undefined`
  - **8.1.** `[Sequence]` Calls `Boolean` and stores result as `nextPrivate`
  - **8.2.** `[Sequence]` Database `all` on `ActivityLog`
- **9.** `[Return]` 
  ```json
  {
    "success": true,
    "friend": "<updated>"
  }
  ```

#### `removeFriend(currentUserId, friendId)` (L236)
Remove friend strictly by target friend user ID or friendship record ID.

- **1.** `[Sequence]` Define `trimmedFriendId`
  ```typescript
  const trimmedFriendId = friendId.trim()
  ```
- **2.** `[Sequence]` Database `first` on `Friend` and stores it as `existing`
- **3.** `[If]` `!existing`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Friendship not found'
- **4.** `[Sequence]` Define `targetFriendId`
  ```typescript
  const targetFriendId = existing.friendId
  ```
- **5.** `[Sequence]` Database `deleteAll` on `Friend`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Friend removed successfully"
  }
  ```

#### `listFriendRequests(currentUserId, query)` (L270)
Get pending friend requests (incoming, outgoing, or all).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `type`
  ```typescript
  const skip = page - 1 * limit
  const type = query?.type ?? 'incoming'
  ```
- **4.** `[Sequence]` Database `query` on `FriendRequest` and stores it as `requestsQuery`
- **5.** `[If]` `type === 'outgoing'`
  - **5.1.** `[Sequence]` Assign `requestsQuery`
    ```typescript
    requestsQuery = requestsQuery.where((r) => r.senderId.eq(currentUserId))
    ```
- **6.** `[Else]` Otherwise
  - **6.1.** `[If]` `type === 'all'`
    - **6.1.1.** `[Sequence]` Assign `requestsQuery`
      ```typescript
      requestsQuery = requestsQuery.where((r) => or(r.receiverId.eq(currentUserId), r.senderId.eq(currentUserId)) )
      ```
  - **6.2.** `[Else]` Otherwise
    - **6.2.1.** `[Sequence]` Assign `requestsQuery`
      ```typescript
      requestsQuery = requestsQuery.where((r) => r.receiverId.eq(currentUserId))
      ```
- **7.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawRequests]`
- **8.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **9.** `[Sequence]` Define `hasMore`, `requests`
  ```typescript
  const hasMore = page < totalPages
  const requests = rawRequests.map((r) => { const senderProfile = getProfileCustomization(r.sender.customization) const receiverProfile = getProfileCustomization(r.receiver.customization) return { id: r.id, senderId: r.senderId, ...)
  ```
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "requests": "<requests>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `sendFriendRequest(currentUserId, body)` (L352)
Send a friend request by target user ID (UUID) or username.

- **1.** `[Sequence]` Define `targetUserId`
  ```typescript
  let targetUserId = body.targetUserId?.trim()
  ```
- **2.** `[If]` `!targetUserId && body.targetUsername`
  - **2.1.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **2.2.** `[If]` `!user`
    - **2.2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User @${body.targetUsername.trim()} not found`
  - **2.3.** `[Sequence]` Assign `targetUserId`
    ```typescript
    targetUserId = user.id
    ```
- **3.** `[If]` `!targetUserId`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Either targetUserId or targetUsername is required'
- **4.** `[If]` `targetUserId === currentUserId`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'You cannot send a friend request to yourself'
- **5.** `[Sequence]` Database `first` on `User` and stores it as `targetUser`
- **6.** `[If]` `!targetUser`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User with ID "${targetUserId}" not found`
- **7.** `[Sequence]` Database `first` on `UserBlock` and stores it as `isBlocked`
- **8.** `[If]` `isBlocked`
  - **8.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Cannot send friend request to blocked user'
- **9.** `[Sequence]` Database `first` on `Friend` and stores it as `alreadyFriends`
- **10.** `[If]` `alreadyFriends`
  - **10.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'You are already friends with this user'
- **11.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `existingOutgoing`
- **12.** `[If]` `existingOutgoing`
  - **12.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Friend request already sent and pending'
- **13.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `existingIncoming`
- **14.** `[If]` `existingIncoming`
  - **14.1.** `[Sequence]` Calls `prisma.transaction`
  - **14.2.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Mutual friend request accepted, you are now friends!",
      "requestId": "<existingIncoming.id>"
    }
    ```
- **15.** `[Sequence]` Database `create` on `FriendRequest` and stores it as `newRequest`
- **16.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Friend request sent successfully",
    "requestId": "<newRequest.id>"
  }
  ```

#### `acceptFriendRequest(currentUserId, requestId)` (L478)
Accept a pending friend request by request ID.

- **1.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `friendRequest`
- **2.** `[If]` `!friendRequest || friendRequest.receiverId !== currentUserId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Friend request not found'
- **3.** `[If]` `friendRequest.status !== 'PENDING'`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Friend request is not pending'
- **4.** `[Sequence]` Calls `prisma.transaction`
- **5.** `[Sequence]` Define `senderProfile`, `receiverProfile`
  ```typescript
  const senderProfile = friendRequest.sender ? getProfileCustomization(friendRequest.sender.customization) : null
  const receiverProfile = friendRequest.receiver ? getProfileCustomization(friendRequest.receiver.customization) : null
  ```
- **6.** `[Sequence]` Calls `ActivityServ.recordFriendActivity`
- **7.** `[Sequence]` Calls `ActivityServ.recordFriendActivity`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Friend request accepted successfully",
    "friendId": "<friendRequest.senderId>"
  }
  ```

#### `declineFriendRequest(currentUserId, requestId)` (L549)
Decline a pending friend request by request ID.

- **1.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `friendRequest`
- **2.** `[If]` `!friendRequest || friendRequest.receiverId !== currentUserId`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Friend request not found'
- **3.** `[Sequence]` Database `deleteAll` on `FriendRequest`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Friend request declined successfully"
  }
  ```

#### `respondFriendRequest(currentUserId, requestId, action)` (L572)
Respond to a friend request (ACCEPT, DECLINE, or BLOCK).

- **1.** `[If]` `action === 'ACCEPT'`
  - **1.1.** `[Return]`  — `await this.acceptFriendRequest(currentUserId, requestId)`
- **2.** `[If]` `action === 'DECLINE'`
  - **2.1.** `[Return]`  — `await this.declineFriendRequest(currentUserId, requestId)`
- **3.** `[If]` `action === 'BLOCK'`
  - **3.1.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `request`
  - **3.2.** `[If]` `!request || request.receiverId !== currentUserId`
    - **3.2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Friend request not found'
  - **3.3.** `[Sequence]` Define `senderId`
    ```typescript
    const senderId = request.senderId
    ```
  - **3.4.** `[Sequence]` Database `deleteAll` on `FriendRequest`
  - **3.5.** `[Sequence]` Calls `this.blockUser`
  - **3.6.** `[Return]` 
    ```json
    {
      "success": true,
      "message": "Friend request rejected and user blocked"
    }
    ```
- **4.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid action "${action}"`

#### `cancelFriendRequest(currentUserId, requestId)` (L607)
Cancel an outgoing friend request by request ID.

- **1.** `[Sequence]` Database `first` on `FriendRequest` and stores it as `friendRequest`
- **2.** `[If]` `!friendRequest`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Friend request not found'
- **3.** `[Sequence]` Database `deleteAll` on `FriendRequest`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Friend request cancelled successfully"
  }
  ```

#### `blockUser(currentUserId, body)` (L630)
Block a user by target user ID or username.

- **1.** `[Sequence]` Define `targetUserId`
  ```typescript
  let targetUserId = body.targetUserId?.trim()
  ```
- **2.** `[If]` `!targetUserId && body.targetUsername`
  - **2.1.** `[Sequence]` Database `first` on `User` and stores it as `user`
  - **2.2.** `[If]` `!user`
    - **2.2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `User @${body.targetUsername.trim()} not found`
  - **2.3.** `[Sequence]` Assign `targetUserId`
    ```typescript
    targetUserId = user.id
    ```
- **3.** `[If]` `!targetUserId`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Either targetUserId or targetUsername is required'
- **4.** `[If]` `targetUserId === currentUserId`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'You cannot block yourself'
- **5.** `[Sequence]` Database `first` on `User` and stores it as `targetUser`
- **6.** `[If]` `!targetUser`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **7.** `[Sequence]` Calls `prisma.transaction`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "User blocked successfully"
  }
  ```

#### `unblockUser(currentUserId, blockId)` (L695)
Unblock a user by block record ID or blocked user ID.

- **1.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = blockId.trim()
  ```
- **2.** `[Sequence]` Database `first` on `UserBlock` and stores it as `block`
- **3.** `[If]` `!block`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Blocked user record not found'
- **4.** `[Sequence]` Database `deleteAll` on `UserBlock`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "User unblocked successfully"
  }
  ```

#### `getFriendsMediaTracking(currentUserId, mediaType, mediaId)` (L722)
Get friends tracking status for a media item.

- **1.** `[Sequence]` Define `normType`
  ```typescript
  const normType = mediaType.toLowerCase().trim() as ValidMediaType
  ```
- **2.** `[If]` `!VALID_MEDIA_TYPES.includes(normType)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid media type "${mediaType}". Valid types: ${VALID_MEDIA_TYPES.join(', ')}`
- **3.** `[Sequence]` Database `all` on `Friend` and stores it as `friends`
- **4.** `[If]` `friends.length === 0`
  - **4.1.** `[Return]` 
    ```json
    {
      "success": true,
      "mediaType": "<normType>",
      "mediaId": "<mediaId>",
      "friends": []
    }
    ```
- **5.** `[Sequence]` Define `friendIds`, `friendMap`, `trackingList`, `formatEntry`
  ```typescript
  const friendIds = friends.map((f) => f.friendId)
  const friendMap = new Map(friends.map((f) => [f.friendId, f]))
  const trackingList: Array<{ id: string friendId: string nickname: string | null status: string progress: number | null progressVolumes: number | null ... = []
  const formatEntry = ( userId: string, status: string, progress: number | null, progressVolumes: number | null, score: number | null, updatedAt: any ...
  ```
- **6.** `[If]` `normType === 'anime'`
  - **6.1.** `[Sequence]` Database `all` on `AnimeList` and stores it as `entries`
  - **6.2.** `[Loop]` Iterate `const e` over `entries`
    - **6.2.1.** `[Sequence]` Calls `formatEntry`
- **7.** `[Else]` Otherwise
  - **7.1.** `[If]` `normType === 'manga'`
    - **7.1.1.** `[Sequence]` Database `all` on `MangaList` and stores it as `entries`
    - **7.1.2.** `[Loop]` Iterate `const e` over `entries`
      - **7.1.2.1.** `[Sequence]` Calls `formatEntry`
  - **7.2.** `[Else]` Otherwise
    - **7.2.1.** `[If]` `normType === 'movie'`
      - **7.2.1.1.** `[Sequence]` Database `all` on `MovieList` and stores it as `entries`
      - **7.2.1.2.** `[Loop]` Iterate `const e` over `entries`
        - **7.2.1.2.1.** `[Sequence]` Calls `formatEntry`
    - **7.2.2.** `[Else]` Otherwise
      - **7.2.2.1.** `[If]` `normType === 'tv'`
        - **7.2.2.1.1.** `[Sequence]` Database `all` on `TvList` and stores it as `entries`
        - **7.2.2.1.2.** `[Loop]` Iterate `const e` over `entries`
          - **7.2.2.1.2.1.** `[Sequence]` Calls `formatEntry`
      - **7.2.2.2.** `[Else]` Otherwise
        - **7.2.2.2.1.** `[If]` `normType === 'game'`
          - **7.2.2.2.1.1.** `[Sequence]` Database `all` on `GameList` and stores it as `entries`
          - **7.2.2.2.1.2.** `[Loop]` Iterate `const e` over `entries`
            - **7.2.2.2.1.2.1.** `[Sequence]` Calls `formatEntry`
        - **7.2.2.2.2.** `[Else]` Otherwise
          - **7.2.2.2.2.1.** `[If]` `normType === 'book'`
            - **7.2.2.2.2.1.1.** `[Sequence]` Database `all` on `BookList` and stores it as `entries`
            - **7.2.2.2.2.1.2.** `[Loop]` Iterate `const e` over `entries`
              - **7.2.2.2.2.1.2.1.** `[Sequence]` Calls `formatEntry`
          - **7.2.2.2.2.2.** `[Else]` Otherwise
            - **7.2.2.2.2.2.1.** `[If]` `normType === 'music'`
              - **7.2.2.2.2.2.1.1.** `[Sequence]` Database `all` on `MusicList` and stores it as `entries`
              - **7.2.2.2.2.2.1.2.** `[Loop]` Iterate `const e` over `entries`
                - **7.2.2.2.2.2.1.2.1.** `[Sequence]` Calls `formatEntry`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "mediaType": "<normType>",
    "mediaId": "<mediaId>",
    "friends": "<trackingList>"
  }
  ```

#### `recommendToFriends(currentUserId, body)` (L876)
Recommend media directly to friends strictly by user IDs (UUIDs).

- **1.** `[Sequence]` Database `all` on `Friend` and stores it as `validFriends`
- **2.** `[If]` `validFriends.length === 0`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'No valid friends selected'
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Define `upperMediaType`
    ```typescript
    const upperMediaType = body.mediaType.toUpperCase() as MediaType
    ```
  - **3.2.** `[Sequence]` Database `create` on `ActivityLog`
- **4.** `[Catch]` Catch (`err`)
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "message": "Media recommendation sent to friend(s)",
    "sentCount": "<validFriends.length>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `BadRequest`, `NotFound`
- [apps/carina/activity/activity.serv.ts](../activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `or`, `and`, `toDate`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`

### Called By / Imported By
- [apps/carina/friends/friends.ctrl.ts](./friends.ctrl.md) ([[apps/carina/friends/friends.ctrl]]) — `CarinaFriendsServ`
