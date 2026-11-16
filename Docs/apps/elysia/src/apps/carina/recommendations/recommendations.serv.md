# recommendations.serv.ts

- **Source**: [`apps/carina/recommendations/recommendations.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/recommendations/recommendations.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaRecommendationsServ extends BaseService`

## Exported Types, Methods & Algorithms

### `const VALID_RECOMMENDATION_MEDIA_TYPES` (L8)

### `type ValidRecommendationMediaType` (L22)

### `class CarinaRecommendationsServ` extends `BaseService` (L25)

#### `parseMediaType(rawType)`: `MediaType` (L29)
Helper to normalize and validate media type strings into Prisma MediaType enum.

- **1.** `[Sequence]` Define `normalized`
  ```typescript
  const normalized = rawType.trim().toUpperCase()
  ```
- **2.** `[If]` `!VALID_RECOMMENDATION_MEDIA_TYPES.includes(normalized as ValidRecommendationMediaType)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid media type: '${rawType}'. Must be one of: ${VALID_RECOMMENDATION_MEDIA_TYPES.map((t) => t.toLowerCase()).join(', ')}`
- **3.** `[Return]`  — `normalized as MediaType`

#### `formatAuthor(user)` (L46)
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

#### `formatRecommendation(item, userVote)` (L68)
Helper to format a recommendation item for API responses.

- **1.** `[Return]` 
  ```json
  {
    "id": "<item.id>",
    "userId": "<item.userId>",
    "sourceType": "<item.sourceType>",
    "sourceId": "<item.sourceId>",
    "targetType": "<item.targetType>",
    "targetId": "<item.targetId>",
    "body": "<item.body ?? null>",
    "upvotes": "<item.upvotes>",
    "downvotes": "<item.downvotes>",
    "score": "<item.score>",
    "...userVote !== undefined ? { userVote: userVote ?? null } : {}": "...",
    "author": "<this.formatAuthor(item.user)>",
    "createdAt": "<toDate(item.createdAt).toISOString()>",
    "updatedAt": "<toDate(item.updatedAt).toISOString()>"
  }
  ```

#### `submitRecommendation(userId, body)` (L111)
Submit or update a media recommendation strictly by media IDs.

- **1.** `[Sequence]` Calls `this.parseMediaType` and stores result as `normSourceType`
- **2.** `[Sequence]` Calls `this.parseMediaType` and stores result as `normTargetType`
- **3.** `[If]` `normSourceType === normTargetType && body.sourceId === body.targetId`
  - **3.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Cannot recommend a media item to itself'
- **4.** `[Sequence]` Define `trimmedBody`
  ```typescript
  const trimmedBody = body.body?.trim() || null
  ```
- **5.** `[Sequence]` Database `first` on `MediaRecommendation` and stores it as `rec`
- **6.** `[Sequence]` Define `isNewRecommendation`
  ```typescript
  const isNewRecommendation = !rec
  ```
- **7.** `[If]` `rec`
  - **7.1.** `[Sequence]` Assign `rec`
    ```typescript
    rec = await prisma.orm.public.MediaRecommendation.where({ id: rec.id }) .update({ body: trimmedBody })
    ```
- **8.** `[Else]` Otherwise
  - **8.1.** `[Sequence]` Assign `rec`
    ```typescript
    rec = await prisma.orm.public.MediaRecommendation.create({ userId, sourceType: normSourceType, sourceId: body.sourceId, targetType: normTargetType, targetId: body.targetId, body: trimmedBody, ...
    ```
- **9.** `[If]` `!rec`
  - **9.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Failed to save recommendation'
- **10.** `[If]` `isNewRecommendation`
  - **10.1.** `[Sequence]` Calls `ActivityServ.recordRecommendationActivity`
- **11.** `[Sequence]` Database `first` on `MediaRecommendation` and stores it as `recWithUser`
- **12.** `[If]` `!recWithUser`
  - **12.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Recommendation not found'
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "recommendation": "<this.formatRecommendation(recWithUser)>",
    "message": "Recommendation submitted successfully"
  }
  ```

#### `getMediaRecommendations(type, id, query, requestingUserId)` (L191)
Get recommendations for media (10 per page default). Finds recommendations where media is either source or target.

- **1.** `[Sequence]` Calls `this.parseMediaType` and stores result as `normType`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **3.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **4.** `[Sequence]` Define `skip`
  ```typescript
  const skip = page - 1 * limit
  ```
- **5.** `[Sequence]` Database `query` on `MediaRecommendation` and stores it as `recQuery`
- **6.** `[Sequence]` Calls `Promise.all` and stores result as `[total, rawRecommendations]`
- **7.** `[Sequence]` Define `voteMap`
  ```typescript
  const voteMap = new Map<number, string>()
  ```
- **8.** `[If]` `requestingUserId && rawRecommendations.length > 0`
  - **8.1.** `[Sequence]` Define `recIds`
    ```typescript
    const recIds = rawRecommendations.map((r) => r.id)
    ```
  - **8.2.** `[Sequence]` Database `all` on `MediaRecommendationVote` and stores it as `votes`
  - **8.3.** `[Loop]` Iterate `const v` over `votes`
    - **8.3.1.** `[Sequence]` Calls `voteMap.set`
- **9.** `[Sequence]` Calls `Math.max` and stores result as `totalPages`
- **10.** `[Sequence]` Define `hasMore`, `recommendations`
  ```typescript
  const hasMore = page < totalPages
  const recommendations = rawRecommendations.map((r) => this.formatRecommendation( r, requestingUserId ? (voteMap.get(r.id) ?? null) : null ))
  ```
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "total": "<total>",
    "recommendations": "<recommendations>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<totalPages>",
      "hasMore": "<hasMore>"
    }
  }
  ```

