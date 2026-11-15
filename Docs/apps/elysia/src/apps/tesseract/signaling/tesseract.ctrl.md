# tesseract.ctrl.ts

- **Source**: [`apps/tesseract/signaling/tesseract.ctrl.ts`](../../../../../../../apps/elysia/src/apps/tesseract/signaling/tesseract.ctrl.ts)
- **Layer / Role**: Controller (HTTP / WS Routes)

## HTTP / WebSocket Routes & Algorithms

| Method | Path | Summary | Tags | Request Schemas | Responses | Calls |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tesseract/identity` | Get Tesseract LAN lobby scope and optional authenticated user profile | Tesseract | — | `200`: `TesseractModel.identityResponse` | `tesseractServ.getIdentity` |
| `GET` | `/tesseract/events` | Server-Sent Events signaling fallback stream for Tesseract | Tesseract | query: `TesseractModel.eventsQuery` | — | `tesseractServ.disconnectPeer`<br>`tesseractServ.connectPeer` |
| `POST` | `/tesseract/signal` | Send a Tesseract signaling frame when using SSE fallback transport | Tesseract | body: `TesseractModel.signalBody` | `200`: `TesseractModel.signalResponse`<br>`401`: `TesseractModel.unauthorizedError`<br>`422`: `TesseractModel.validationError` | `tesseractServ.verifySseSignalAccess`<br>`tesseractServ.handleClientSignal` |

### `GET /tesseract/identity` (L7)

- **1.** `[Sequence]` Define `remoteAddr`
  ```typescript
  const remoteAddr = (server as any)?.requestIP?.(request)?.address ?? null
  ```
- **2.** `[Return]`  — `await tesseractServ.getIdentity(request, remoteAddr)`

### `GET /tesseract/events` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — query: `TesseractModel.eventsQuery`
- **2.** `[Sequence]` Define `remoteAddr`, `encoder`, `peerId`, `closed`, `keepAliveTimer`, `stream`
  ```typescript
  const remoteAddr = (server as any)?.requestIP?.(request)?.address ?? null
  const encoder = new TextEncoder()
  let peerId: string | null = null
  let closed = false
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null
  const stream = new ReadableStream<Uint8Array>({ async start(controller) { const cleanup = async () => { if (closed) return closed = true if (keepAliveTimer) { clearInterval(keepAliveTimer) ...
  ```
- **3.** `[Return]`  — `new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', }, })`

### `POST /tesseract/signal` (L7)

- **1.** `[Sequence]` Validates request input (TypeBox) — body: `TesseractModel.signalBody`
- **2.** `[Sequence]` Calls `tesseractServ.verifySseSignalAccess` and stores result as `allowed`
- **3.** `[If]` `!allowed`
  - **3.1.** `[Error]` Throws `Unauthorized` (HTTP 401) — 'Invalid Tesseract peer credentials'
- **4.** `[Sequence]` Calls `tesseractServ.handleClientSignal`
- **5.** `[Return]` 
  ```json
  {
    "ok": true
  }
  ```

## Exported Types, Methods & Algorithms

### `const tesseractController` (L7)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- [core/plugins/session.ts](../../../core/plugins/session.md) ([[core/plugins/session]]) — `session`
- [core/errors/http-errors.ts](../../../core/errors/http-errors.md) ([[core/errors/http-errors]]) — `Unauthorized`
- `apps/tesseract/signaling/tesseract.model.ts` — `TesseractModel`
- [apps/tesseract/signaling/tesseract.serv.ts](./tesseract.serv.md) ([[apps/tesseract/signaling/tesseract.serv]]) — `tesseractServ`

### External / Workspace Packages
- `elysia` — `Elysia`

### Called By / Imported By
- [apps/controllers.generated.ts](../../controllers.generated.md) ([[apps/controllers.generated]]) — `_ctrl_40`
