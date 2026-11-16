# search.ctrl.ts

- **Source**: [`apps/borealis/search/search.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/search/search.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/borealis/search` | Search media catalog (?q=...&category=...) | Borealis - Search | query: `BorealisSearchModel.searchQuery` | `200`: `BorealisSearchModel.searchResponse`<br>`422`: `BorealisSearchModel.validationError` | `BorealisSearchServ.search` |

### `GET /borealis/search` (L5)
Searches media catalog items across media, anime, manga, movies, tv, music, books, characters, people, studios.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisSearchModel.searchQuery`
- **2.** `[Return]`  — `await BorealisSearchServ.search(query)`

## Exported Types, Methods & Algorithms

### `const borealisSearch` (L5)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- `apps/borealis/search/search.model.ts` — `BorealisSearchModel`
- [apps/borealis/search/search.serv.ts](./search.serv.md) ([[apps/borealis/search/search.serv]]) — `BorealisSearchServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_14`
