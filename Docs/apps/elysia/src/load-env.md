# load-env.ts

- **Source**: [`load-env.ts`](../../../../apps/elysia/src/load-env.ts)
- **Layer / Role**: Module / Helper

## Exported Types, Methods & Algorithms

### `function ensureEnvLoaded` (L9)

Ensures monorepo root `.env` is loaded into `Bun.env` if not already present. Bun natively supports `--env-file=../../.env`, but this programmatic fallback guarantees environment variables are present even when invoked without CLI flags.

- **1.** `[If]` `Bun.env.JWT_SECRET`
  - **1.1.** `[Return]`  — `void`
- **2.** `[Sequence]` Define `candidatePaths`
  ```typescript
  const candidatePaths = [ resolve(import.meta.dir, '../../../.env'), resolve(import.meta.dir, '../../.env'), resolve(process.cwd(), '../.env'), resolve(process.cwd(), '../../.env'), resolve(process.cwd(), '.env'), ]
  ```
- **3.** `[Loop]` Iterate `const envPath` over `candidatePaths`
  - **3.1.** `[If]` `existsSync(envPath)`
    - **3.1.1.** `[Try]` Try block
      - **3.1.1.1.** `[Sequence]` Calls `readFileSync` and stores result as `content`
      - **3.1.1.2.** `[Loop]` Iterate `const line` over `content.split('
')`
        - **3.1.1.2.1.** `[Sequence]` Define `trimmed`
          ```typescript
          const trimmed = line.trim()
          ```
        - **3.1.1.2.2.** `[If]` `!trimmed || trimmed.startsWith('#')`
        - **3.1.1.2.3.** `[Sequence]` Calls `trimmed.indexOf` and stores result as `eqIdx`
        - **3.1.1.2.4.** `[If]` `eqIdx === -1`
        - **3.1.1.2.5.** `[Sequence]` Define `key`, `val`
          ```typescript
          const key = trimmed.slice(0, eqIdx).trim()
          let val = trimmed.slice(eqIdx + 1).trim()
          ```
        - **3.1.1.2.6.** `[If]` `val.startsWith('"') && val.endsWith('"') || val.startsWith(''') && val.endsWith(''')`
          - **3.1.1.2.6.1.** `[Sequence]` Assign `val`
            ```typescript
            val = val.slice(1, -1)
            ```
        - **3.1.1.2.7.** `[Sequence]` Assign `val`
          ```typescript
          val = val.replace(/\$\{([^}]+)\}/g, (_, varName) => Bun.env[varName] ?? '')
          ```
        - **3.1.1.2.8.** `[If]` `!Bun.env[key]`
          - **3.1.1.2.8.1.** `[Sequence]` Assign `Bun.env[key]`
            ```typescript
            Bun.env[key] = val
            ```
      - **3.1.1.3.** `[Return]`  — `void`
    - **3.1.2.** `[Catch]` Catch (`err`)

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `node:fs` — `existsSync`, `readFileSync`
- `node:path` — `resolve`

### Called By / Imported By
- [core/plugins/session.ts](./core/plugins/session.md) ([[core/plugins/session]])
- [index.ts](./index.md) ([[index]])
- [server.ts](./server.md) ([[server]])
