# entities.ctrl.ts

- **Source**: [`apps/borealis/entities/entities.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/entities/entities.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/borealis/characters` | Get characters catalog (40 per page) | Borealis - Characters | query: `BorealisEntitiesModel.characterCatalogQuery` | `200`: `BorealisEntitiesModel.characterCatalogResponse`<br>`422`: `BorealisEntitiesModel.validationError` | `BorealisEntitiesServ.getCharacterCatalog` |
| `GET` | `/borealis/characters/filters` | Get available character filters | Borealis - Characters | — | `200`: `BorealisEntitiesModel.characterFiltersResponse` | `BorealisEntitiesServ.getCharacterFilters` |
| `GET` | `/borealis/characters/:id` | Get character details by ID | Borealis - Characters | params: `BorealisEntitiesModel.entityDetailParam` | `200`: `BorealisEntitiesModel.characterDetailResponse`<br>`404`: `BorealisEntitiesModel.notFoundError`<br>`422`: `BorealisEntitiesModel.validationError` | `BorealisEntitiesServ.getCharacterById` |
| `GET` | `/borealis/people` | Get people (staff/voice actors) (40 per page) | Borealis - People | query: `BorealisEntitiesModel.personCatalogQuery` | `200`: `BorealisEntitiesModel.personCatalogResponse`<br>`422`: `BorealisEntitiesModel.validationError` | `BorealisEntitiesServ.getPeopleCatalog` |
| `GET` | `/borealis/people/filters` | Get available people filters | Borealis - People | — | `200`: `BorealisEntitiesModel.personFiltersResponse` | `BorealisEntitiesServ.getPeopleFilters` |
| `GET` | `/borealis/people/:id` | Get person details by ID | Borealis - People | params: `BorealisEntitiesModel.entityDetailParam` | `200`: `BorealisEntitiesModel.personDetailResponse`<br>`404`: `BorealisEntitiesModel.notFoundError`<br>`422`: `BorealisEntitiesModel.validationError` | `BorealisEntitiesServ.getPersonById` |
| `GET` | `/borealis/studios` | Get studios (40 per page) | Borealis - Studios | query: `BorealisEntitiesModel.studioCatalogQuery` | `200`: `BorealisEntitiesModel.studioCatalogResponse`<br>`422`: `BorealisEntitiesModel.validationError` | `BorealisEntitiesServ.getStudioCatalog` |
| `GET` | `/borealis/studios/filters` | Get available studio filters | Borealis - Studios | — | `200`: `BorealisEntitiesModel.studioFiltersResponse` | `BorealisEntitiesServ.getStudioFilters` |
| `GET` | `/borealis/studios/:id` | Get studio details by ID | Borealis - Studios | params: `BorealisEntitiesModel.entityDetailParam` | `200`: `BorealisEntitiesModel.studioDetailResponse`<br>`404`: `BorealisEntitiesModel.notFoundError`<br>`422`: `BorealisEntitiesModel.validationError` | `BorealisEntitiesServ.getStudioById` |

### `GET /borealis/characters` (L5)
Browse paginated characters catalog with keyword searching, gender filters, and sorting.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisEntitiesModel.characterCatalogQuery`
- **2.** `[Return]`  — `await BorealisEntitiesServ.getCharacterCatalog(query)`

### `GET /borealis/characters/filters` (L5)
Returns available filter facets and distribution counts across character genders.

- **1.** `[Return]`  — `await BorealisEntitiesServ.getCharacterFilters()`

### `GET /borealis/characters/:id` (L5)
Fetches character details with appearances across anime, manga, movies, tv, books, and voice actors.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisEntitiesModel.entityDetailParam`
- **2.** `[Return]`  — `await BorealisEntitiesServ.getCharacterById(id)`

### `GET /borealis/people` (L5)
Browse paginated people catalog with occupation, language, and gender filters.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisEntitiesModel.personCatalogQuery`
- **2.** `[Return]`  — `await BorealisEntitiesServ.getPeopleCatalog(query)`

### `GET /borealis/people/filters` (L5)
Returns available filter facets and counts for primary occupations, languages, and genders.

- **1.** `[Return]`  — `await BorealisEntitiesServ.getPeopleFilters()`

### `GET /borealis/people/:id` (L5)
Fetches detailed person profile with voiced characters, staff credits across media, and music discography.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisEntitiesModel.entityDetailParam`
- **2.** `[Return]`  — `await BorealisEntitiesServ.getPersonById(id)`

### `GET /borealis/studios` (L5)
Browse paginated studios catalog with animation studio filtering and sorting.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisEntitiesModel.studioCatalogQuery`
- **2.** `[Return]`  — `await BorealisEntitiesServ.getStudioCatalog(query)`

### `GET /borealis/studios/filters` (L5)
Returns available studio classification facets (animation studios vs production companies).

- **1.** `[Return]`  — `await BorealisEntitiesServ.getStudioFilters()`

### `GET /borealis/studios/:id` (L5)
Fetches studio metadata, favorites, and list of media creations across anime, movies, tv, games, and books.

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `BorealisEntitiesModel.entityDetailParam`
- **2.** `[Return]`  — `await BorealisEntitiesServ.getStudioById(id)`

## Exported Types, Methods & Algorithms

### `const borealisEntities` (L5)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- `apps/borealis/entities/entities.model.ts` — `BorealisEntitiesModel`
- [apps/borealis/entities/entities.serv.ts](./entities.serv.md) ([[apps/borealis/entities/entities.serv]]) — `BorealisEntitiesServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_6`
