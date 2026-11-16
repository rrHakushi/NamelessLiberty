# media-entity.syncer.ts

- **Source**: [`apps/borealis/sync/media-entity.syncer.ts`](../../../../../../../apps/elysia/src/apps/borealis/sync/media-entity.syncer.ts)
- **Layer / Role**: Media Syncer
- **Inheritance**: `MediaEntitySyncer extends BaseMediaSyncer`

## Exported Types, Methods & Algorithms

### `interface DiscoveredRelation` (L29)

### `interface EntitySyncResult` (L39)

### `function mapRelationType` (L44)

- **1.** `[Sequence]` Define `norm`
  ```typescript
  const norm = rawType.toUpperCase().replace(/\s+/g, '_')
  ```
- **2.** `[Switch]` Branch on `norm`
  - **2.1.** `[Case]` Case `'PREQUEL'`
    - **2.1.1.** `[Return]`  — `'PREQUEL'`
  - **2.2.** `[Case]` Case `'SEQUEL'`
    - **2.2.1.** `[Return]`  — `'SEQUEL'`
  - **2.3.** `[Case]` Case `'ADAPTATION'`
    - **2.3.1.** `[Return]`  — `'ADAPTATION'`
  - **2.4.** `[Case]` Case `'SIDE_STORY'`
    - **2.4.1.** `[Return]`  — `'SIDE_STORY'`
  - **2.5.** `[Case]` Case `'SPIN_OFF'`
    - **2.5.1.** `[Return]`  — `'SPIN_OFF'`
  - **2.6.** `[Case]` Case `'SUMMARY'`
    - **2.6.1.** `[Return]`  — `'SUMMARY'`
  - **2.7.** `[Case]` Case `'ALTERNATIVE'`
    - **2.7.1.** `[Return]`  — `'ALTERNATIVE'`
  - **2.8.** `[Case]` Case `'CHARACTER'`
    - **2.8.1.** `[Return]`  — `'CHARACTER'`
  - **2.9.** `[Case]` Case `'PARENT'`
  - **2.10.** `[Case]` Case `'SOURCE'`
  - **2.11.** `[Case]` Case `'COMPILATION'`
  - **2.12.** `[Case]` Case `'CONTAINS'`
  - **2.13.** `[Case]` Case `'OTHER'`
    - **2.13.1.** `[Return]`  — `'OTHER'`
  - **2.14.** `[Case]` Default
    - **2.14.1.** `[Return]`  — `'UNKNOWN'`

### `class MediaEntitySyncer` extends `BaseMediaSyncer` (L74)

#### `upsertGenres(genreNames)`: `Promise<Array<{ id: number }>>` (L75)

- **1.** `[If]` `!genreNames || genreNames.length === 0`
  - **1.1.** `[Return]`  — `[]`
- **2.** `[Sequence]` Define `results`
  ```typescript
  const results: Array<{ id: number }> = []
  ```
- **3.** `[Loop]` Iterate `const name` over `genreNames`
  - **3.1.** `[Sequence]` Define `clean`
    ```typescript
    const clean = name.trim()
    ```
  - **3.2.** `[If]` `!clean`
  - **3.3.** `[Sequence]` Define `slug`
    ```typescript
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'genre'
    ```
  - **3.4.** `[Try]` Try block
    - **3.4.1.** `[Sequence]` Database `first` on `Genre` and stores it as `genre`
    - **3.4.2.** `[If]` `!genre`
      - **3.4.2.1.** `[Sequence]` Assign `genre`
        ```typescript
        genre = await prisma.orm.public.Genre.create({ name: clean, slug })
        ```
  - **3.5.** `[Catch]` Catch (`err`)
- **4.** `[Return]`  — `results`

#### `upsertTags(tags)`: `Promise<Array<{ id: number }>>` (L93)

- **1.** `[If]` `!tags || tags.length === 0`
  - **1.1.** `[Return]`  — `[]`
- **2.** `[Sequence]` Define `results`, `seen`
  ```typescript
  const results: Array<{ id: number }> = []
  const seen = new Set<string>()
  ```
- **3.** `[Loop]` Iterate `const item` over `tags`
  - **3.1.** `[Sequence]` Define `rawName`, `name`
    ```typescript
    const rawName = typeof item === 'string' ? item : item.name || item.tag || item.tagName
    const name = rawName?.trim()
    ```
  - **3.2.** `[If]` `!name || !isNaN(Number(name))`
  - **3.3.** `[Sequence]` Define `key`
    ```typescript
    const key = name.toLowerCase()
    ```
  - **3.4.** `[If]` `seen.has(key)`
  - **3.5.** `[Sequence]` Calls `seen.add`
  - **3.6.** `[Sequence]` Define `slug`, `category`, `description`
    ```typescript
    const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tag'
    const category = typeof item === 'object' ? item.category?.trim() || item.tagName?.trim() : undefined
    const description = typeof item === 'object' ? item.description?.trim() || item.helpText?.trim() : undefined
    ```
  - **3.7.** `[Try]` Try block
    - **3.7.1.** `[Sequence]` Database `first` on `Tag` and stores it as `tag`
    - **3.7.2.** `[If]` `!tag`
      - **3.7.2.1.** `[Sequence]` Assign `tag`
        ```typescript
        tag = await prisma.orm.public.Tag.create({ name, slug, category: category || null, description: description || null, })
        ```
  - **3.8.** `[Catch]` Catch (`err`)
    - **3.8.1.** `[Try]` Try block
      - **3.8.1.1.** `[Sequence]` Database `first` on `Tag` and stores it as `fallback`
      - **3.8.1.2.** `[If]` `fallback`
    - **3.8.2.** `[Catch]` Catch (`err`)
- **4.** `[Return]`  — `results`

#### `upsertStudio(data)`: `Promise<{ id: number }>` (L133)

- **1.** `[Sequence]` Define `cleanName`
  ```typescript
  const cleanName = data.name.trim()
  ```
- **2.** `[Try]` Try block
  - **2.1.** `[If]` `data.tvDBId`
    - **2.1.1.** `[Sequence]` Database `first` on `Studio` and stores it as `existing`
    - **2.1.2.** `[If]` `existing`
      - **2.1.2.1.** `[Return]`  — `existing`
  - **2.2.** `[If]` `data.anilistId`
    - **2.2.1.** `[Sequence]` Database `first` on `Studio` and stores it as `existing`
    - **2.2.2.** `[If]` `existing`
      - **2.2.2.1.** `[Return]`  — `existing`
  - **2.3.** `[Sequence]` Database `first` on `Studio` and stores it as `existingByName`
  - **2.4.** `[If]` `existingByName`
    - **2.4.1.** `[Return]`  — `existingByName`
  - **2.5.** `[Return]`  — `await prisma.orm.public.Studio.create({ name: cleanName, tvDBId: data.tvDBId || null, anilistId: data.anilistId || null, isAnimationStudio: data.isAnimationStudio || false, siteUrl: data.siteUrl || null, })`
- **3.** `[Catch]` Catch (`err`)
  - **3.1.** `[Sequence]` Database `first` on `Studio` and stores it as `fallback`
  - **3.2.** `[If]` `fallback`
    - **3.2.1.** `[Return]`  — `fallback`
  - **3.3.** `[Error]` Throws `Error` — `Failed to upsert studio "${cleanName}"`

#### `linkMediaStudio(mediaType, mediaId, studioId, isMain = false)`: `Promise<void>` (L167)

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Database `first` on `MediaStudio` and stores it as `existing`
  - **1.2.** `[If]` `!existing`
    - **1.2.1.** `[Sequence]` Database `create` on `MediaStudio`
- **2.** `[Catch]` Catch (`err`)

#### `syncTvdbCharactersAndStaff(mediaType, mediaId, characters)`: `Promise<void>` (L196)

- **1.** `[If]` `!characters || !Array.isArray(characters) || characters.length === 0`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Define `seenCast`
  ```typescript
  const seenCast = new Set<string>()
  ```
