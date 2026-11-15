# favorites.serv.ts

- **Source**: [`apps/carina/favorites/favorites.serv.ts`](../../../../../../../apps/elysia/src/apps/carina/favorites/favorites.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `CarinaFavoritesServ extends BaseService`

## Exported Types, Methods & Algorithms

### `const VALID_FAVORITE_TYPES` (L7)

### `type ValidFavoriteType` (L23)

### `class CarinaFavoritesServ` extends `BaseService` (L25)

#### `parseFavoriteType(raw)`: `FavoriteType` (L29)
Helper to normalize and validate favorite category / type string into FavoriteType enum.

- **1.** `[Sequence]` Define `normalized`
  ```typescript
  const normalized = raw.trim().replace(/-/g, '_').toUpperCase()
  ```
- **2.** `[If]` `!VALID_FAVORITE_TYPES.includes(normalized as ValidFavoriteType)`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — `Invalid favorite category: '${raw}'. Must be one of: ${VALID_FAVORITE_TYPES.map((t) => t.toLowerCase()).join(', ')}`
- **3.** `[Return]`  — `normalized as FavoriteType`

#### `addFavorite(userId, body)` (L42)
Add media or entity to user favorites (strictly by IDs).

- **1.** `[Sequence]` Define `rawCategory`
  ```typescript
  const rawCategory = body.category || body.type
  ```
- **2.** `[If]` `!rawCategory || typeofrawCategory !== 'string' || !rawCategory.trim()`
  - **2.1.** `[Error]` Throws `BadRequest` (HTTP 400) — 'Category or type is required.'
- **3.** `[Sequence]` Calls `this.parseFavoriteType` and stores result as `normType`
- **4.** `[Sequence]` Database `first` on `Favorite` and stores it as `favorite`
- **5.** `[If]` `!favorite`
  - **5.1.** `[Sequence]` Assign `favorite`
    ```typescript
    favorite = await prisma.orm.public.Favorite.create({ userId, type: normType, targetId: body.targetId, })
    ```
- **6.** `[Sequence]` Calls `MediaStatsServ.recalculateFavoritesCount`
- **7.** `[Sequence]` Calls `ActivityServ.recordFavoriteActivity`
- **8.** `[Return]` 
  ```json
  {
    "success": true,
    "favorite": {
      "id": "<favorite.id>",
      "userId": "<favorite.userId>",
      "type": "<favorite.type>",
      "targetId": "<favorite.targetId>",
      "createdAt": "<toDate(favorite.createdAt).toISOString()>"
    },
    "message": "Added to favorites successfully"
  }
  ```

#### `checkFavorite(userId, category, targetId)` (L92)
Check if target entity is in user favorites strictly by category and target ID.

- **1.** `[Sequence]` Calls `this.parseFavoriteType` and stores result as `normType`
- **2.** `[Sequence]` Database `first` on `Favorite` and stores it as `favorite`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "isFavorite": "<Boolean(favorite)>",
    "favorite": "<favorite ? { id: favorite.id, userId: favorite.userId, type: favorite.type, targetId: favorite.targetId, createdAt: toDate(favorite.createdAt).toISOString(), ...>"
  }
  ```

#### `removeFavorite(userId, category, targetId)` (L123)
Remove target from favorites strictly by category and target ID.

- **1.** `[Sequence]` Calls `this.parseFavoriteType` and stores result as `normType`
- **2.** `[Sequence]` Database `first` on `Favorite` and stores it as `favorite`
- **3.** `[If]` `!favorite`
  - **3.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'Favorite not found'
- **4.** `[Sequence]` Database `delete` on `Favorite`
- **5.** `[Sequence]` Calls `MediaStatsServ.recalculateFavoritesCount`
- **6.** `[Sequence]` Calls `ActivityServ.recordFavoriteActivity`
- **7.** `[Return]` 
  ```json
  {
    "success": true,
    "targetId": "<targetId>",
    "category": "<normType>",
    "message": "Removed from favorites successfully"
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`, `BadRequest`
- [apps/borealis/_shared/media-stats.serv.ts](../../borealis/_shared/media-stats.serv.md) ([[apps/borealis/_shared/media-stats.serv]]) — `MediaStatsServ`
- [apps/carina/activity/activity.serv.ts](../activity/activity.serv.md) ([[apps/carina/activity/activity.serv]]) — `ActivityServ`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `toDate`, `FavoriteType`

### Called By / Imported By
- [apps/carina/favorites/favorites.ctrl.ts](./favorites.ctrl.md) ([[apps/carina/favorites/favorites.ctrl]]) — `CarinaFavoritesServ`
