# comments.serv.ts

- **Source**: [`apps/carina/comments/comments.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/comments/comments.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaCommentsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `const VALID_MEDIA_TYPES` (L7)

### `type ValidMediaType` (L18)

### `class CarinaCommentsServ` extends `BaseService` (L20)

#### `formatAuthor(user)` (L24)
Helper to format an author profile summary.

- **1.** `[Sequence]` Calls `getProfileCustomization` and stores result as `profile`
- **2.** `[Sequence]` Define `trimmedDisplayName`
  ```typescript
  const trimmedDisplayName = typeof profile.displayName === 'string' ? profile.displayName.trim() : ''
  ```
- **3.** `[Return]` 
  ```json
  {
    "id": "<user.id>",
    "username": "<user.username>",
    "displayName": "<trimmedDisplayName !== '' ? trimmedDisplayName : null>",
    "avatarUrl": "<profile.avatarUrl ?? null>",
    "avatarFrame": "<profile.avatarFrame ?? null>",
    "bannerUrl": "<profile.bannerUrl ?? null>"
  }
  ```

#### `formatComment(item)` (L46)
Helper to format a comment and its nested reply for API responses.

- **1.** `[Return]` 
  ```json
  {
    "id": "<item.id>",
    "listOwnerId": "<item.listOwnerId>",
    "mediaType": "<item.mediaType>",
    "authorId": "<item.authorId>",
    "content": "<item.content>",
    "isSpoiler": "<item.isSpoiler>",
    "createdAt": "<toDate(item.createdAt).toISOString()>",
    "updatedAt": "<toDate(item.updatedAt).toISOString()>",
    "author": "<this.formatAuthor(item.author)>",
    "reply": "<item.reply ? { id: item.reply.id, commentId: item.reply.commentId, authorId: item.reply.authorId, content: item.reply.content, createdAt: toDate(item.reply.createdAt).toISOString(), ...>"
  }
  ```

#### `formatReply(reply)` (L101)
Helper to format a single reply.

- **1.** `[Return]` 
  ```json
  {
    "id": "<reply.id>",
    "commentId": "<reply.commentId>",
    "authorId": "<reply.authorId>",
    "content": "<reply.content>",
    "createdAt": "<toDate(reply.createdAt).toISOString()>",
    "updatedAt": "<toDate(reply.updatedAt).toISOString()>",
    "author": "<this.formatAuthor(reply.author)>"
  }
  ```

#### `getProfileComments(targetUserId, query)` (L128)
Get comments on a user's profile (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `first` on `User` and stores it as `profileOwner`
- **5.** `[If]` `!profileOwner`
  - **5.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **6.** `[Sequence]` Database `query` on `ListComment` and stores it as `commentQuery`
- **7.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawComments]`
- **8.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **9.** `[Sequence]` Define `hasMore`, `comments`
  ```typescript
  const hasMore = page < totalPages
  const comments = rawComments.map((c) => this.formatComment(c))
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
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `createProfileComment(authorId, targetUserId, body)` (L181)
Post a comment on a user's profile.

- **1.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = body.content.trim()
  ```
- **2.** `[If]` `!trimmed`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Comment content cannot be empty.'
- **3.** `[Sequence]` Database `first` on `User` and stores it as `profileOwner`
- **4.** `[If]` `!profileOwner`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **5.** `[Sequence]` Database `first` on `UserBlock` and stores it as `isBlocked`
- **6.** `[If]` `isBlocked`
  - **6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Cannot comment on profile due to user block.'
- **7.** `[Sequence]` Calls `getProfileCustomization` and stores result as `ownerCustom`
- **8.** `[Sequence]` Define `allowComments`
  ```typescript
  const allowComments = ownerCustom.privacy?.allowComments || (profileOwner.customization as any)?.privacy?.allowComments || 'public'
  ```
- **9.** `[If]` `allowComments === 'disabled'`
  - **9.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'This user has disabled comments on their profile.'
- **10.** `[If]` `allowComments === 'friends' && authorId !== profileOwner.id`
  - **10.1.** `[Sequence]` Database `first` on `Friend` and stores it as `areFriends`
  - **10.2.** `[If]` `!areFriends`
    - **10.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Only friends can comment on this user profile.'
- **11.** `[Sequence]` Database `create` on `ListComment` and stores it as `created`
- **12.** `[Sequence]` Database `first` on `ListComment` and stores it as `rawComment`
- **13.** `[If]` `!rawComment`
  - **13.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Failed to create comment'
- **14.** `[Return]` 
  ```json
  {
    "success": true,
    "comment": "<this.formatComment(rawComment)>"
  }
  ```

#### `getListComments(targetUserId, mediaType, query)` (L259)
Get comments on a user's media list (10 per page default).

- **1.** `[Sequence]` Define `normMediaType`
  ```typescript
  const normMediaType = mediaType.trim().toLowerCase()
  ```
- **2.** `[If]` `!VALID_MEDIA_TYPES.includes(normMediaType as ValidMediaType)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid mediaType. Must be one of: ${VALID_MEDIA_TYPES.join(', ')}`
- **3.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **4.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **5.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **6.** `[Sequence]` Database `first` on `User` and stores it as `listOwner`
- **7.** `[If]` `!listOwner`
  - **7.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **8.** `[Sequence]` Database `query` on `ListComment` and stores it as `commentQuery`
- **9.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawComments]`
- **10.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **11.** `[Sequence]` Define `hasMore`, `comments`
  ```typescript
  const hasMore = page < totalPages
  const comments = rawComments.map((c) => this.formatComment(c))
  ```
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "comments": "<comments>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `createListComment(authorId, targetUserId, mediaType, body)` (L320)
Post a comment on a user's media list.

- **1.** `[Sequence]` Define `normMediaType`
  ```typescript
  const normMediaType = mediaType.trim().toLowerCase()
  ```
- **2.** `[If]` `!VALID_MEDIA_TYPES.includes(normMediaType as ValidMediaType)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid mediaType. Must be one of: ${VALID_MEDIA_TYPES.join(', ')}`
- **3.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = body.content.trim()
  ```
