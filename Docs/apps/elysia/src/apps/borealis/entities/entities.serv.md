# entities.serv.ts

- **Source**: [`apps/borealis/entities/entities.serv.ts`](../../../../../../../apps/elysia/src/apps/borealis/entities/entities.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `BorealisEntitiesServ extends BaseService`

## Exported Types, Methods & Algorithms

### `interface CharacterCatalogQuery` (L5)

### `interface PersonCatalogQuery` (L14)

### `interface StudioCatalogQuery` (L25)

### `class BorealisEntitiesServ` extends `BaseService` (L34)

#### `getCharacterCatalog(query)` (L39)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `search`, `gender`, `sortBy`, `sortOrder`
  ```typescript
  const skip = page - 1 * limit
  const search = query?.search?.trim()
  const gender = query?.gender?.trim()
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'name' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `Character` and stores it as `q`
- **5.** `[If]` `search`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((c) => or( c.namePrimary.ilike(`%${search}%`), c.nameNative.ilike(`%${search}%`) ) )
    ```
- **6.** `[If]` `gender`
  - **6.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((c) => c.gender.ilike(gender))
    ```
- **7.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **8.** `[If]` `sortBy === 'name'`
  - **8.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((c) => sortOrder === 'desc' ? c.namePrimary.desc() : c.namePrimary.asc() )
    ```
- **9.** `[Else]` Otherwise
  - **9.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((c) => sortOrder === 'asc' ? c.favorites.asc() : c.favorites.desc() )
    ```
- **10.** `[Sequence]` Calls `Promise.all` and stores result as `[total, items]`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items.map((c) => ({ id: c.id, namePrimary: c.namePrimary, nameNative: c.nameNative, image: c.image, gender: c.gender, age: c.age, ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<skip + items.length < total>"
    }
  }
  ```

#### `getCharacterFilters()` (L119)

- **1.** `[Sequence]` Database `all` on `Character` and stores it as `[allCharacters, total]`
- **2.** `[Sequence]` Define `genderCounts`
  ```typescript
  const genderCounts: Record<string, number> = {}
  ```
- **3.** `[Loop]` Iterate `const c` over `allCharacters`
  - **3.1.** `[If]` `c.gender`
    - **3.1.1.** `[Sequence]` Assign `genderCounts[c.gender]`
      ```typescript
      genderCounts[c.gender] = (genderCounts[c.gender] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "genders": "<Object.entries(genderCounts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)>",
    "total": "<total>"
  }
  ```

#### `getCharacterById(id)` (L141)

- **1.** `[Sequence]` Database `first` on `Character` and stores it as `character`
- **2.** `[If]` `!character`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Character with ID ${id} not found`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "character": "<character>"
  }
  ```

#### `getPeopleCatalog(query)` (L228)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `search`, `occupation`, `language`, `gender`, `sortBy`, `sortOrder`
  ```typescript
  const skip = page - 1 * limit
  const search = query?.search?.trim()
  const occupation = query?.occupation?.trim()
  const language = query?.language?.trim()
  const gender = query?.gender?.trim()
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'name' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `Person` and stores it as `q`
- **5.** `[If]` `search`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((p) => or( p.namePrimary.ilike(`%${search}%`), p.nameNative.ilike(`%${search}%`), p.givenName.ilike(`%${search}%`), p.familyName.ilike(`%${search}%`) ) ...
    ```
- **6.** `[If]` `occupation`
  - **6.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((p) => p.primaryOccupations.ilike(`%${occupation}%`))
    ```
- **7.** `[If]` `language`
  - **7.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((p) => p.language.ilike(language))
    ```
- **8.** `[If]` `gender`
  - **8.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((p) => p.gender.ilike(gender))
    ```
- **9.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **10.** `[If]` `sortBy === 'name'`
  - **10.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((p) => sortOrder === 'desc' ? p.namePrimary.desc() : p.namePrimary.asc() )
    ```
- **11.** `[Else]` Otherwise
  - **11.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((p) => sortOrder === 'asc' ? p.favorites.asc() : p.favorites.desc() )
    ```
- **12.** `[Sequence]` Calls `Promise.all` and stores result as `[total, items]`
- **13.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items.map((p) => ({ id: p.id, namePrimary: p.namePrimary, nameNative: p.nameNative, image: p.image, primaryOccupations: [...p.primaryOccupations], language: p.language, ...)>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<skip + items.length < total>"
    }
  }
  ```

#### `getPeopleFilters()` (L326)

- **1.** `[Sequence]` Database `all` on `Person` and stores it as `[allPeople, total]`
- **2.** `[Sequence]` Define `occupationCounts`, `languageCounts`, `genderCounts`
  ```typescript
  const occupationCounts: Record<string, number> = {}
  const languageCounts: Record<string, number> = {}
  const genderCounts: Record<string, number> = {}
  ```
- **3.** `[Loop]` Iterate `const p` over `allPeople`
  - **3.1.** `[If]` `Array.isArray(p.primaryOccupations)`
    - **3.1.1.** `[Loop]` Iterate `const occ` over `p.primaryOccupations`
      - **3.1.1.1.** `[If]` `occ`
        - **3.1.1.1.1.** `[Sequence]` Assign `occupationCounts[occ]`
          ```typescript
          occupationCounts[occ] = (occupationCounts[occ] || 0) + 1
          ```
  - **3.2.** `[If]` `p.language`
    - **3.2.1.** `[Sequence]` Assign `languageCounts[p.language]`
      ```typescript
      languageCounts[p.language] = (languageCounts[p.language] || 0) + 1
      ```
  - **3.3.** `[If]` `p.gender`
    - **3.3.1.** `[Sequence]` Assign `genderCounts[p.gender]`
      ```typescript
      genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1
      ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "occupations": "<Object.entries(occupationCounts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)>",
    "languages": "<Object.entries(languageCounts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)>",
    "genders": "<Object.entries(genderCounts).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)>",
    "total": "<total>"
  }
  ```

#### `getPersonById(id)` (L369)

- **1.** `[Sequence]` Database `first` on `Person` and stores it as `person`
- **2.** `[If]` `!person`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Person with ID ${id} not found`
- **3.** `[Sequence]` Define `musicTracks`
  ```typescript
  let musicTracks = person.musicTracks
  ```
- **4.** `[If]` `musicTracks.length === 0 && person.namePrimary`
  - **4.1.** `[Sequence]` Assign `musicTracks`
    ```typescript
    musicTracks = await prisma.orm.public.Music .where((m) => m.artistName.ilike(person.namePrimary!)) .select( 'id', 'titlePrimary', 'titleSecondary', 'type', ...
    ```
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "person": {
      "...person": "...",
      "musicTracks": "<musicTracks>"
    }
  }
  ```

#### `getStudioCatalog(query)` (L550)

- **1.** `[Sequence]` Calls `Math.max` and stores result as `page`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `limit`
- **3.** `[Sequence]` Define `skip`, `search`, `isAnimationStudio`, `sortBy`, `sortOrder`
  ```typescript
  const skip = page - 1 * limit
  const search = query?.search?.trim()
  const isAnimationStudio = query?.isAnimationStudio
  const sortBy = query?.sortBy ?? 'popularity'
  const sortOrder = query?.sortOrder ?? sortBy === 'name' ? 'asc' : 'desc'
  ```
- **4.** `[Sequence]` Database `query` on `Studio` and stores it as `q`
- **5.** `[If]` `search`
  - **5.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where((s) => s.name.ilike(`%${search}%`))
    ```
- **6.** `[If]` `typeofisAnimationStudio === 'boolean'`
  - **6.1.** `[Sequence]` Assign `q`
    ```typescript
    q = q.where({ isAnimationStudio })
    ```
- **7.** `[Sequence]` Define `itemsQ`
  ```typescript
  let itemsQ = q
  ```
- **8.** `[If]` `sortBy === 'name'`
  - **8.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((s) => sortOrder === 'desc' ? s.name.desc() : s.name.asc() )
    ```
- **9.** `[Else]` Otherwise
  - **9.1.** `[Sequence]` Assign `itemsQ`
    ```typescript
    itemsQ = itemsQ.orderBy((s) => sortOrder === 'asc' ? s.favorites.asc() : s.favorites.desc() )
    ```
- **10.** `[Sequence]` Calls `Promise.all` and stores result as `[total, items]`
- **11.** `[Return]` 
  ```json
  {
    "success": true,
    "items": "<items.map((s) => ({ id: s.id, name: s.name, isAnimationStudio: s.isAnimationStudio, siteUrl: s.siteUrl, favorites: s.favorites, }))>",
    "pagination": {
      "page": "<page>",
      "limit": "<limit>",
      "total": "<total>",
      "totalPages": "<Math.ceil(total / limit) || 1>",
      "hasMore": "<skip + items.length < total>"
    }
  }
  ```

#### `getStudioFilters()` (L607)

- **1.** `[Sequence]` Database `all` on `Studio` and stores it as `[animationCount, total]`
- **2.** `[Sequence]` Calls `Math.max` and stores result as `otherCount`
- **3.** `[Return]` 
  ```json
  {
    "success": true,
    "types": [
      {
        "value": "Animation Studio",
        "count": "<animationCount>"
      }
    ],
    "total": "<total>"
  }
  ```

#### `getStudioById(id)` (L625)

- **1.** `[Sequence]` Database `first` on `Studio` and stores it as `studio`
- **2.** `[If]` `!studio`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — `Studio with ID ${id} not found`
- **3.** `[Sequence]` Database `all` on `MediaStudio` and stores it as `[mediaStudioRecords, totalCreations]`
- **4.** `[Sequence]` Define `creations`
  ```typescript
  const creations = mediaStudioRecords.map((record) => { if (record.anime) { return { id: record.id, mediaType: 'anime', mediaId: record.anime.id, titlePrimary: record.anime.titlePrimary, ...).filter(Boolean)
  ```
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "studio": {
      "...studio": "...",
      "creationsCount": "<totalCreations>",
      "creations": "<creations>"
    }
  }
  ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `and`, `or`, `countOf`

### Called By / Imported By
- [apps/borealis/entities/entities.ctrl.ts](./entities.ctrl.md) ([[apps/borealis/entities/entities.ctrl]]) — `BorealisEntitiesServ`
