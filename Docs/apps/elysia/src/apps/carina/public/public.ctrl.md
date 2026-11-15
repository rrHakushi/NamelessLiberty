# public.ctrl.ts

- **Source**: [`apps/carina/public/public.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/public/public.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/public/*` | Serve static / public uploaded files | Public Assets | params: `PublicAssetsModel.wildcardParam` | `400`: `PublicAssetsModel.badRequestError`<br>`404`: `PublicAssetsModel.notFoundError`<br>`422`: `PublicAssetsModel.validationError` | `PublicAssetsServ.serveAsset` |
| `GET` | `/carina/public/*` | Serve static / public uploaded files (Carina namespace alias) | Public Assets | params: `PublicAssetsModel.wildcardParam` | `400`: `PublicAssetsModel.badRequestError`<br>`404`: `PublicAssetsModel.notFoundError`<br>`422`: `PublicAssetsModel.validationError` | `PublicAssetsServ.serveAsset` |

### `GET /public/*` (L5)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `PublicAssetsModel.wildcardParam`
- **2.** `[Sequence]` Define `wildcardKey`
  ```typescript
  const wildcardKey = params['*']
  ```
- **3.** `[Return]`  — `await PublicAssetsServ.serveAsset(wildcardKey)`

### `GET /carina/public/*` (L5)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `PublicAssetsModel.wildcardParam`
- **2.** `[Sequence]` Define `wildcardKey`
  ```typescript
  const wildcardKey = params['*']
  ```
- **3.** `[Return]`  — `await PublicAssetsServ.serveAsset(wildcardKey)`

## Exported Types, Methods & Algorithms

### `const carinaPublic` (L5)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- `apps/carina/public/public.model.ts` — `PublicAssetsModel`
- [apps/carina/public/public.serv.ts](./public.serv.md) ([[apps/carina/public/public.serv]]) — `PublicAssetsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_30`