- **4.** `[If]` `!trimmed`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Comment content cannot be empty.'
- **5.** `[Sequence]` Database `first` on `User` and stores it as `listOwner`
- **6.** `[If]` `!listOwner`
  - **6.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found'
- **7.** `[Sequence]` Database `first` on `UserBlock` and stores it as `isBlocked`
- **8.** `[If]` `isBlocked`
  - **8.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Cannot comment on list due to user block.'
- **9.** `[Sequence]` Database `create` on `ListComment` and stores it as `created`
- **10.** `[Sequence]` Database `first` on `ListComment` and stores it as `rawComment`
- **11.** `[If]` `!rawComment`
  - **11.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Failed to create comment'
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "comment": "<this.formatComment(rawComment)>"
  }
  ```

#### `deleteComment(user, commentId)` (L385)
Delete a comment strictly by comment ID. Allowed for comment author, list/profile owner, or administrator.

- **1.** `[Sequence]` Database `first` on `ListComment` and stores it as `comment`
- **2.** `[If]` `!comment`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Comment not found'
- **3.** `[Sequence]` Define `isAuthor`, `isOwner`
  ```typescript
  const isAuthor = comment.authorId === user.id
  const isOwner = comment.listOwnerId === user.id
  ```
- **4.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **5.** `[If]` `!isAuthor && !isOwner && !isAdmin`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this comment'
- **6.** `[Sequence]` Database `delete` on `ListComment`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<comment.id>",
    "message": "Comment deleted successfully"
  }
  ```

#### `createReply(authorId, commentId, body)` (L415)
Post a reply to a comment (only owner can reply, max 1 reply per comment).

- **1.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = body.content.trim()
  ```
- **2.** `[If]` `!trimmed`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Reply content cannot be empty.'
- **3.** `[Sequence]` Database `first` on `ListComment` and stores it as `comment`
- **4.** `[If]` `!comment`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Comment not found'
- **5.** `[If]` `comment.listOwnerId !== authorId`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'Only the list or profile owner can reply to comments on their profile or list.'
- **6.** `[If]` `comment.reply`
  - **6.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'A reply already exists for this comment.'
- **7.** `[Sequence]` Database `create` on `ListCommentReply` and stores it as `created`
- **8.** `[Sequence]` Database `first` on `ListCommentReply` and stores it as `rawReply`
- **9.** `[If]` `!rawReply`
  - **9.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Failed to create reply'
- **10.** `[Return]` 
  ```json
  {
    "success": true,
    "reply": "<this.formatReply(rawReply)>"
  }
  ```

#### `deleteReply(user, commentId, replyId)` (L468)
Delete a reply to a comment strictly by reply ID. Allowed for reply author, list/profile owner, or administrator.

- **1.** `[Sequence]` Database `first` on `ListCommentReply` and stores it as `reply`
- **2.** `[If]` `!reply || reply.commentId !== commentId.trim()`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Reply not found'
- **3.** `[Sequence]` Define `isAuthor`, `isOwner`
  ```typescript
  const isAuthor = reply.authorId === user.id
  const isOwner = reply.comment.listOwnerId === user.id
  ```
- **4.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **5.** `[If]` `!isAuthor && !isOwner && !isAdmin`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this reply'
- **6.** `[Sequence]` Database `delete` on `ListCommentReply`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<reply.id>",
    "message": "Reply deleted successfully"
  }
  ```

#### `updateReply(user, commentId, replyId, body)` (L502)
Update a reply to a comment strictly by reply ID. Allowed for reply author or administrator.

- **1.** `[Sequence]` Define `trimmed`
  ```typescript
  const trimmed = body.content.trim()
  ```
- **2.** `[If]` `!trimmed`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Reply content cannot be empty.'
- **3.** `[Sequence]` Database `first` on `ListCommentReply` and stores it as `reply`
- **4.** `[If]` `!reply || reply.commentId !== commentId.trim()`
  - **4.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Reply not found'
- **5.** `[Sequence]` Define `isAuthor`
  ```typescript
  const isAuthor = reply.authorId === user.id
  ```
- **6.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **7.** `[If]` `!isAuthor && !isAdmin`
  - **7.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to update this reply'
- **8.** `[Sequence]` Database `update` on `ListCommentReply`
- **9.** `[Sequence]` Database `first` on `ListCommentReply` and stores it as `updated`
- **10.** `[If]` `!updated`
  - **10.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Reply not found'
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "reply": "<this.formatReply(updated)>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`, `Forbidden`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `countOf`, `toDate`
- `@NamelessLiberty/shared` — `getProfileCustomization`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/carina/comments/comments.ctrl.ts](./comments.ctrl.md) ([[apps/carina/comments/comments.ctrl]]) — `CarinaCommentsServ`
