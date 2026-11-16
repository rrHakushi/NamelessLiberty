# calendar.ctrl.ts

- **Source**: [`apps/borealis/calendar/calendar.ctrl.ts`](../../../../../../../apps/elysia/src/apps/borealis/calendar/calendar.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/borealis/calendar` | Media broadcast / release calendar | Borealis - Calendar | query: `BorealisCalendarModel.calendarQuery` | `200`: `BorealisCalendarModel.calendarResponse`<br>`422`: `BorealisCalendarModel.validationError` | `BorealisCalendarServ.getCalendar` |

### `GET /borealis/calendar` (L6)
Fetches upcoming and past media releases across Anime (airing schedules), Manga (start/end dates), Games, Books, Movies, TV Episodes (air dates and seasons), and Music with list filtering.

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `BorealisCalendarModel.calendarQuery`
- **2.** `[Sequence]` Calls `userSession.getUser` and stores result as `user`
- **3.** `[Return]`  — `await BorealisCalendarServ.getCalendar(query, user?.id)`

## Exported Types, Methods & Algorithms

### `const borealisCalendar` (L6)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- `apps/borealis/calendar/calendar.model.ts` — `BorealisCalendarModel`
- [apps/borealis/calendar/calendar.serv.ts](./calendar.serv.md) ([[apps/borealis/calendar/calendar.serv]]) — `BorealisCalendarServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_5`
