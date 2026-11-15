# bookmarks.serv.ts

- **Source**: [`apps/carina/bookmarks/bookmarks.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/bookmarks/bookmarks.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaBookmarksServ extends BaseService`

## Exported Types, Methods & Algorithms

### `class CarinaBookmarksServ` extends `BaseService` (L6)

#### `formatBookmark(b)` (L10)
Helper to format a bookmark record for API responses.

- **1.** `[Return]` 
  ```json
  {
    "id": "<b.id>",
    "userId": "<b.userId>",
    "title": "<b.title>",
    "url": "<b.url>",
    "icon": "<b.icon ?? null>",
    "color": "<b.color ?? null>",
    "pinned": "<b.pinned>",
    "appId": "<b.appId ?? null>",
    "group": "<b.group ?? null>",
    "order": "<b.order>",
    "createdAt": "<toDate(b.createdAt).toISOString()>",
    "updatedAt": "<toDate(b.updatedAt).toISOString()>"
  }
  ```

#### `getBookmarks(userId, query)` (L43)
Get user bookmarks with pagination and optional filtering (10 per page default).

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **4.** `[Sequence]` Database `query` on `Bookmark` and stores it as `bmQuery`
- **5.** `[If]` `query?.group !== undefined`
  - **5.1.** `[Sequence]` Assign `bmQuery`
    ```typescript
    bmQuery = bmQuery.where({ group: query.group.trim() })
    ```
- **6.** `[If]` `query?.pinned !== undefined`
  - **6.1.** `[Sequence]` Assign `bmQuery`
    ```typescript
    bmQuery = bmQuery.where({ pinned: Boolean(query.pinned) })
    ```
- **7.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawBookmarks]`
- **8.** `[Sequence]` Calls `rawBookmarks.sort`
- **9.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **10.** `[Sequence]` Define `hasMore`
  ```typescript
  const hasMore = page < totalPages
  ```
- **11.** `[Sequence]` Calls `Array.from` and stores result as `groups`
- **12.** `[Return]` 
  ```json
  {
    "success": true,
    "bookmarks": "<rawBookmarks.map((b) => this.formatBookmark(b))>",
    "groups": "<groups>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `putBookmarks(userId, body)` (L103)
Reorder and batch update bookmarks for the current user.

- **1.** `[Sequence]` Calls `prisma.transaction`
- **2.** `[Sequence]` Database `all` on `Bookmark` and stores it as `dbBookmarks`
- **3.** `[Sequence]` Calls `dbBookmarks.sort`
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "bookmarks": "<dbBookmarks.map((b) => this.formatBookmark(b))>"
  }
  ```

#### `createBookmark(userId, body)` (L150)
Create a new bookmark for the current user.

- **1.** `[Sequence]` Define `title`
  ```typescript
  const title = body.title.trim()
  ```
- **2.** `[If]` `!title`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Bookmark title cannot be empty'
- **3.** `[Sequence]` Define `url`
  ```typescript
  const url = body.url.trim()
  ```
- **4.** `[If]` `!url`
  - **4.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Bookmark URL cannot be empty'
- **5.** `[Sequence]` Database `create` on `Bookmark` and stores it as `created`
- **6.** `[Return]` 
  ```json
  {
    "success": true,
    "bookmark": "<this.formatBookmark(created)>",
    "message": "Bookmark created successfully"
  }
  ```

#### `updateBookmark(user, bookmarkId, body)` (L194)
Update an existing bookmark strictly by bookmark ID.

- **1.** `[Sequence]` Database `first` on `Bookmark` and stores it as `bookmark`
- **2.** `[If]` `!bookmark`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Bookmark not found'
- **3.** `[Sequence]` Define `isOwner`
  ```typescript
  const isOwner = bookmark.userId === user.id
  ```
- **4.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **5.** `[If]` `!isOwner && !isAdmin`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to update this bookmark'
- **6.** `[Sequence]` Define `data`
  ```typescript
  const data: any = {}
  ```
- **7.** `[If]` `body.title !== undefined`
  - **7.1.** `[Sequence]` Define `trimmedTitle`
    ```typescript
    const trimmedTitle = body.title.trim()
    ```
  - **7.2.** `[If]` `!trimmedTitle`
    - **7.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Bookmark title cannot be empty'
  - **7.3.** `[Sequence]` Assign `data.title`
    ```typescript
    data.title = trimmedTitle
    ```
- **8.** `[If]` `body.url !== undefined`
  - **8.1.** `[Sequence]` Define `trimmedUrl`
    ```typescript
    const trimmedUrl = body.url.trim()
    ```
  - **8.2.** `[If]` `!trimmedUrl`
    - **8.2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Bookmark URL cannot be empty'
  - **8.3.** `[Sequence]` Assign `data.url`
    ```typescript
    data.url = trimmedUrl
    ```
- **9.** `[If]` `body.icon !== undefined`
  - **9.1.** `[Sequence]` Assign `data.icon`
    ```typescript
    data.icon = body.icon?.trim() || null
    ```
- **10.** `[If]` `body.color !== undefined`
  - **10.1.** `[Sequence]` Assign `data.color`
    ```typescript
    data.color = body.color?.trim() || null
    ```
- **11.** `[If]` `body.pinned !== undefined`
  - **11.1.** `[Sequence]` Assign `data.pinned`
    ```typescript
    data.pinned = Boolean(body.pinned)
    ```
- **12.** `[If]` `body.appId !== undefined`
  - **12.1.** `[Sequence]` Assign `data.appId`
    ```typescript
    data.appId = body.appId?.trim() || null
    ```
- **13.** `[If]` `body.group !== undefined`
  - **13.1.** `[Sequence]` Assign `data.group`
    ```typescript
    data.group = body.group?.trim() || null
    ```
- **14.** `[If]` `body.order !== undefined`
  - **14.1.** `[Sequence]` Assign `data.order`
    ```typescript
    data.order = body.order
    ```
- **15.** `[Sequence]` Database `update` on `Bookmark` and stores it as `updated`
- **16.** `[If]` `!updated`
  - **16.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Bookmark not found'
- **17.** `[Return]` 
  ```json
  {
    "success": true,
    "bookmark": "<this.formatBookmark(updated)>",
    "message": "Bookmark updated successfully"
  }
  ```

#### `deleteBookmark(user, bookmarkId)` (L267)
Delete a bookmark strictly by bookmark ID.

- **1.** `[Sequence]` Database `first` on `Bookmark` and stores it as `bookmark`
- **2.** `[If]` `!bookmark`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Bookmark not found'
- **3.** `[Sequence]` Define `isOwner`
  ```typescript
  const isOwner = bookmark.userId === user.id
  ```
- **4.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **5.** `[If]` `!isOwner && !isAdmin`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this bookmark'
- **6.** `[Sequence]` Database `delete` on `Bookmark`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<bookmark.id>",
    "message": "Bookmark deleted successfully"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`, `Forbidden`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `countOf`, `toDate`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/carina/bookmarks/bookmarks.ctrl.ts](./bookmarks.ctrl.md) ([[apps/carina/bookmarks/bookmarks.ctrl]]) — `CarinaBookmarksServ`
