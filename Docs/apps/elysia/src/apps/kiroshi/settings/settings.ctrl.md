# settings.ctrl.ts

- **Source**: [`apps/kiroshi/settings/settings.ctrl.ts`](../../../../../../../apps/elysia/src/apps/kiroshi/settings/settings.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/kiroshi/settings/` | Get search engine settings and preferences for authenticated user | Kiroshi Settings | — | `200`: `KiroshiSettingsModel.settingsResponse`<br>`401`: `KiroshiSettingsModel.unauthorizedError` | `KiroshiSettingsServ.getSettings` |
| `PATCH` | `/kiroshi/settings/` | Update search engine settings and preferences (e.g. historyEnabled) | Kiroshi Settings | body: `KiroshiSettingsModel.updateSettingsBody` | `200`: `KiroshiSettingsModel.updateSettingsResponse`<br>`400`: `KiroshiSettingsModel.badRequestError`<br>`401`: `KiroshiSettingsModel.unauthorizedError`<br>`422`: `KiroshiSettingsModel.validationError` | `KiroshiSettingsServ.updateSettings` |

### `GET /kiroshi/settings/` (L6)

- **1.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **2.** `[Return]`  — `await KiroshiSettingsServ.getSettings(user.id)`

### `PATCH /kiroshi/settings/` (L6)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `KiroshiSettingsModel.updateSettingsBody`
- **2.** `[Sequence]` Calls `userSession.requireUser` and stores result as `user`
- **3.** `[Return]`  — `await KiroshiSettingsServ.updateSettings(user.id, body)`

## Exported Types, Methods & Algorithms

### `const kiroshiSettings` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/kiroshi/settings/settings.model.ts` — `KiroshiSettingsModel`
- [apps/kiroshi/settings/settings.serv.ts](./settings.serv.md) ([[apps/kiroshi/settings/settings.serv]]) — `KiroshiSettingsServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_37`
