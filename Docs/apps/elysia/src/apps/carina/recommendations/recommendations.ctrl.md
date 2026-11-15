# recommendations.ctrl.ts

- **Source**: [`apps/carina/recommendations/recommendations.ctrl.ts`](../../../../../../../apps/elysia/src/apps/carina/recommendations/recommendations.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/carina/recommendations/` | Submit media recommendation strictly by media IDs | Carina Recommendations | body: `CarinaRecommendationsModel.submitBody` | `200`: `CarinaRecommendationsModel.submitResponse`<br>`400`: `CarinaRecommendationsModel.badRequestError`<br>`401`: `CarinaRecommendationsModel.unauthorizedError`<br>`422`: `CarinaRecommendationsModel.validationError` | `CarinaRecommendationsServ.submitRecommendation` |
| `GET` | `/carina/recommendations/:type/:id` | Get recommendations for media strictly by media domain and ID (10 per page default) | Carina Recommendations | params: `CarinaRecommendationsModel.mediaParam`<br>query: `CarinaRecommendationsModel.listRecommendationsQuery` | `200`: `CarinaRecommendationsModel.listRecommendationsResponse`<br>`400`: `CarinaRecommendationsModel.badRequestError`<br>`422`: `CarinaRecommendationsModel.validationError` | `CarinaRecommendationsServ.getMediaRecommendations` |
| `DELETE` | `/carina/recommendations/:id` | Delete recommendation strictly by numerical recommendation ID | Carina Recommendations | params: `CarinaRecommendationsModel.recommendationParam` | `200`: `CarinaRecommendationsModel.deleteResponse`<br>`401`: `CarinaRecommendationsModel.unauthorizedError`<br>`403`: `CarinaRecommendationsModel.forbiddenError`<br>`404`: `CarinaRecommendationsModel.notFoundError`<br>`422`: `CarinaRecommendationsModel.validationError` | `CarinaRecommendationsServ.deleteRecommendation` |
| `POST` | `/carina/recommendations/:id/vote` | Vote on recommendation strictly by recommendation ID | Carina Recommendations | params: `CarinaRecommendationsModel.recommendationParam`<br>body: `CarinaRecommendationsModel.voteBody` | `200`: `CarinaRecommendationsModel.voteResponse`<br>`400`: `CarinaRecommendationsModel.badRequestError`<br>`401`: `CarinaRecommendationsModel.unauthorizedError`<br>`404`: `CarinaRecommendationsModel.notFoundError`<br>`422`: `CarinaRecommendationsModel.validationError` | `CarinaRecommendationsServ.voteRecommendation` |

### `POST /carina/recommendations/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `CarinaRecommendationsModel.submitBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaRecommendationsServ.submitRecommendation(user.id, body)`

### `GET /carina/recommendations/:type/:id` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaRecommendationsModel.mediaParam`, query: `CarinaRecommendationsModel.listRecommendationsQuery`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `currentUser`
- **3.** `[Return]`  — `await CarinaRecommendationsServ.getMediaRecommendations(params.type, params.id, query, ...)`

### `DELETE /carina/recommendations/:id` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaRecommendationsModel.recommendationParam`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaRecommendationsServ.deleteRecommendation(user, params.id)`

### `POST /carina/recommendations/:id/vote` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — params: `CarinaRecommendationsModel.recommendationParam`, body: `CarinaRecommendationsModel.voteBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await CarinaRecommendationsServ.voteRecommendation(user.id, params.id, body.voteType)`

## Exported Types, Methods & Algorithms

### `const carinaRecommendations` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/carina/recommendations/recommendations.model.ts` — `CarinaRecommendationsModel`
- [apps/carina/recommendations/recommendations.serv.ts](./recommendations.serv.md) ([[apps/carina/recommendations/recommendations.serv]]) — `CarinaRecommendationsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_32`
