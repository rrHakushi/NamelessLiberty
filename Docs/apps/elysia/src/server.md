# server.ts

- **Source**: [`server.ts`](../../../../apps/elysia/src/server.ts)
- **Layer / Role**: Application Entrypoint

## Exported Types, Methods & Algorithms

### `const app` (L72)

### `type App` (L301)

### `function startServer` (L307)

Starts listening for incoming HTTP connections. Uses reusePort: true for kernel-level multi-threaded connection distribution across cluster workers.

- **1.** `[Sequence]` Define `resolvedPort`
  ```typescript
  const resolvedPort = port ?? Number(Bun.env.ELYSIA_PORT)
  ```
- **2.** `[If]` `!resolvedPort || Number.isNaN(resolvedPort)`
  - **2.1.** `[Error]` Throws `Error` — 'Missing or invalid environment variable: ELYSIA_PORT'
- **3.** `[Sequence]` Calls `app.listen` and stores result as `server`
- **4.** `[Sequence]` Define `handleShutdown`
  ```typescript
  const handleShutdown = async (signal: string) => { logger.info(`Worker ${process.pid} received ${signal}, shutting down...`) try { await tesseractServ.shutdown() } catch {} try { await app.stop() ...
  ```
- **5.** `[Sequence]` Calls `process.on`
- **6.** `[Sequence]` Calls `process.on`
- **7.** `[Return]`  — `server`

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [load-env.ts](./load-env.md) ([[load-env]])
- [core/typebox/setup.ts](./core/typebox/setup.md) ([[core/typebox/setup]])
- [core/plugins/index.ts](./core/plugins/index.md) ([[core/plugins/index]]) — `rateLimiter`, `generateControllersManifest`
- [core/plugins/session.ts](./core/plugins/session.md) ([[core/plugins/session]]) — `resolveSessionFromRequest`
- [core/errors/http-errors.ts](./core/errors/http-errors.md) ([[core/errors/http-errors]]) — `isHttpError`
- [core/ws/ws.serv.ts](./core/ws/ws.serv.md) ([[core/ws/ws.serv]]) — `wsHub`
- [apps/tesseract/signaling/tesseract.serv.ts](./apps/tesseract/signaling/tesseract.serv.md) ([[apps/tesseract/signaling/tesseract.serv]]) — `isPrivateLanOrigin`, `tesseractServ`
- [apps/controllers.generated.ts](./apps/controllers.generated.md) ([[apps/controllers.generated]]) — `controllers`, `ControllersApp`

### External / Workspace Packages
- `elysia` — `Elysia`, `NotFound`, `ValidationError`
- `@elysia/openapi` — `openapi`
- `@elysia/cors` — `cors`
- `@NamelessLiberty/logger` — `LogFactory`, `c`
- `elysia/websocket` — `websocket`

### Called By / Imported By
- [index.ts](./index.md) ([[index]]) — `app`, `App`, `startServer`