- **3.** `[Loop]` Iterate `const c` over `characters`
  - **3.1.** `[Sequence]` Define `key`
    ```typescript
    const key = `${c.id}_${c.peopleId}_${c.name}_${c.personName}`
    ```
  - **3.2.** `[If]` `seenCast.has(key)`
  - **3.3.** `[Sequence]` Calls `seenCast.add`
  - **3.4.** `[Sequence]` Define `isActor`, `personRecord`
    ```typescript
    const isActor = !c.peopleType || c.peopleType.toLowerCase() === 'actor' || c.type === 3 || c.typeName && c.typeName.toLowerCase() === 'actor'
    let personRecord: { id: number; image?: string | null } | null = null
    ```
  - **3.5.** `[If]` `c.personName || c.peopleId`
    - **3.5.1.** `[Sequence]` Define `pName`
      ```typescript
      const pName = c.personName || 'Unknown Person'.trim()
      ```
    - **3.5.2.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `pImg`
    - **3.5.3.** `[If]` `c.peopleId`
      - **3.5.3.1.** `[Sequence]` Assign `personRecord`
        ```typescript
        personRecord = await prisma.orm.public.Person.where({ tvDBId: c.peopleId }).select('id', 'image').first()
        ```
    - **3.5.4.** `[If]` `!personRecord`
      - **3.5.4.1.** `[Sequence]` Assign `personRecord`
        ```typescript
        personRecord = await prisma.orm.public.Person.where({ namePrimary: pName }).select('id', 'image').first()
        ```
    - **3.5.5.** `[If]` `!personRecord`
      - **3.5.5.1.** `[Sequence]` Assign `personRecord`
        ```typescript
        personRecord = await prisma.orm.public.Person.create({ tvDBId: c.peopleId || null, namePrimary: pName, nameAlternative: [], image: pImg, primaryOccupations: [], yearsActive: [], ...
        ```
    - **3.5.6.** `[Else]` Otherwise
      - **3.5.6.1.** `[If]` `!personRecord.image && pImg`
        - **3.5.6.1.1.** `[Sequence]` Database `update` on `Person`
  - **3.6.** `[Sequence]` Define `charRecord`
    ```typescript
    let charRecord: { id: number; image?: string | null } | null = null
    ```
  - **3.7.** `[If]` `c.name && isActor`
    - **3.7.1.** `[Sequence]` Define `cName`
      ```typescript
      const cName = c.name.trim()
      ```
    - **3.7.2.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `cImg`
    - **3.7.3.** `[If]` `c.id`
      - **3.7.3.1.** `[Sequence]` Assign `charRecord`
        ```typescript
        charRecord = await prisma.orm.public.Character.where({ tvDBId: c.id }).select('id', 'image').first()
        ```
    - **3.7.4.** `[If]` `!charRecord`
      - **3.7.4.1.** `[Sequence]` Assign `charRecord`
        ```typescript
        charRecord = await prisma.orm.public.Character.where({ namePrimary: cName }).select('id', 'image').first()
        ```
    - **3.7.5.** `[If]` `!charRecord`
      - **3.7.5.1.** `[Sequence]` Assign `charRecord`
        ```typescript
        charRecord = await prisma.orm.public.Character.create({ tvDBId: c.id || null, namePrimary: cName, nameAlternative: [], nameAlternativeSpoiler: [], image: cImg, favorites: 0, ...
        ```
    - **3.7.6.** `[Else]` Otherwise
      - **3.7.6.1.** `[If]` `!charRecord.image && cImg`
        - **3.7.6.1.1.** `[Sequence]` Database `update` on `Character`
  - **3.8.** `[If]` `isActor && charRecord`
    - **3.8.1.** `[Sequence]` Define `role`
      ```typescript
      const role = c.isFeatured ? 'MAIN' : 'SUPPORTING'
      ```
    - **3.8.2.** `[Sequence]` Database `first` on `MediaCharacter` and stores it as `existingMC`
    - **3.8.3.** `[If]` `existingMC`
      - **3.8.3.1.** `[If]` `personRecord && existingMC.actorId !== personRecord.id`
        - **3.8.3.1.1.** `[Sequence]` Database `update` on `MediaCharacter`
    - **3.8.4.** `[Else]` Otherwise
      - **3.8.4.1.** `[Sequence]` Database `create` on `MediaCharacter`
  - **3.9.** `[Else]` Otherwise
    - **3.9.1.** `[If]` `personRecord`
      - **3.9.1.1.** `[Sequence]` Define `rawRole`, `staffRole`
        ```typescript
        const rawRole = c.typeName || c.peopleType || isActor ? 'CAST' : 'OTHER'.toUpperCase()
        let staffRole: any = 'OTHER'
        ```
      - **3.9.1.2.** `[If]` `rawRole.includes('DIRECTOR')`
        - **3.9.1.2.1.** `[Sequence]` Assign `staffRole`
          ```typescript
          staffRole = 'DIRECTOR'
          ```
      - **3.9.1.3.** `[Else]` Otherwise
        - **3.9.1.3.1.** `[If]` `rawRole.includes('WRITER') || rawRole.includes('SCRIPT')`
          - **3.9.1.3.1.1.** `[Sequence]` Assign `staffRole`
            ```typescript
            staffRole = 'SCRIPT'
            ```
        - **3.9.1.3.2.** `[Else]` Otherwise
          - **3.9.1.3.2.1.** `[If]` `rawRole.includes('PRODUCER')`
            - **3.9.1.3.2.1.1.** `[Sequence]` Assign `staffRole`
              ```typescript
              staffRole = rawRole.includes('EXEC') ? 'EXECUTIVE_PRODUCER' : 'PRODUCER'
              ```
          - **3.9.1.3.2.2.** `[Else]` Otherwise
            - **3.9.1.3.2.2.1.** `[If]` `rawRole.includes('MUSIC') || rawRole.includes('COMPOSER')`
              - **3.9.1.3.2.2.1.1.** `[Sequence]` Assign `staffRole`
                ```typescript
                staffRole = 'COMPOSER'
                ```
            - **3.9.1.3.2.2.2.** `[Else]` Otherwise
              - **3.9.1.3.2.2.2.1.** `[If]` `rawRole.includes('ACTOR') || rawRole.includes('CAST')`
                - **3.9.1.3.2.2.2.1.1.** `[Sequence]` Assign `staffRole`
                  ```typescript
                  staffRole = 'CAST'
                  ```
              - **3.9.1.3.2.2.2.2.** `[Else]` Otherwise
                - **3.9.1.3.2.2.2.2.1.** `[If]` `rawRole.includes('AUTHOR')`
                  - **3.9.1.3.2.2.2.2.1.1.** `[Sequence]` Assign `staffRole`
                    ```typescript
                    staffRole = 'AUTHOR'
                    ```
                - **3.9.1.3.2.2.2.2.2.** `[Else]` Otherwise
                  - **3.9.1.3.2.2.2.2.2.1.** `[If]` `rawRole.includes('ART') || rawRole.includes('ILLUSTRAT')`
                    - **3.9.1.3.2.2.2.2.2.1.1.** `[Sequence]` Assign `staffRole`
                      ```typescript
                      staffRole = 'ILLUSTRATOR'
                      ```
      - **3.9.1.4.** `[Sequence]` Database `first` on `MediaStaff` and stores it as `existingMS`
      - **3.9.1.5.** `[If]` `!existingMS`
        - **3.9.1.5.1.** `[Sequence]` Database `create` on `MediaStaff`

#### `handleMusicRelation(sourceType, sourceId, edge)`: `Promise<void>` (L324)

- **1.** `[Sequence]` Define `rawTitle`, `musicTitle`
  ```typescript
  const rawTitle = edge.node?.title?.userPreferred || edge.node?.title?.english || edge.node?.title?.romaji || ''
  const musicTitle = rawTitle.trim()
  ```
- **2.** `[If]` `!musicTitle`
  - **2.1.** `[Return]`  — `void`
- **3.** `[Try]` Try block
  - **3.1.** `[Sequence]` Calls `deezerProvider.searchTracks(musicTitle, 3).catch` and stores result as `tracks`
  - **3.2.** `[Sequence]` Define `musicStub`
    ```typescript
    let musicStub: PreviewResult | null = null
    ```
  - **3.3.** `[If]` `tracks && tracks.length > 0 && tracks[0]`
    - **3.3.1.** `[Sequence]` Assign `musicStub`
      ```typescript
      musicStub = await MediaPreviewSyncer.upsertMusicTrackSearchPreview(tracks[0])
      ```
  - **3.4.** `[Else]` Otherwise
    - **3.4.1.** `[Sequence]` Calls `deezerProvider.searchAlbums(musicTitle, 3).catch` and stores result as `albums`
    - **3.4.2.** `[If]` `albums && albums.length > 0 && albums[0]`
      - **3.4.2.1.** `[Sequence]` Assign `musicStub`
        ```typescript
        musicStub = await MediaPreviewSyncer.upsertMusicAlbumSearchPreview(albums[0])
        ```
  - **3.5.** `[If]` `musicStub`
    - **3.5.1.** `[Sequence]` Database `first` on `MediaRelation` and stores it as `existingRel`
    - **3.5.2.** `[If]` `!existingRel`
      - **3.5.2.1.** `[Sequence]` Database `create` on `MediaRelation`
    - **3.5.3.** `[Sequence]` Calls `MediaQueueManager.enqueueMediaUpdate('MUSIC', musicStub.id, { externalId: musicStub.externalId, priority: 3, depth: 0, maxDepth: 0, jobId: `media-update-MUSIC-${musicStub.id}`, }).catch`
  - **3.6.** `[Else]` Otherwise
- **4.** `[Catch]` Catch (`err`)
  - **4.1.** `[Warning]` Logs warning — `${c.red('⚠️ [Music Relation Error]')}: Failed to resolve music relation "${musicTitle}": ${err?.message || err}`

#### `syncMediaCharacters(mediaType, mediaId, characters)`: `Promise<void>` (L395)

