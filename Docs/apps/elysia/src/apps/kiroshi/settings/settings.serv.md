# settings.serv.ts

- **Source**: [`apps/kiroshi/settings/settings.serv.ts`](../../../../../../../apps/elysia/src/apps/kiroshi/settings/settings.serv.ts)
- **Layer / Role**: Service (Business Logic)
- **Inheritance**: `KiroshiSettingsService extends BaseService`

## Exported Types, Methods & Algorithms

### `class KiroshiSettingsService` extends `BaseService` (L8)

Service managing Kiroshi search engine user preferences.

#### `constructor()` (L9)
Service managing Kiroshi search engine user preferences.

- _No executable statements_

#### `getSettings(userId)` (L16)
Retrieves search engine settings and preferences for the user.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
- **2.** `[If]` `!dbUser`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found.'
- **3.** `[Sequence]` Define `rawSettings`, `searchSettings`
  ```typescript
  const rawSettings = dbUser.settings as Record<string, any> || {}
  const searchSettings = rawSettings.search || {}
  ```
- **4.** `[Return]` 
  ```json
  {
    "success": true,
    "settings": {
      "historyEnabled": "<searchSettings.historyEnabled !== false>"
    }
  }
  ```

#### `updateSettings(userId, body)` (L41)
Updates search engine settings and preferences for the user.

- **1.** `[Sequence]` Database `first` on `User` and stores it as `dbUser`
- **2.** `[If]` `!dbUser`
  - **2.1.** `[Error]` Throws `NotFound` (HTTP 404) — 'User not found.'
- **3.** `[Sequence]` Define `rawSettings`, `updatedSettings`
  ```typescript
  const rawSettings = dbUser.settings as Record<string, any> || {}
  const updatedSettings = { ...rawSettings, search: { ...(rawSettings.search || {}), historyEnabled: body.historyEnabled, }, }
  ```
- **4.** `[Sequence]` Database `update` on `User`
- **5.** `[Return]` 
  ```json
  {
    "success": true,
    "settings": {
      "historyEnabled": "<body.historyEnabled>"
    }
  }
  ```

### `const kiroshiSettingsServ` (L74)

### `class KiroshiSettingsServ` (L79)

Static facade preserving legacy callers.

#### `getSettings(userId)` (L80)
Static facade preserving legacy callers.

- **1.** `[Return]`  — `await kiroshiSettingsServ.getSettings(userId)`

#### `updateSettings(userId, body)` (L84)

- **1.** `[Return]`  — `await kiroshiSettingsServ.updateSettings(userId, body)`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/base/base.serv.ts](../../../core/base/base.serv.md) ([[core/base/base.serv]]) — `BaseService`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `NotFound`

### External / Workspace Packages
- `@NamelessLiberty/db` — `prisma`

### Called By / Imported By
- [apps/kiroshi/settings/settings.ctrl.ts](./settings.ctrl.md) ([[apps/kiroshi/settings/settings.ctrl]]) — `KiroshiSettingsServ`