#### `deleteRecommendation(user, id)` (L260)
Delete recommendation strictly by recommendation ID. Allowed for recommendation author or system administrator.

- **1.** `[Sequence]` Database `first` on `MediaRecommendation` and stores it as `recommendation`
- **2.** `[If]` `!recommendation`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Recommendation not found'
- **3.** `[Sequence]` Define `isAuthor`
  ```typescript
  const isAuthor = recommendation.userId === user.id
  ```
- **4.** `[Sequence]` Calls `new IRISBitField(user.permissions).has` and stores result as `isAdmin`
- **5.** `[If]` `!isAuthor && !isAdmin`
  - **5.1.** `[Error]` Throws `Forbidden` (HTTP 403) — 'You do not have permission to delete this recommendation'
- **6.** `[Sequence]` Database `delete` on `MediaRecommendation`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<id>",
    "message": "Recommendation deleted successfully"
  }
  ```

#### `voteRecommendation(userId, id, voteType)` (L290)
Vote on recommendation (UPVOTE, DOWNVOTE, or NONE). Recalculates and updates upvotes, downvotes, and net score.

- **1.** `[Sequence]` Database `first` on `MediaRecommendation` and stores it as `recommendation`
- **2.** `[If]` `!recommendation`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Recommendation not found'
- **3.** `[If]` `voteType === 'NONE'`
  - **3.1.** `[Sequence]` Database `deleteAll` on `MediaRecommendationVote`
- **4.** `[Else]` Otherwise
  - **4.1.** `[Sequence]` Database `first` on `MediaRecommendationVote` and stores it as `existingVote`
  - **4.2.** `[If]` `existingVote`
    - **4.2.1.** `[Sequence]` Database `update` on `MediaRecommendationVote`
  - **4.3.** `[Else]` Otherwise
    - **4.3.1.** `[Sequence]` Database `create` on `MediaRecommendationVote`
- **5.** `[Sequence]` Database `all` on `MediaRecommendationVote` and stores it as `[upvotes, downvotes]`
- **6.** `[Sequence]` Define `score`
  ```typescript
  const score = upvotes - downvotes
  ```
- **7.** `[Sequence]` Database `update` on `MediaRecommendation`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "id": "<id>",
    "upvotes": "<upvotes>",
    "downvotes": "<downvotes>",
    "score": "<score>",
    "userVote": "<voteType === 'NONE' ? null : voteType>",
    "message": "<voteType === 'NONE' ? 'Vote removed successfully' : `Recommendation ${voteType.toLowerCase()}d successfully`>"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`, `Forbidden`
- [apps/carina/activity/activity.serv.ts](../activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `countOf`, `toDate`, `MediaType`
- `@NamelessLiberty/shared` — `getProfileCustomization`
- `@NamelessLiberty/permissions` — `IRISBitField`, `IRISFlags`

### Called By / Imported By
- [apps/carina/recommendations/recommendations.ctrl.ts](./recommendations.ctrl.md) ([[apps/carina/recommendations/recommendations.ctrl]]) — `CarinaRecommendationsServ`