- **1.** `[If]` `!characters?.edges || !Array.isArray(characters.edges)`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Loop]` Iterate `const edge` over `characters.edges`
  - **2.1.** `[If]` `!edge?.node?.name?.full`
  - **2.2.** `[Sequence]` Define `anilistCharId`, `charImage`
    ```typescript
    const anilistCharId = edge.node.id
    const charImage = edge.node.image?.large || edge.node.image?.medium || null
    ```
  - **2.3.** `[Try]` Try block
    - **2.3.1.** `[Sequence]` Database `first` on `Character` and stores it as `char`
    - **2.3.2.** `[If]` `!char`
      - **2.3.2.1.** `[Sequence]` Assign `char`
        ```typescript
        char = await prisma.orm.public.Character.create({ anilistId: anilistCharId, namePrimary: edge.node.name.full, nameNative: edge.node.name.native || null, nameAlternative: edge.node.name.alternative || [], nameAlternativeSpoiler: edge.node.name.alternativeSpoiler || [], image: charImage, ...
        ```
    - **2.3.3.** `[Else]` Otherwise
      - **2.3.3.1.** `[Sequence]` Database `update` on `Character`
    - **2.3.4.** `[Sequence]` Define `role`, `voiceActors`
      ```typescript
      const role = edge.role === 'MAIN' ? 'MAIN' : edge.role === 'SUPPORTING' ? 'SUPPORTING' : 'BACKGROUND'
      const voiceActors = edge as any.voiceActors
      ```
    - **2.3.5.** `[If]` `voiceActors && Array.isArray(voiceActors) && voiceActors.length > 0`
      - **2.3.5.1.** `[Loop]` Iterate `const va` over `voiceActors`
        - **2.3.5.1.1.** `[If]` `!va?.name?.full`
        - **2.3.5.1.2.** `[Sequence]` Define `vaImage`
          ```typescript
          const vaImage = va.image?.large || va.image?.medium || null
          ```
        - **2.3.5.1.3.** `[Sequence]` Database `first` on `Person` and stores it as `person`
        - **2.3.5.1.4.** `[If]` `!person`
          - **2.3.5.1.4.1.** `[Sequence]` Assign `person`
            ```typescript
            person = await prisma.orm.public.Person.create({ anilistId: va.id, namePrimary: va.name.full, nameNative: va.name.native || null, nameAlternative: [], image: vaImage, language: va.languageV2 || null, ...
            ```
        - **2.3.5.1.5.** `[Else]` Otherwise
          - **2.3.5.1.5.1.** `[If]` `!person.image && vaImage`
            - **2.3.5.1.5.1.1.** `[Sequence]` Database `update` on `Person`
        - **2.3.5.1.6.** `[Sequence]` Database `first` on `MediaCharacter` and stores it as `existingMC`
        - **2.3.5.1.7.** `[If]` `existingMC`
          - **2.3.5.1.7.1.** `[Sequence]` Database `update` on `MediaCharacter`
        - **2.3.5.1.8.** `[Else]` Otherwise
          - **2.3.5.1.8.1.** `[Sequence]` Database `create` on `MediaCharacter`
    - **2.3.6.** `[Else]` Otherwise
      - **2.3.6.1.** `[Sequence]` Database `first` on `MediaCharacter` and stores it as `existingMC`
      - **2.3.6.2.** `[If]` `existingMC`
        - **2.3.6.2.1.** `[Sequence]` Database `update` on `MediaCharacter`
      - **2.3.6.3.** `[Else]` Otherwise
        - **2.3.6.3.1.** `[Sequence]` Database `create` on `MediaCharacter`
  - **2.4.** `[Catch]` Catch (`err`)
    - **2.4.1.** `[Warning]` Logs warning — `Failed to sync character for ${mediaType} #${mediaId}: ${err?.message || err}`

#### `syncMediaStaff(mediaType, mediaId, staff)`: `Promise<void>` (L523)

- **1.** `[If]` `!staff?.edges || !Array.isArray(staff.edges)`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Loop]` Iterate `const edge` over `staff.edges`
  - **2.1.** `[If]` `!edge?.node?.name?.full`
  - **2.2.** `[Sequence]` Define `anilistPersonId`, `staffImage`
    ```typescript
    const anilistPersonId = edge.node.id
    const staffImage = edge.node.image?.large || edge.node.image?.medium || null
    ```
  - **2.3.** `[Try]` Try block
    - **2.3.1.** `[Sequence]` Database `first` on `Person` and stores it as `person`
    - **2.3.2.** `[If]` `!person`
      - **2.3.2.1.** `[Sequence]` Assign `person`
        ```typescript
        person = await prisma.orm.public.Person.create({ anilistId: anilistPersonId, namePrimary: edge.node.name.full, nameNative: edge.node.name.native || null, nameAlternative: edge.node.name.alternative || [], image: staffImage, description: edge.node.description || null, ...
        ```
    - **2.3.3.** `[Else]` Otherwise
      - **2.3.3.1.** `[Sequence]` Database `update` on `Person`
    - **2.3.4.** `[Sequence]` Database `first` on `MediaStaff` and stores it as `existingStaff`
    - **2.3.5.** `[If]` `existingStaff`
      - **2.3.5.1.** `[Sequence]` Database `update` on `MediaStaff`
    - **2.3.6.** `[Else]` Otherwise
      - **2.3.6.1.** `[Sequence]` Database `create` on `MediaStaff`
  - **2.4.** `[Catch]` Catch (`err`)
    - **2.4.1.** `[Warning]` Logs warning — `Failed to sync staff member for ${mediaType} #${mediaId}: ${err?.message || err}`

#### `syncAnime(animeId, externalId)`: `Promise<EntitySyncResult>` (L592)
Fully synchronizes an Anime entity from AniList, discovers connected relations, creates local preview stubs, and establishes MediaRelation edges.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `anilistId`
    ```typescript
    let anilistId: number | null = externalId ? Number(externalId) : null
    ```
  - **1.2.** `[If]` `!anilistId`
    - **1.2.1.** `[Sequence]` Database `first` on `Anime` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `anilistId`
      ```typescript
      anilistId = record?.anilistId ?? null
      ```
  - **1.3.** `[If]` `!anilistId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync Anime #${animeId}: missing AniList ID`
    - **1.3.2.** `[Return]` 
      ```json
      {
        "synced": false,
        "discoveredRelations": []
      }
      ```
  - **1.4.** `[Sequence]` Calls `anilistProvider.fetchAnime` and stores result as `alData`
  - **1.5.** `[If]` `!alData`
    - **1.5.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [AniList Empty]')}: No anime data returned for AniList #${anilistId}`
    - **1.5.2.** `[Return]` 
      ```json
      {
        "synced": false,
        "discoveredRelations": []
      }
      ```
  - **1.6.** `[Sequence]` Define `displayTitle`
    ```typescript
    const displayTitle = alData.title.userPreferred || alData.title.english || alData.title.romaji || 'Unknown'
    ```
  - **1.7.** `[Sequence]` Calls `this.upsertGenres` and stores result as `genreRecords`
  - **1.8.** `[Sequence]` Calls `animeMappingProvider.lookup({ anilistId, malId: alData.idMal || undefined }).catch` and stores result as `mappedIds`
  - **1.9.** `[Sequence]` Define `sources`
    ```typescript
    const sources: Record<string, any> = { anilist: { id: alData.id, url: alData.siteUrl || `https://anilist.co/anime/${alData.id}`, }, }
    ```
  - **1.10.** `[If]` `alData.idMal`
    - **1.10.1.** `[Sequence]` Assign `sources.myanimelist`
      ```typescript
      sources.myanimelist = { id: alData.idMal, url: `https://myanimelist.net/anime/${alData.idMal}`, }
      ```
  - **1.11.** `[If]` `mappedIds?.anidbId`
    - **1.11.1.** `[Sequence]` Assign `sources.anidb`
      ```typescript
      sources.anidb = { id: mappedIds.anidbId, url: `https://anidb.net/anime/${mappedIds.anidbId}`, }
      ```
  - **1.12.** `[If]` `mappedIds?.tvdbId`
    - **1.12.1.** `[Sequence]` Assign `sources.thetvdb`
      ```typescript
      sources.thetvdb = { id: mappedIds.tvdbId, url: `https://thetvdb.com/dereferrer/series/${mappedIds.tvdbId}`, }
      ```
  - **1.13.** `[If]` `mappedIds?.bangumiId`
    - **1.13.1.** `[Sequence]` Assign `sources.bangumi`
      ```typescript
      sources.bangumi = { id: mappedIds.bangumiId, url: `https://bgm.tv/subject/${mappedIds.bangumiId}`, }
      ```
  - **1.14.** `[If]` `mappedIds?.kitsuId`
    - **1.14.1.** `[Sequence]` Assign `sources.kitsu`
      ```typescript
      sources.kitsu = { id: mappedIds.kitsuId, url: `https://kitsu.app/anime/${mappedIds.kitsuId}`, }
      ```
  - **1.15.** `[If]` `mappedIds?.imdbId`
    - **1.15.1.** `[Sequence]` Assign `sources.imdb`
      ```typescript
      sources.imdb = { id: mappedIds.imdbId, url: `https://www.imdb.com/title/${mappedIds.imdbId}`, }
      ```
  - **1.16.** `[If]` `mappedIds?.tmdbId`
    - **1.16.1.** `[Sequence]` Assign `sources.tmdb`
      ```typescript
      sources.tmdb = { id: mappedIds.tmdbId, url: `https://www.themoviedb.org/tv/${mappedIds.tmdbId}`, }
      ```
  - **1.17.** `[Sequence]` Define `tvdbImages`
    ```typescript
    let tvdbImages: string[] = []
    ```
  - **1.18.** `[If]` `mappedIds?.tvdbId`
    - **1.18.1.** `[Try]` Try block
      - **1.18.1.1.** `[Sequence]` Assign `tvdbImages`
        ```typescript
        tvdbImages = await tvdbProvider.fetchTvSeriesArtworks(mappedIds.tvdbId)
        ```
    - **1.18.2.** `[Catch]` Catch (`err`)
  - **1.19.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **1.20.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.21.** `[Sequence]` Database `update` on `Anime`
  - **1.22.** `[If]` `genreRecords.length > 0`
    - **1.22.1.** `[Try]` Try block
      - **1.22.1.1.** `[Sequence]` Database `deleteAll` on `AnimeGenre`
    - **1.22.2.** `[Catch]` Catch (`err`)
    - **1.22.3.** `[Loop]` Iterate `const g` over `genreRecords`
      - **1.22.3.1.** `[Sequence]` Database `create` on `AnimeGenre`
  - **1.23.** `[If]` `alData as any.tags && Array.isArray(alData as any.tags)`
    - **1.23.1.** `[Sequence]` Calls `this.upsertTags` and stores result as `tagRecords`
    - **1.23.2.** `[If]` `tagRecords.length > 0`
      - **1.23.2.1.** `[Try]` Try block
        - **1.23.2.1.1.** `[Sequence]` Database `deleteAll` on `AnimeTag`
      - **1.23.2.2.** `[Catch]` Catch (`err`)
      - **1.23.2.3.** `[Loop]` Iterate `const t` over `tagRecords`
        - **1.23.2.3.1.** `[Sequence]` Database `create` on `AnimeTag`
  - **1.24.** `[If]` `alData.studios?.edges && Array.isArray(alData.studios.edges)`
    - **1.24.1.** `[Loop]` Iterate `const edge` over `alData.studios.edges`
      - **1.24.1.1.** `[If]` `!edge?.node?.name`
      - **1.24.1.2.** `[Try]` Try block
        - **1.24.1.2.1.** `[Sequence]` Calls `this.upsertStudio` and stores result as `studio`
        - **1.24.1.2.2.** `[Sequence]` Calls `this.linkMediaStudio`
      - **1.24.1.3.** `[Catch]` Catch (`err`)
  - **1.25.** `[Sequence]` Calls `this.syncMediaCharacters`
  - **1.26.** `[Sequence]` Calls `this.syncMediaStaff`
  - **1.27.** `[Sequence]` Define `discoveredRelations`
    ```typescript
    const discoveredRelations: DiscoveredRelation[] = []
    ```
  - **1.28.** `[If]` `alData.relations?.edges && Array.isArray(alData.relations.edges)`
    - **1.28.1.** `[Loop]` Iterate `const edge` over `alData.relations.edges`
      - **1.28.1.1.** `[If]` `!edge?.node`
      - **1.28.1.2.** `[Sequence]` Define `isMusic`
        ```typescript
        const isMusic = edge.node.format === 'MUSIC' || edge.node.type as string === 'MUSIC'
        ```
      - **1.28.1.3.** `[If]` `isMusic`
        - **1.28.1.3.1.** `[Sequence]` Calls `this.handleMusicRelation`
      - **1.28.1.4.** `[Sequence]` Define `rawRelType`
        ```typescript
        const rawRelType = edge.relationType
        ```
      - **1.28.1.5.** `[If]` `!rawRelType`
      - **1.28.1.6.** `[Sequence]` Calls `mapRelationType` and stores result as `relType`
      - **1.28.1.7.** `[If]` `relType === 'UNKNOWN'`
      - **1.28.1.8.** `[Sequence]` Define `targetType`, `targetExternalId`
        ```typescript
        const targetType: MediaType = edge.node.type === 'MANGA' ? 'MANGA' : 'ANIME'
        const targetExternalId = edge.node.id
        ```
      - **1.28.1.9.** `[If]` `!targetExternalId`
      - **1.28.1.10.** `[Sequence]` Define `localTargetId`
        ```typescript
        let localTargetId: number
        ```
      - **1.28.1.11.** `[If]` `targetType === 'ANIME'`
        - **1.28.1.11.1.** `[Sequence]` Database `first` on `Anime` and stores it as `targetAnime`
        - **1.28.1.11.2.** `[If]` `!targetAnime`
          - **1.28.1.11.2.1.** `[Sequence]` Define `targetTitle`
            ```typescript
            const targetTitle = edge.node.title?.english || edge.node.title?.userPreferred || edge.node.title?.romaji || `Anime #${targetExternalId}`
            ```
          - **1.28.1.11.2.2.** `[Sequence]` Assign `targetAnime`
            ```typescript
            targetAnime = await prisma.orm.public.Anime.create({ anilistId: targetExternalId, titlePrimary: targetTitle, titleSecondary: edge.node.title?.romaji || edge.node.title?.english || null, titleNative: edge.node.title?.native || null, coverImage: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large || edge.node.coverImage?.medium || null, format: mapAnimeFormat(edge.node.format), ...
            ```
        - **1.28.1.11.3.** `[Sequence]` Assign `localTargetId`
          ```typescript
          localTargetId = targetAnime.id
          ```
      - **1.28.1.12.** `[Else]` Otherwise
        - **1.28.1.12.1.** `[Sequence]` Database `first` on `Manga` and stores it as `targetManga`
        - **1.28.1.12.2.** `[If]` `!targetManga`
          - **1.28.1.12.2.1.** `[Sequence]` Define `targetTitle`
            ```typescript
            const targetTitle = edge.node.title?.english || edge.node.title?.userPreferred || edge.node.title?.romaji || `Manga #${targetExternalId}`
            ```
          - **1.28.1.12.2.2.** `[Sequence]` Assign `targetManga`
            ```typescript
            targetManga = await prisma.orm.public.Manga.create({ anilistId: targetExternalId, titlePrimary: targetTitle, titleSecondary: edge.node.title?.romaji || edge.node.title?.english || null, titleNative: edge.node.title?.native || null, coverImage: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large || edge.node.coverImage?.medium || null, format: mapMangaFormat(edge.node.format), ...
            ```
        - **1.28.1.12.3.** `[Sequence]` Assign `localTargetId`
          ```typescript
          localTargetId = targetManga.id
          ```
      - **1.28.1.13.** `[Sequence]` Database `first` on `MediaRelation` and stores it as `existingRel`
      - **1.28.1.14.** `[If]` `!existingRel`
        - **1.28.1.14.1.** `[Sequence]` Database `create` on `MediaRelation`
  - **1.29.** `[Return]` 
    ```json
    {
      "synced": true,
      "discoveredRelations": "<discoveredRelations>"
    }
    ```
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]` 
    ```json
    {
      "synced": false,
      "discoveredRelations": []
    }
    ```

#### `syncManga(mangaId, externalId)`: `Promise<EntitySyncResult>` (L883)
Fully synchronizes a Manga entity from AniList, discovers connected relations, creates local preview stubs, and establishes MediaRelation edges.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `anilistId`
    ```typescript
    let anilistId: number | null = externalId ? Number(externalId) : null
    ```
  - **1.2.** `[If]` `!anilistId`
    - **1.2.1.** `[Sequence]` Database `first` on `Manga` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `anilistId`
      ```typescript
      anilistId = record?.anilistId ?? null
      ```
  - **1.3.** `[If]` `!anilistId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync Manga #${mangaId}: missing AniList ID`
    - **1.3.2.** `[Return]` 
      ```json
      {
        "synced": false,
        "discoveredRelations": []
      }
      ```
  - **1.4.** `[Sequence]` Calls `anilistProvider.fetchManga` and stores result as `alData`
  - **1.5.** `[If]` `!alData`
    - **1.5.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [AniList Empty]')}: No manga data returned for AniList #${anilistId}`
    - **1.5.2.** `[Return]` 
      ```json
      {
        "synced": false,
        "discoveredRelations": []
      }
      ```
  - **1.6.** `[Sequence]` Define `displayTitle`
    ```typescript
    const displayTitle = alData.title.userPreferred || alData.title.english || alData.title.romaji || 'Unknown'
    ```
  - **1.7.** `[Sequence]` Calls `this.upsertGenres` and stores result as `genreRecords`
  - **1.8.** `[Sequence]` Calls `animeMappingProvider.lookupManga({ anilistId, malId: alData.idMal || undefined, title: alData.title.english || alData.title.userPreferred || alData.title.romaji || '', titleNative: alData.title.native || undefined, }).catch` and stores result as `mappedIds`
  - **1.9.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **1.10.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.11.** `[Sequence]` Database `update` on `Manga`
  - **1.12.** `[If]` `genreRecords.length > 0`
    - **1.12.1.** `[Try]` Try block
      - **1.12.1.1.** `[Sequence]` Database `deleteAll` on `MangaGenre`
    - **1.12.2.** `[Catch]` Catch (`err`)
    - **1.12.3.** `[Loop]` Iterate `const g` over `genreRecords`
      - **1.12.3.1.** `[Sequence]` Database `create` on `MangaGenre`
  - **1.13.** `[If]` `alData as any.tags && Array.isArray(alData as any.tags)`
    - **1.13.1.** `[Sequence]` Calls `this.upsertTags` and stores result as `tagRecords`
    - **1.13.2.** `[If]` `tagRecords.length > 0`
      - **1.13.2.1.** `[Try]` Try block
        - **1.13.2.1.1.** `[Sequence]` Database `deleteAll` on `MangaTag`
      - **1.13.2.2.** `[Catch]` Catch (`err`)
      - **1.13.2.3.** `[Loop]` Iterate `const t` over `tagRecords`
        - **1.13.2.3.1.** `[Sequence]` Database `create` on `MangaTag`
  - **1.14.** `[Sequence]` Calls `this.syncMediaCharacters`
  - **1.15.** `[Sequence]` Calls `this.syncMediaStaff`
  - **1.16.** `[Sequence]` Define `discoveredRelations`
    ```typescript
    const discoveredRelations: DiscoveredRelation[] = []
    ```
  - **1.17.** `[If]` `alData.relations?.edges && Array.isArray(alData.relations.edges)`
    - **1.17.1.** `[Loop]` Iterate `const edge` over `alData.relations.edges`
      - **1.17.1.1.** `[If]` `!edge?.node`
      - **1.17.1.2.** `[Sequence]` Define `isMusic`
        ```typescript
        const isMusic = edge.node.format === 'MUSIC' || edge.node.type as string === 'MUSIC'
        ```
      - **1.17.1.3.** `[If]` `isMusic`
        - **1.17.1.3.1.** `[Sequence]` Calls `this.handleMusicRelation`
      - **1.17.1.4.** `[Sequence]` Define `rawRelType`
        ```typescript
        const rawRelType = edge.relationType
        ```
      - **1.17.1.5.** `[If]` `!rawRelType`
      - **1.17.1.6.** `[Sequence]` Calls `mapRelationType` and stores result as `relType`
      - **1.17.1.7.** `[If]` `relType === 'UNKNOWN'`
      - **1.17.1.8.** `[Sequence]` Define `targetType`, `targetExternalId`
        ```typescript
        const targetType: MediaType = edge.node.type === 'MANGA' ? 'MANGA' : 'ANIME'
        const targetExternalId = edge.node.id
        ```
      - **1.17.1.9.** `[If]` `!targetExternalId`
      - **1.17.1.10.** `[Sequence]` Define `localTargetId`
        ```typescript
        let localTargetId: number
        ```
      - **1.17.1.11.** `[If]` `targetType === 'ANIME'`
        - **1.17.1.11.1.** `[Sequence]` Database `first` on `Anime` and stores it as `targetAnime`
        - **1.17.1.11.2.** `[If]` `!targetAnime`
          - **1.17.1.11.2.1.** `[Sequence]` Define `targetTitle`
            ```typescript
            const targetTitle = edge.node.title?.english || edge.node.title?.userPreferred || edge.node.title?.romaji || `Anime #${targetExternalId}`
            ```
          - **1.17.1.11.2.2.** `[Sequence]` Assign `targetAnime`
            ```typescript
            targetAnime = await prisma.orm.public.Anime.create({ anilistId: targetExternalId, titlePrimary: targetTitle, titleSecondary: edge.node.title?.romaji || edge.node.title?.english || null, titleNative: edge.node.title?.native || null, coverImage: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large || edge.node.coverImage?.medium || null, format: mapAnimeFormat(edge.node.format), ...
            ```
        - **1.17.1.11.3.** `[Sequence]` Assign `localTargetId`
          ```typescript
          localTargetId = targetAnime.id
          ```
      - **1.17.1.12.** `[Else]` Otherwise
        - **1.17.1.12.1.** `[Sequence]` Database `first` on `Manga` and stores it as `targetManga`
        - **1.17.1.12.2.** `[If]` `!targetManga`
          - **1.17.1.12.2.1.** `[Sequence]` Define `targetTitle`
            ```typescript
            const targetTitle = edge.node.title?.english || edge.node.title?.userPreferred || edge.node.title?.romaji || `Manga #${targetExternalId}`
            ```
          - **1.17.1.12.2.2.** `[Sequence]` Assign `targetManga`
            ```typescript
            targetManga = await prisma.orm.public.Manga.create({ anilistId: targetExternalId, titlePrimary: targetTitle, titleSecondary: edge.node.title?.romaji || edge.node.title?.english || null, titleNative: edge.node.title?.native || null, coverImage: edge.node.coverImage?.extraLarge || edge.node.coverImage?.large || edge.node.coverImage?.medium || null, format: mapMangaFormat(edge.node.format), ...
            ```
        - **1.17.1.12.3.** `[Sequence]` Assign `localTargetId`
          ```typescript
          localTargetId = targetManga.id
          ```
      - **1.17.1.13.** `[Sequence]` Database `first` on `MediaRelation` and stores it as `existingRel`
      - **1.17.1.14.** `[If]` `!existingRel`
        - **1.17.1.14.1.** `[Sequence]` Database `create` on `MediaRelation`
  - **1.18.** `[Return]` 
    ```json
    {
      "synced": true,
      "discoveredRelations": "<discoveredRelations>"
    }
    ```
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]` 
    ```json
    {
      "synced": false,
      "discoveredRelations": []
    }
    ```

#### `syncTv(tvId, externalId)`: `Promise<boolean>` (L1100)
Fully synchronizes a TV entity from TheTVDB.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `tvdbId`
    ```typescript
    let tvdbId: number | null = externalId ? Number(externalId) : null
    ```
  - **1.2.** `[If]` `!tvdbId`
    - **1.2.1.** `[Sequence]` Database `first` on `Tv` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `tvdbId`
      ```typescript
      tvdbId = record?.tvDBId ?? null
      ```
  - **1.3.** `[If]` `!tvdbId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync TV #${tvId}: missing TVDB ID`
    - **1.3.2.** `[Return]`  — `false`
  - **1.4.** `[Sequence]` Calls `tvdbProvider.fetchTvSeries` and stores result as `series`
  - **1.5.** `[If]` `!series`
    - **1.5.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [TVDB Empty]')}: No series data returned for TVDB #${tvdbId}`
    - **1.5.2.** `[Return]`  — `false`
  - **1.6.** `[Sequence]` Define `resolvedEng`, `titlePrimary`, `titleSecondary`, `titleNative`, `description`, `genreNames`
    ```typescript
    const resolvedEng = series.engTranslation
    const titlePrimary = resolvedEng?.name?.trim() || series.name || 'Unknown TV Series'
    const titleSecondary = resolvedEng?.name && resolvedEng.name !== series.name ? series.name : undefined
    const titleNative = series.originalLanguage && ['kor', 'jpn', 'zho', 'zhtw', 'ko', 'ja', 'zh'].includes(series.originalLanguage.toLowerCase()) ? series.name : undefined
    const description = resolvedEng?.overview?.trim() || series.overview || undefined
    const genreNames = series.genres?.map((g) => g.name).filter(Boolean)
    ```
  - **1.7.** `[Sequence]` Calls `this.upsertGenres` and stores result as `genreRecords`
  - **1.8.** `[Sequence]` Calls `this.upsertTags` and stores result as `tagRecords`
  - **1.9.** `[Sequence]` Calls `Promise.all` and stores result as `[episodes, tvCharacters]`
  - **1.10.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **1.11.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.12.** `[Sequence]` Define `firstAiredYear`, `firstAiredMonth`, `firstAiredDay`
    ```typescript
    let firstAiredYear: number | undefined
    let firstAiredMonth: number | undefined
    let firstAiredDay: number | undefined
    ```
  - **1.13.** `[If]` `series.firstAired`
    - **1.13.1.** `[Sequence]` Define `parts`
      ```typescript
      const parts = series.firstAired.split('T')[0]?.split('-').map((s) => parseInt(s, 10)) || []
      ```
    - **1.13.2.** `[If]` `parts[0] && !isNaN(parts[0])`
      - **1.13.2.1.** `[Sequence]` Assign `firstAiredYear`
        ```typescript
        firstAiredYear = parts[0]
        ```
    - **1.13.3.** `[If]` `parts[1] && !isNaN(parts[1])`
      - **1.13.3.1.** `[Sequence]` Assign `firstAiredMonth`
        ```typescript
        firstAiredMonth = parts[1]
        ```
    - **1.13.4.** `[If]` `parts[2] && !isNaN(parts[2])`
      - **1.13.4.1.** `[Sequence]` Assign `firstAiredDay`
        ```typescript
        firstAiredDay = parts[2]
        ```
  - **1.14.** `[Sequence]` Define `lastAiredYear`, `lastAiredMonth`, `lastAiredDay`
    ```typescript
    let lastAiredYear: number | undefined
    let lastAiredMonth: number | undefined
    let lastAiredDay: number | undefined
    ```
  - **1.15.** `[If]` `series.lastAired`
    - **1.15.1.** `[Sequence]` Define `parts`
      ```typescript
      const parts = series.lastAired.split('T')[0]?.split('-').map((s) => parseInt(s, 10)) || []
      ```
    - **1.15.2.** `[If]` `parts[0] && !isNaN(parts[0])`
      - **1.15.2.1.** `[Sequence]` Assign `lastAiredYear`
        ```typescript
        lastAiredYear = parts[0]
        ```
    - **1.15.3.** `[If]` `parts[1] && !isNaN(parts[1])`
      - **1.15.3.1.** `[Sequence]` Assign `lastAiredMonth`
        ```typescript
        lastAiredMonth = parts[1]
        ```
    - **1.15.4.** `[If]` `parts[2] && !isNaN(parts[2])`
      - **1.15.4.1.** `[Sequence]` Assign `lastAiredDay`
        ```typescript
        lastAiredDay = parts[2]
        ```
  - **1.16.** `[Sequence]` Define `imdbId`, `tmdbId`
    ```typescript
    let imdbId: string | undefined
    let tmdbId: number | undefined
    ```
  - **1.17.** `[If]` `series.remoteIds && Array.isArray(series.remoteIds)`
    - **1.17.1.** `[Loop]` Iterate `const r` over `series.remoteIds`
      - **1.17.1.1.** `[If]` `r.sourceName?.toUpperCase() === 'IMDB' || r.type === 2`
        - **1.17.1.1.1.** `[Sequence]` Assign `imdbId`
          ```typescript
          imdbId = r.id
          ```
      - **1.17.1.2.** `[Else]` Otherwise
        - **1.17.1.2.1.** `[If]` `r.sourceName?.toLowerCase().includes('themoviedb') || r.type === 12 || r.type === 10`
          - **1.17.1.2.1.1.** `[Sequence]` Calls `parseInt` and stores result as `p`
          - **1.17.1.2.1.2.** `[If]` `!isNaN(p)`
            - **1.17.1.2.1.2.1.** `[Sequence]` Assign `tmdbId`
              ```typescript
              tmdbId = p
              ```
  - **1.18.** `[Sequence]` Define `ageRating`, `ageRatingGuide`
    ```typescript
    let ageRating: string | undefined
    let ageRatingGuide: string | undefined
    ```
  - **1.19.** `[If]` `series.contentRatings && Array.isArray(series.contentRatings) && series.contentRatings.length > 0`
    - **1.19.1.** `[Sequence]` Define `usaRating`
      ```typescript
      const usaRating = series.contentRatings.find((r) => r.country?.toLowerCase() === 'usa') || series.contentRatings[0]
      ```
    - **1.19.2.** `[If]` `usaRating`
      - **1.19.2.1.** `[Sequence]` Assign `ageRating`
        ```typescript
        ageRating = usaRating.name || usaRating.fullname || undefined
        ```
      - **1.19.2.2.** `[Sequence]` Assign `ageRatingGuide`
        ```typescript
        ageRatingGuide = usaRating.description || undefined
        ```
  - **1.20.** `[Sequence]` Define `seriesImages`
    ```typescript
    const seriesImages: string[] = []
    ```
  - **1.21.** `[If]` `series.image`
    - **1.21.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `norm`
    - **1.21.2.** `[If]` `norm`
  - **1.22.** `[If]` `series.artworks && Array.isArray(series.artworks)`
    - **1.22.1.** `[Loop]` Iterate `const art` over `series.artworks`
      - **1.22.1.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `norm`
      - **1.22.1.2.** `[If]` `norm && !seriesImages.includes(norm)`
  - **1.23.** `[Sequence]` Define `bannerImage`, `backgroundArtworks`
    ```typescript
    let bannerImage: string | undefined
    const backgroundArtworks = series.artworks || [].filter((a) => a.type === 3 || (a.image && a.image.includes('/backgrounds/')))
    ```
  - **1.24.** `[If]` `backgroundArtworks.length > 0`
    - **1.24.1.** `[Sequence]` Assign `bannerImage`
      ```typescript
      bannerImage = normalizeTvdbImageUrl(backgroundArtworks[0]?.image) || undefined
      ```
  - **1.25.** `[Else]` Otherwise
    - **1.25.1.** `[If]` `seriesImages.length > 1`
      - **1.25.1.1.** `[Sequence]` Assign `bannerImage`
        ```typescript
        bannerImage = seriesImages[1]
        ```
  - **1.26.** `[Sequence]` Define `synonymsSet`
    ```typescript
    const synonymsSet = new Set<string>()
    ```
  - **1.27.** `[If]` `Array.isArray(series.aliases)`
    - **1.27.1.** `[Loop]` Iterate `const a` over `series.aliases as any[]`
      - **1.27.1.1.** `[If]` `typeofa === 'string' && a.trim()`
        - **1.27.1.1.1.** `[Sequence]` Calls `synonymsSet.add`
      - **1.27.1.2.** `[Else]` Otherwise
        - **1.27.1.2.1.** `[If]` `a && typeofa.name === 'string' && a.name.trim()`
          - **1.27.1.2.1.1.** `[Sequence]` Calls `synonymsSet.add`
  - **1.28.** `[If]` `titleSecondary && titleSecondary !== titlePrimary`
    - **1.28.1.** `[Sequence]` Calls `synonymsSet.add`
  - **1.29.** `[If]` `titleNative && titleNative !== titlePrimary`
    - **1.29.1.** `[Sequence]` Calls `synonymsSet.add`
  - **1.30.** `[Sequence]` Calls `synonymsSet.delete`
  - **1.31.** `[Sequence]` Calls `Array.from` and stores result as `synonyms`
  - **1.32.** `[Sequence]` Define `sources`
    ```typescript
    const sources: Record<string, unknown> = { thetvdb: { id: series.id, slug: series.slug, url: series.slug ? `https://thetvdb.com/series/${series.slug}` : `https://thetvdb.com/dereferrer/series/${series.id}`, ...
    ```
  - **1.33.** `[If]` `imdbId`
    - **1.33.1.** `[Sequence]` Assign `sources.imdb`
      ```typescript
      sources.imdb = { id: imdbId, url: `https://www.imdb.com/title/${imdbId}` }
      ```
  - **1.34.** `[If]` `tmdbId`
    - **1.34.1.** `[Sequence]` Assign `sources.tmdb`
      ```typescript
      sources.tmdb = { id: tmdbId, url: `https://www.themoviedb.org/tv/${tmdbId}` }
      ```
  - **1.35.** `[Sequence]` Define `broadcastDays`
    ```typescript
    const broadcastDays: string[] = []
    ```
  - **1.36.** `[If]` `series.airsDays`
    - **1.36.1.** `[Loop]` Iterate `const [day, active]` over `Object.entries(series.airsDays)`
      - **1.36.1.1.** `[If]` `active`
  - **1.37.** `[Sequence]` Define `countryOfOrigin`, `validEpisodes`, `seasonNumbers`
    ```typescript
    const countryOfOrigin = series.production_countries?.[0]?.name || series.originalLanguage ? series.originalLanguage.toUpperCase() : undefined
    const validEpisodes = episodes.filter((e) => e.seasonNumber > 0)
    const seasonNumbers = new Set<number>()
    ```
  - **1.38.** `[If]` `series.seasons && Array.isArray(series.seasons)`
    - **1.38.1.** `[Loop]` Iterate `const s` over `series.seasons`
      - **1.38.1.1.** `[If]` `s.number > 0`
        - **1.38.1.1.1.** `[Sequence]` Calls `seasonNumbers.add`
  - **1.39.** `[Loop]` Iterate `const ep` over `validEpisodes`
    - **1.39.1.** `[Sequence]` Calls `seasonNumbers.add`
  - **1.40.** `[Sequence]` Database `update` on `Tv`
  - **1.41.** `[If]` `genreRecords.length > 0`
    - **1.41.1.** `[Try]` Try block
      - **1.41.1.1.** `[Sequence]` Database `deleteAll` on `TvGenre`
    - **1.41.2.** `[Catch]` Catch (`err`)
    - **1.41.3.** `[Loop]` Iterate `const g` over `genreRecords`
      - **1.41.3.1.** `[Sequence]` Database `create` on `TvGenre`
  - **1.42.** `[If]` `tagRecords.length > 0`
    - **1.42.1.** `[Try]` Try block
      - **1.42.1.1.** `[Sequence]` Database `deleteAll` on `TvTag`
    - **1.42.2.** `[Catch]` Catch (`err`)
    - **1.42.3.** `[Loop]` Iterate `const t` over `tagRecords`
      - **1.42.3.1.** `[Sequence]` Database `create` on `TvTag`
  - **1.43.** `[Sequence]` Define `seasonMap`
    ```typescript
    const seasonMap = new Map<number, number>()
    ```
  - **1.44.** `[Loop]` Iterate `const sNum` over `seasonNumbers`
    - **1.44.1.** `[Sequence]` Define `seasonMeta`, `seasonEpisodes`, `airDateYear`, `airDateMonth`, `airDateDay`, `firstEp`
      ```typescript
      const seasonMeta = series.seasons?.find((s) => s.number === sNum)
      const seasonEpisodes = validEpisodes.filter((e) => e.seasonNumber === sNum)
      let airDateYear: number | undefined
      let airDateMonth: number | undefined
      let airDateDay: number | undefined
      const firstEp = seasonEpisodes[0]
      ```
    - **1.44.2.** `[If]` `firstEp?.aired`
      - **1.44.2.1.** `[Sequence]` Define `parts`
        ```typescript
        const parts = firstEp.aired.split('-').map((s) => parseInt(s, 10))
        ```
      - **1.44.2.2.** `[If]` `parts[0]`
        - **1.44.2.2.1.** `[Sequence]` Assign `airDateYear`
          ```typescript
          airDateYear = parts[0]
          ```
      - **1.44.2.3.** `[If]` `parts[1]`
        - **1.44.2.3.1.** `[Sequence]` Assign `airDateMonth`
          ```typescript
          airDateMonth = parts[1]
          ```
      - **1.44.2.4.** `[If]` `parts[2]`
        - **1.44.2.4.1.** `[Sequence]` Assign `airDateDay`
          ```typescript
          airDateDay = parts[2]
          ```
    - **1.44.3.** `[Else]` Otherwise
      - **1.44.3.1.** `[If]` `seasonMeta?.year`
        - **1.44.3.1.1.** `[Sequence]` Assign `airDateYear`
          ```typescript
          airDateYear = parseInt(seasonMeta.year, 10) || undefined
          ```
    - **1.44.4.** `[Sequence]` Define `seasonPoster`
      ```typescript
      const seasonPoster = seasonMeta?.image ? normalizeTvdbImageUrl(seasonMeta.image) : undefined
      ```
    - **1.44.5.** `[Sequence]` Database `first` on `TvSeason` and stores it as `localSeason`
    - **1.44.6.** `[If]` `localSeason`
      - **1.44.6.1.** `[Sequence]` Database `update` on `TvSeason`
    - **1.44.7.** `[Else]` Otherwise
      - **1.44.7.1.** `[Sequence]` Assign `localSeason`
        ```typescript
        localSeason = await prisma.orm.public.TvSeason.create({ tvId, seasonNumber: sNum, tvdbSeasonId: seasonMeta?.id || null, titlePrimary: seasonMeta?.name || `Season ${sNum}`, posterImage: seasonPoster || null, airDateYear: airDateYear || null, ...
        ```
    - **1.44.8.** `[If]` `localSeason`
      - **1.44.8.1.** `[Sequence]` Calls `seasonMap.set`
  - **1.45.** `[Loop]` Iterate `const ep` over `validEpisodes`
    - **1.45.1.** `[Sequence]` Define `localSeasonId`, `epAirDate`
      ```typescript
      const localSeasonId = seasonMap.get(ep.seasonNumber) || null
      let epAirDate: Date | undefined
      ```
    - **1.45.2.** `[If]` `ep.aired`
      - **1.45.2.1.** `[Sequence]` Define `parsed`
        ```typescript
        const parsed = new Date(ep.aired)
        ```
      - **1.45.2.2.** `[If]` `!isNaN(parsed.getTime())`
        - **1.45.2.2.1.** `[Sequence]` Assign `epAirDate`
          ```typescript
          epAirDate = parsed
          ```
    - **1.45.3.** `[Sequence]` Database `first` on `TvEpisode` and stores it as `existingEp`
    - **1.45.4.** `[Sequence]` Define `epTitle`, `epThumb`
      ```typescript
      const epTitle = ep.name || `Episode ${ep.number}`
      const epThumb = ep.image ? normalizeTvdbImageUrl(ep.image) : undefined
      ```
    - **1.45.5.** `[If]` `existingEp`
      - **1.45.5.1.** `[Sequence]` Database `update` on `TvEpisode`
    - **1.45.6.** `[Else]` Otherwise
      - **1.45.6.1.** `[Sequence]` Database `create` on `TvEpisode`
  - **1.46.** `[Sequence]` Define `allCompanies`
    ```typescript
    const allCompanies = [ ...(series.companies?.studio || []), ...(series.companies?.network || []), ...(series.companies?.production || []), ...(series.companies?.distributor || []), ]
    ```
  - **1.47.** `[Loop]` Iterate `const comp` over `allCompanies`
    - **1.47.1.** `[If]` `!comp.name?.trim()`
    - **1.47.2.** `[Sequence]` Calls `this.upsertStudio` and stores result as `studio`
    - **1.47.3.** `[Sequence]` Calls `this.linkMediaStudio`
  - **1.48.** `[Sequence]` Define `allCastAndStaff`
    ```typescript
    const allCastAndStaff = [ ...(tvCharacters || []), ...(series.characters || []), ]
    ```
  - **1.49.** `[If]` `allCastAndStaff.length > 0`
    - **1.49.1.** `[Sequence]` Calls `this.syncTvdbCharactersAndStaff`
  - **1.50.** `[Return]`  — `true`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]`  — `false`

#### `syncMovie(movieId, externalId)`: `Promise<boolean>` (L1476)
Fully synchronizes a Movie entity from TheTVDB.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `tvdbId`
    ```typescript
    let tvdbId: number | null = externalId ? Number(externalId) : null
    ```
  - **1.2.** `[If]` `!tvdbId`
    - **1.2.1.** `[Sequence]` Database `first` on `Movie` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `tvdbId`
      ```typescript
      tvdbId = record?.tvDBId ?? null
      ```
  - **1.3.** `[If]` `!tvdbId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync Movie #${movieId}: missing TVDB ID`
    - **1.3.2.** `[Return]`  — `false`
  - **1.4.** `[Sequence]` Calls `tvdbProvider.fetchMovie` and stores result as `movie`
  - **1.5.** `[If]` `!movie`
    - **1.5.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [TVDB Empty]')}: No movie data returned for TVDB #${tvdbId}`
    - **1.5.2.** `[Return]`  — `false`
  - **1.6.** `[Sequence]` Define `displayTitle`, `genreNames`
    ```typescript
    const displayTitle = movie.engTranslation?.name?.trim() || movie.name || 'Unknown Movie'
    const genreNames = movie.genres?.map((g) => g.name).filter(Boolean)
    ```
  - **1.7.** `[Sequence]` Calls `this.upsertGenres` and stores result as `genreRecords`
  - **1.8.** `[Sequence]` Calls `this.upsertTags` and stores result as `tagRecords`
  - **1.9.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **1.10.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.11.** `[Sequence]` Define `imdbId`, `tmdbId`
    ```typescript
    let imdbId: string | undefined
    let tmdbId: number | undefined
    ```
  - **1.12.** `[If]` `movie.remoteIds && Array.isArray(movie.remoteIds)`
    - **1.12.1.** `[Loop]` Iterate `const r` over `movie.remoteIds`
      - **1.12.1.1.** `[If]` `r.sourceName?.toUpperCase() === 'IMDB' || r.type === 2`
        - **1.12.1.1.1.** `[Sequence]` Assign `imdbId`
          ```typescript
          imdbId = r.id
          ```
      - **1.12.1.2.** `[Else]` Otherwise
        - **1.12.1.2.1.** `[If]` `r.sourceName?.toLowerCase().includes('themoviedb') || r.type === 10`
          - **1.12.1.2.1.1.** `[Sequence]` Calls `parseInt` and stores result as `p`
          - **1.12.1.2.1.2.** `[If]` `!isNaN(p)`
            - **1.12.1.2.1.2.1.** `[Sequence]` Assign `tmdbId`
              ```typescript
              tmdbId = p
              ```
  - **1.13.** `[Sequence]` Define `releaseDateYear`, `releaseDateMonth`, `releaseDateDay`, `rawReleaseDate`
    ```typescript
    let releaseDateYear: number | undefined
    let releaseDateMonth: number | undefined
    let releaseDateDay: number | undefined
    const rawReleaseDate = movie.first_release_date || movie.first_release?.date || movie.releases && movie.releases.length > 0 ? movie.releases[0]?.date : undefined
    ```
  - **1.14.** `[If]` `rawReleaseDate`
    - **1.14.1.** `[Sequence]` Define `parts`
      ```typescript
      const parts = rawReleaseDate.split('-').map((s) => parseInt(s, 10))
      ```
    - **1.14.2.** `[If]` `parts[0] && !isNaN(parts[0])`
      - **1.14.2.1.** `[Sequence]` Assign `releaseDateYear`
        ```typescript
        releaseDateYear = parts[0]
        ```
    - **1.14.3.** `[If]` `parts[1] && !isNaN(parts[1])`
      - **1.14.3.1.** `[Sequence]` Assign `releaseDateMonth`
        ```typescript
        releaseDateMonth = parts[1]
        ```
    - **1.14.4.** `[If]` `parts[2] && !isNaN(parts[2])`
      - **1.14.4.1.** `[Sequence]` Assign `releaseDateDay`
        ```typescript
        releaseDateDay = parts[2]
        ```
  - **1.15.** `[Sequence]` Define `budget`
    ```typescript
    let budget: bigint | undefined
    ```
  - **1.16.** `[If]` `movie.budget`
    - **1.16.1.** `[Sequence]` Calls `BigInt` and stores result as `num`
    - **1.16.2.** `[If]` `num > 0n`
      - **1.16.2.1.** `[Sequence]` Assign `budget`
        ```typescript
        budget = num
        ```
  - **1.17.** `[Sequence]` Define `revenue`
    ```typescript
    let revenue: bigint | undefined
    ```
  - **1.18.** `[If]` `movie.boxOffice`
    - **1.18.1.** `[Sequence]` Calls `BigInt` and stores result as `num`
    - **1.18.2.** `[If]` `num > 0n`
      - **1.18.2.1.** `[Sequence]` Assign `revenue`
        ```typescript
        revenue = num
        ```
  - **1.19.** `[Sequence]` Define `ageRating`, `ageRatingGuide`
    ```typescript
    let ageRating: string | undefined
    let ageRatingGuide: string | undefined
    ```
  - **1.20.** `[If]` `movie.contentRatings && Array.isArray(movie.contentRatings) && movie.contentRatings.length > 0`
    - **1.20.1.** `[Sequence]` Define `usaRating`
      ```typescript
      const usaRating = movie.contentRatings.find((r) => r.country?.toLowerCase() === 'usa') || movie.contentRatings[0]
      ```
    - **1.20.2.** `[If]` `usaRating`
      - **1.20.2.1.** `[Sequence]` Assign `ageRating`
        ```typescript
        ageRating = usaRating.name || usaRating.fullname || undefined
        ```
      - **1.20.2.2.** `[Sequence]` Assign `ageRatingGuide`
        ```typescript
        ageRatingGuide = usaRating.description || undefined
        ```
  - **1.21.** `[Sequence]` Define `movieImages`
    ```typescript
    const movieImages: string[] = []
    ```
  - **1.22.** `[If]` `movie.image`
    - **1.22.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `norm`
    - **1.22.2.** `[If]` `norm`
  - **1.23.** `[If]` `movie.artworks && Array.isArray(movie.artworks)`
    - **1.23.1.** `[Loop]` Iterate `const art` over `movie.artworks`
      - **1.23.1.1.** `[Sequence]` Calls `normalizeTvdbImageUrl` and stores result as `norm`
      - **1.23.1.2.** `[If]` `norm && !movieImages.includes(norm)`
  - **1.24.** `[Sequence]` Define `bannerImage`, `backgroundArtworks`
    ```typescript
    let bannerImage: string | undefined
    const backgroundArtworks = movie.artworks || [].filter((a) => a.type === 3 || (a.image && a.image.includes('/backgrounds/')))
    ```
  - **1.25.** `[If]` `backgroundArtworks.length > 0`
    - **1.25.1.** `[Sequence]` Assign `bannerImage`
      ```typescript
      bannerImage = normalizeTvdbImageUrl(backgroundArtworks[0]?.image) || undefined
      ```
  - **1.26.** `[Else]` Otherwise
    - **1.26.1.** `[If]` `movieImages.length > 1`
      - **1.26.1.1.** `[Sequence]` Assign `bannerImage`
        ```typescript
        bannerImage = movieImages[1]
        ```
  - **1.27.** `[Sequence]` Define `resolvedEng`, `titlePrimary`, `titleSecondary`, `titleNative`, `description`, `synonymsSet`
    ```typescript
    const resolvedEng = movie.engTranslation
    const titlePrimary = resolvedEng?.name?.trim() || movie.name || 'Unknown Movie'
    const titleSecondary = resolvedEng?.name && resolvedEng.name !== movie.name ? movie.name : undefined
    const titleNative = movie.originalLanguage && ['kor', 'jpn', 'zho', 'zhtw', 'ko', 'ja', 'zh'].includes(movie.originalLanguage.toLowerCase()) ? movie.name : undefined
    const description = resolvedEng?.overview?.trim() || movie.overview || undefined
    const synonymsSet = new Set<string>()
    ```
  - **1.28.** `[If]` `Array.isArray(movie.aliases)`
    - **1.28.1.** `[Loop]` Iterate `const a` over `movie.aliases as any[]`
      - **1.28.1.1.** `[If]` `typeofa === 'string' && a.trim()`
        - **1.28.1.1.1.** `[Sequence]` Calls `synonymsSet.add`
      - **1.28.1.2.** `[Else]` Otherwise
        - **1.28.1.2.1.** `[If]` `a && typeofa.name === 'string' && a.name.trim()`
          - **1.28.1.2.1.1.** `[Sequence]` Calls `synonymsSet.add`
  - **1.29.** `[If]` `titleSecondary && titleSecondary !== titlePrimary`
    - **1.29.1.** `[Sequence]` Calls `synonymsSet.add`
  - **1.30.** `[If]` `titleNative && titleNative !== titlePrimary`
    - **1.30.1.** `[Sequence]` Calls `synonymsSet.add`
  - **1.31.** `[Sequence]` Calls `synonymsSet.delete`
  - **1.32.** `[Sequence]` Calls `Array.from` and stores result as `synonyms`
  - **1.33.** `[Sequence]` Define `sources`
    ```typescript
    const sources: Record<string, unknown> = { thetvdb: { id: movie.id, slug: movie.slug, url: movie.slug ? `https://thetvdb.com/movies/${movie.slug}` : `https://thetvdb.com/dereferrer/movie/${movie.id}`, ...
    ```
  - **1.34.** `[If]` `imdbId`
    - **1.34.1.** `[Sequence]` Assign `sources.imdb`
      ```typescript
      sources.imdb = { id: imdbId, url: `https://www.imdb.com/title/${imdbId}` }
      ```
  - **1.35.** `[If]` `tmdbId`
    - **1.35.1.** `[Sequence]` Assign `sources.tmdb`
      ```typescript
      sources.tmdb = { id: tmdbId, url: `https://www.themoviedb.org/movie/${tmdbId}` }
      ```
  - **1.36.** `[Sequence]` Define `countryOfOrigin`
    ```typescript
    const countryOfOrigin = movie.production_countries?.[0]?.name || movie.originalLanguage ? movie.originalLanguage.toUpperCase() : undefined
    ```
  - **1.37.** `[Sequence]` Database `update` on `Movie`
  - **1.38.** `[If]` `genreRecords.length > 0`
    - **1.38.1.** `[Try]` Try block
      - **1.38.1.1.** `[Sequence]` Database `deleteAll` on `MovieGenre`
    - **1.38.2.** `[Catch]` Catch (`err`)
    - **1.38.3.** `[Loop]` Iterate `const g` over `genreRecords`
      - **1.38.3.1.** `[Sequence]` Database `create` on `MovieGenre`
  - **1.39.** `[If]` `tagRecords.length > 0`
    - **1.39.1.** `[Try]` Try block
      - **1.39.1.1.** `[Sequence]` Database `deleteAll` on `MovieTag`
    - **1.39.2.** `[Catch]` Catch (`err`)
    - **1.39.3.** `[Loop]` Iterate `const t` over `tagRecords`
      - **1.39.3.1.** `[Sequence]` Database `create` on `MovieTag`
  - **1.40.** `[Sequence]` Define `allCompanies`
    ```typescript
    const allCompanies = [ ...(movie.companies?.studio || []), ...(movie.companies?.production || []), ...(movie.companies?.distributor || []), ]
    ```
  - **1.41.** `[Loop]` Iterate `const comp` over `allCompanies`
    - **1.41.1.** `[If]` `!comp.name?.trim()`
    - **1.41.2.** `[Sequence]` Calls `this.upsertStudio` and stores result as `studio`
    - **1.41.3.** `[Sequence]` Calls `this.linkMediaStudio`
  - **1.42.** `[If]` `movie.characters && Array.isArray(movie.characters)`
    - **1.42.1.** `[Sequence]` Calls `this.syncTvdbCharactersAndStaff`
  - **1.43.** `[Return]`  — `true`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]`  — `false`

#### `syncGame(gameId, externalId)`: `Promise<boolean>` (L1725)
Fully synchronizes a Game entity from IGDB.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `igdbId`
    ```typescript
    let igdbId: number | null = externalId ? Number(externalId) : null
    ```
  - **1.2.** `[If]` `!igdbId`
    - **1.2.1.** `[Sequence]` Database `first` on `Game` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `igdbId`
      ```typescript
      igdbId = record?.igdbId ?? null
      ```
  - **1.3.** `[If]` `!igdbId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync Game #${gameId}: missing IGDB ID`
    - **1.3.2.** `[Return]`  — `false`
  - **1.4.** `[Sequence]` Calls `igdbProvider.fetchGame` and stores result as `game`
  - **1.5.** `[If]` `!game`
    - **1.5.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [IGDB Empty]')}: No game data returned for IGDB #${igdbId}`
    - **1.5.2.** `[Return]`  — `false`
  - **1.6.** `[Sequence]` Define `displayTitle`, `genreNames`
    ```typescript
    const displayTitle = game.name || 'Unknown Game'
    const genreNames = game.genres?.map((g) => g.name).filter(Boolean)
    ```
  - **1.7.** `[Sequence]` Calls `this.upsertGenres` and stores result as `genreRecords`
  - **1.8.** `[Sequence]` Define `rawTags`
    ```typescript
    const rawTags: Array<{ name: string; category?: string }> = []
    ```
  - **1.9.** `[If]` `game.themes && Array.isArray(game.themes)`
    - **1.9.1.** `[Loop]` Iterate `const th` over `game.themes`
      - **1.9.1.1.** `[If]` `th.name`
  - **1.10.** `[If]` `game.game_modes && Array.isArray(game.game_modes)`
    - **1.10.1.** `[Loop]` Iterate `const gm` over `game.game_modes`
      - **1.10.1.1.** `[If]` `gm.name`
  - **1.11.** `[Sequence]` Calls `this.upsertTags` and stores result as `tagRecords`
  - **1.12.** `[Sequence]` Define `platforms`, `now`
    ```typescript
    const platforms = game.platforms?.map((p) => p.name).filter(Boolean) || []
    const now = new Date()
    ```
  - **1.13.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.14.** `[Sequence]` Define `releaseDateMonth`, `releaseDateDay`
    ```typescript
    let releaseDateMonth: number | undefined
    let releaseDateDay: number | undefined
    ```
  - **1.15.** `[If]` `game.first_release_date`
    - **1.15.1.** `[Sequence]` Define `d`
      ```typescript
      const d = new Date(game.first_release_date * 1000)
      ```
    - **1.15.2.** `[Sequence]` Assign `releaseDateMonth`
      ```typescript
      releaseDateMonth = d.getUTCMonth() + 1
      ```
    - **1.15.3.** `[Sequence]` Assign `releaseDateDay`
      ```typescript
      releaseDateDay = d.getUTCDate()
      ```
  - **1.16.** `[Sequence]` Define `gameImages`
    ```typescript
    const gameImages: string[] = []
    ```
  - **1.17.** `[If]` `game.screenshots && Array.isArray(game.screenshots)`
    - **1.17.1.** `[Loop]` Iterate `const sc` over `game.screenshots`
      - **1.17.1.1.** `[If]` `sc.image_id`
  - **1.18.** `[If]` `game.artworks && Array.isArray(game.artworks)`
    - **1.18.1.** `[Loop]` Iterate `const art` over `game.artworks`
      - **1.18.1.1.** `[If]` `art.image_id`
  - **1.19.** `[Sequence]` Define `bannerImage`, `synonyms`, `sources`
    ```typescript
    const bannerImage = gameImages[0] || undefined
    const synonyms = game.alternative_names || [].map((a) => a.name).filter(Boolean)
    const sources: Record<string, unknown> = { igdb: { id: game.id, url: game.slug ? `https://www.igdb.com/games/${game.slug}` : `https://www.igdb.com/games/${game.id}`, }, }
    ```
  - **1.20.** `[If]` `game.websites && Array.isArray(game.websites)`
    - **1.20.1.** `[Loop]` Iterate `const ws` over `game.websites`
      - **1.20.1.1.** `[If]` `ws.url`
        - **1.20.1.1.1.** `[Sequence]` Assign `sources[`website_${ws.category}`]`
          ```typescript
          sources[`website_${ws.category}`] = { url: ws.url }
          ```
  - **1.21.** `[Sequence]` Database `update` on `Game`
  - **1.22.** `[If]` `genreRecords.length > 0`
    - **1.22.1.** `[Try]` Try block
      - **1.22.1.1.** `[Sequence]` Database `deleteAll` on `GameGenre`
    - **1.22.2.** `[Catch]` Catch (`err`)
    - **1.22.3.** `[Loop]` Iterate `const g` over `genreRecords`
      - **1.22.3.1.** `[Sequence]` Database `create` on `GameGenre`
  - **1.23.** `[If]` `tagRecords.length > 0`
    - **1.23.1.** `[Try]` Try block
      - **1.23.1.1.** `[Sequence]` Database `deleteAll` on `GameTag`
    - **1.23.2.** `[Catch]` Catch (`err`)
    - **1.23.3.** `[Loop]` Iterate `const t` over `tagRecords`
      - **1.23.3.1.** `[Sequence]` Database `create` on `GameTag`
  - **1.24.** `[If]` `game.involved_companies && Array.isArray(game.involved_companies)`
    - **1.24.1.** `[Loop]` Iterate `const ic` over `game.involved_companies`
      - **1.24.1.1.** `[If]` `!ic.company?.name?.trim()`
      - **1.24.1.2.** `[Try]` Try block
        - **1.24.1.2.1.** `[Sequence]` Calls `this.upsertStudio` and stores result as `studio`
        - **1.24.1.2.2.** `[Sequence]` Calls `this.linkMediaStudio`
      - **1.24.1.3.** `[Catch]` Catch (`err`)
  - **1.25.** `[Return]`  — `true`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]`  — `false`

#### `syncBook(bookId, externalId)`: `Promise<boolean>` (L1876)
Fully synchronizes a Book entity from Google Books.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `volumeId`
    ```typescript
    let volumeId: string | null = externalId ? String(externalId) : null
    ```
  - **1.2.** `[If]` `!volumeId`
    - **1.2.1.** `[Sequence]` Database `first` on `Book` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `volumeId`
      ```typescript
      volumeId = record?.googleBookId ?? null
      ```
  - **1.3.** `[If]` `!volumeId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync Book #${bookId}: missing Google Books ID`
    - **1.3.2.** `[Return]`  — `false`
  - **1.4.** `[Sequence]` Calls `googleBooksProvider.fetchBook` and stores result as `book`
  - **1.5.** `[If]` `!book`
    - **1.5.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Google Books Empty]')}: No book data returned for Google Books ID "${volumeId}"`
    - **1.5.2.** `[Return]`  — `false`
  - **1.6.** `[Sequence]` Define `info`, `displayTitle`, `genreNames`
    ```typescript
    const info = book.volumeInfo || {}
    const displayTitle = info.title || 'Unknown Book'
    const genreNames = info.categories?.filter(Boolean)
    ```
  - **1.7.** `[Sequence]` Calls `this.upsertGenres` and stores result as `genreRecords`
  - **1.8.** `[Sequence]` Calls `this.upsertTags` and stores result as `tagRecords`
  - **1.9.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **1.10.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.11.** `[Sequence]` Define `releaseDateYear`, `releaseDateMonth`, `releaseDateDay`
    ```typescript
    let releaseDateYear: number | undefined
    let releaseDateMonth: number | undefined
    let releaseDateDay: number | undefined
    ```
  - **1.12.** `[If]` `info.publishedDate`
    - **1.12.1.** `[Sequence]` Define `parts`
      ```typescript
      const parts = info.publishedDate.split('-').map((s) => parseInt(s, 10))
      ```
    - **1.12.2.** `[If]` `parts[0] && !isNaN(parts[0])`
      - **1.12.2.1.** `[Sequence]` Assign `releaseDateYear`
        ```typescript
        releaseDateYear = parts[0]
        ```
    - **1.12.3.** `[If]` `parts[1] && !isNaN(parts[1])`
      - **1.12.3.1.** `[Sequence]` Assign `releaseDateMonth`
        ```typescript
        releaseDateMonth = parts[1]
        ```
    - **1.12.4.** `[If]` `parts[2] && !isNaN(parts[2])`
      - **1.12.4.1.** `[Sequence]` Assign `releaseDateDay`
        ```typescript
        releaseDateDay = parts[2]
        ```
  - **1.13.** `[Sequence]` Define `cleanDescription`, `imageLinks`, `coverImage`
    ```typescript
    const cleanDescription = info.description ? info.description.replace(/<[^>]*>/g, '').trim() : undefined
    const imageLinks = info as any.imageLinks
    let coverImage = imageLinks?.extraLarge || imageLinks?.large || imageLinks?.medium || imageLinks?.thumbnail || undefined
    ```
  - **1.14.** `[If]` `coverImage && coverImage.startsWith('http://')`
    - **1.14.1.** `[Sequence]` Assign `coverImage`
      ```typescript
      coverImage = coverImage.replace('http://', 'https://')
      ```
  - **1.15.** `[Sequence]` Define `sources`, `industryIdentifiers`
    ```typescript
    const sources: Record<string, unknown> = { googleBooks: { id: volumeId, url: `https://books.google.com/books?id=${volumeId}` }, }
    const industryIdentifiers = info as any.industryIdentifiers
    ```
  - **1.16.** `[If]` `industryIdentifiers && Array.isArray(industryIdentifiers)`
    - **1.16.1.** `[Loop]` Iterate `const idObj` over `industryIdentifiers`
      - **1.16.1.1.** `[If]` `idObj?.identifier`
        - **1.16.1.1.1.** `[Sequence]` Assign `sources[idObj.type || 'identifier']`
          ```typescript
          sources[idObj.type || 'identifier'] = idObj.identifier
          ```
  - **1.17.** `[Sequence]` Database `update` on `Book`
  - **1.18.** `[If]` `genreRecords.length > 0`
    - **1.18.1.** `[Try]` Try block
      - **1.18.1.1.** `[Sequence]` Database `deleteAll` on `BookGenre`
    - **1.18.2.** `[Catch]` Catch (`err`)
    - **1.18.3.** `[Loop]` Iterate `const g` over `genreRecords`
      - **1.18.3.1.** `[Sequence]` Database `create` on `BookGenre`
  - **1.19.** `[If]` `tagRecords.length > 0`
    - **1.19.1.** `[Try]` Try block
      - **1.19.1.1.** `[Sequence]` Database `deleteAll` on `BookTag`
    - **1.19.2.** `[Catch]` Catch (`err`)
    - **1.19.3.** `[Loop]` Iterate `const t` over `tagRecords`
      - **1.19.3.1.** `[Sequence]` Database `create` on `BookTag`
  - **1.20.** `[Return]`  — `true`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]`  — `false`

#### `syncMusic(musicId, externalId)`: `Promise<boolean>` (L1996)
Fully synchronizes a Music entity from Deezer.

- **1.** `[Try]` Try block
  - **1.1.** `[Sequence]` Define `deezerId`
    ```typescript
    let deezerId: string | null = externalId ? String(externalId) : null
    ```
  - **1.2.** `[If]` `!deezerId`
    - **1.2.1.** `[Sequence]` Database `first` on `Music` and stores it as `record`
    - **1.2.2.** `[Sequence]` Assign `deezerId`
      ```typescript
      deezerId = record?.deezerId ?? null
      ```
  - **1.3.** `[If]` `!deezerId`
    - **1.3.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Missing ID]')}: Cannot sync Music #${musicId}: missing Deezer ID`
    - **1.3.2.** `[Return]`  — `false`
  - **1.4.** `[Sequence]` Calls `deezerProvider.getTrack` and stores result as `track`
  - **1.5.** `[Sequence]` Define `now`
    ```typescript
    const now = new Date()
    ```
  - **1.6.** `[Sequence]` Calls `Math.floor` and stores result as `nowUnix`
  - **1.7.** `[If]` `track`
    - **1.7.1.** `[Sequence]` Database `update` on `Music`
    - **1.7.2.** `[Return]`  — `true`
  - **1.8.** `[Sequence]` Calls `deezerProvider.getAlbum` and stores result as `album`
  - **1.9.** `[If]` `album`
    - **1.9.1.** `[Sequence]` Database `update` on `Music`
    - **1.9.2.** `[Return]`  — `true`
  - **1.10.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Deezer Empty]')}: No track or album data returned for Deezer ID "${deezerId}"`
  - **1.11.** `[Return]`  — `false`
- **2.** `[Catch]` Catch (`err`)
  - **2.1.** `[Sequence]` Calls `logger.error`
  - **2.2.** `[Return]`  — `false`

#### `syncEntity(mediaType, mediaId, externalId)`: `Promise<EntitySyncResult>` (L2069)
Routes entity sync based on media type and returns EntitySyncResult.

- **1.** `[Sequence]` Define `norm`
  ```typescript
  const norm = mediaType.toUpperCase()
  ```
- **2.** `[Switch]` Branch on `norm`
  - **2.1.** `[Case]` Case `'ANIME'`
    - **2.1.1.** `[Return]`  — `await this.syncAnime(mediaId, externalId)`
  - **2.2.** `[Case]` Case `'MANGA'`
    - **2.2.1.** `[Return]`  — `await this.syncManga(mediaId, externalId)`
  - **2.3.** `[Case]` Case `'TV'`
  - **2.4.** `[Case]` Case `'MOVIE'`
  - **2.5.** `[Case]` Case `'GAME'`
  - **2.6.** `[Case]` Case `'BOOK'`
  - **2.7.** `[Case]` Case `'MUSIC'`
  - **2.8.** `[Case]` Default
    - **2.8.1.** `[Warning]` Logs warning — `${c.yellow('⚠️ [Unknown Type]')}: Unsupported media type for sync: ${mediaType}`
    - **2.8.2.** `[Return]` 
      ```json
      {
        "synced": false,
        "discoveredRelations": []
      }
      ```

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [apps/borealis/providers/index.ts](../providers/index.md) ([[apps/borealis/providers/index]]) — `anilistProvider`, `AniListAnimePayload`, `AniListMangaPayload`, `tvdbProvider`, `normalizeTvdbImageUrl`, `TvdbCharacter`, `TvdbEpisode`, `igdbProvider`, `googleBooksProvider`, `deezerProvider`, `animeMappingProvider`
- [apps/borealis/_shared/base-syncer.ts](../_shared/base-syncer.md) ([[apps/borealis/_shared/base-syncer]]) — `BaseMediaSyncer`
- [apps/borealis/sync/media-preview.syncer.ts](./media-preview.syncer.md) ([[apps/borealis/sync/media-preview.syncer]]) — `MediaPreviewSyncer`, `mapAnimeFormat`, `mapMangaFormat`, `mapMovieStatus`, `mapTvStatus`, `PreviewResult`
- [apps/borealis/sync/media.queue.ts](./media.queue.md) ([[apps/borealis/sync/media.queue]]) — `MediaQueueManager`, `MediaType`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`, `normalizeMediaStatus`, `RelationType`
- `@NamelessLiberty/logger` — `LogFactory`, `c`

### Called By / Imported By
- [apps/borealis/anime/anime.serv.ts](../anime/anime.serv.md) ([[apps/borealis/anime/anime.serv]]) — `MediaEntitySyncer`
- [apps/borealis/books/books.serv.ts](../books/books.serv.md) ([[apps/borealis/books/books.serv]]) — `MediaEntitySyncer`
- [apps/borealis/games/games.serv.ts](../games/games.serv.md) ([[apps/borealis/games/games.serv]]) — `MediaEntitySyncer`
- [apps/borealis/manga/manga.serv.ts](../manga/manga.serv.md) ([[apps/borealis/manga/manga.serv]]) — `MediaEntitySyncer`
- [apps/borealis/movies/movies.serv.ts](../movies/movies.serv.md) ([[apps/borealis/movies/movies.serv]]) — `MediaEntitySyncer`
- [apps/borealis/sync/media.wrk.ts](./media.wrk.md) ([[apps/borealis/sync/media.wrk]]) — `MediaEntitySyncer`
- [apps/borealis/tv/tv.serv.ts](../tv/tv.serv.md) ([[apps/borealis/tv/tv.serv]]) — `MediaEntitySyncer`
