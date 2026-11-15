# controllers.ts

- **Source**: [`core/plugins/controllers.ts`](../../../../../../apps/elysia/src/core/plugins/controllers.ts)
- **Layer / Role**: Core Infrastructure

## Exported Types, Methods & Algorithms

### `interface ControllerInfo` (L9)

### `interface ControllersOptions` (L17)

### `function isElysiaInstance` (L89)

Checks if a value is an Elysia instance. Checks instanceof Elysia as well as duck typing for cross-version/cross-realm compatibility.

- **1.** `[If]` `!val || typeofval !== 'object'`
  - **1.1.** `[Return]`  — `false`
- **2.** `[If]` `val instanceof Elysia`
  - **2.1.** `[Return]`  — `true`
- **3.** `[Sequence]` Define `candidate`
  ```typescript
  const candidate = val as Record<string, unknown>
  ```
- **4.** `[Return]`  — `typeofcandidate.handle === 'function' && typeofcandidate.use === 'function' && Array.isArray(candidate.routes)`

### `function resolveControllerDir` (L104)

Resolves the controller directory path reliably across different execution contexts (e.g., monorepo root, package root, or bun run).

- **1.** `[If]` `specifiedDir`
  - **1.1.** `[If]` `path.isAbsolute(specifiedDir)`
    - **1.1.1.** `[If]` `fs.existsSync(specifiedDir)`
      - **1.1.1.1.** `[Return]`  — `specifiedDir`
  - **1.2.** `[Else]` Otherwise
    - **1.2.1.** `[Sequence]` Calls `path.resolve` and stores result as `fromCwd`
    - **1.2.2.** `[If]` `fs.existsSync(fromCwd)`
      - **1.2.2.1.** `[Return]`  — `fromCwd`
    - **1.2.3.** `[Sequence]` Calls `path.resolve` and stores result as `fromFile`
    - **1.2.4.** `[If]` `fs.existsSync(fromFile)`
      - **1.2.4.1.** `[Return]`  — `fromFile`
  - **1.3.** `[Return]`  — `path.resolve(process.cwd(), specifiedDir)`
- **2.** `[Sequence]` Define `candidates`
  ```typescript
  const candidates = [ path.resolve(process.cwd(), 'src/apps'), path.resolve(process.cwd(), 'apps'), path.resolve(import.meta.dirname, '../../apps'), path.resolve(process.cwd(), 'src/api/controllers'), path.resolve(import.meta.dirname, '../api/controllers'), ]
  ```
- **3.** `[Loop]` Iterate `const candidate` over `candidates`
  - **3.1.** `[If]` `fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()`
    - **3.1.1.** `[Return]`  — `candidate`
- **4.** `[Return]`  — `path.resolve(process.cwd(), 'src/api/controllers')`

### `function scanFiles` (L141)

Recursively scans a directory for files matching criteria.

- **1.** `[If]` `!fs.existsSync(dir)`
  - **1.1.** `[Return]`  — `[]`
- **2.** `[Sequence]` Define `results`
  ```typescript
  const results: string[] = []
  ```
- **3.** `[Sequence]` Calls `fs.readdirSync` and stores result as `entries`
- **4.** `[Loop]` Iterate `const entry` over `entries`
  - **4.1.** `[Sequence]` Define `fullPath`
    ```typescript
    const fullPath = path.join(dir, entry.name)
    ```
  - **4.2.** `[If]` `entry.isDirectory()`
    - **4.2.1.** `[If]` `recursive && entry.name !== 'node_modules' && !entry.name.startsWith('.')`
  - **4.3.** `[If]` `!entry.isFile()`
  - **4.4.** `[Sequence]` Define `name`
    ```typescript
    const name = entry.name
    ```
  - **4.5.** `[If]` `name.startsWith('.') || name.startsWith('_') || name.endsWith('.d.ts') || name.includes('.test.') || name.includes('.spec.') || name.includes('.generated.')`
  - **4.6.** `[If]` `ignore`
    - **4.6.1.** `[If]` `typeofignore === 'function' && ignore(name, fullPath)`
    - **4.6.2.** `[If]` `Array.isArray(ignore)`
      - **4.6.2.1.** `[Sequence]` Calls `ignore.some` and stores result as `isIgnored`
      - **4.6.2.2.** `[If]` `isIgnored`
  - **4.7.** `[If]` `pattern`
    - **4.7.1.** `[If]` `typeofpattern === 'function'`
      - **4.7.1.1.** `[If]` `!pattern(name, fullPath)`
    - **4.7.2.** `[Else]` Otherwise
      - **4.7.2.1.** `[If]` `pattern instanceof RegExp`
        - **4.7.2.1.1.** `[If]` `!pattern.test(name) && !pattern.test(fullPath)`
      - **4.7.2.2.** `[Else]` Otherwise
        - **4.7.2.2.1.** `[If]` `typeofpattern === 'string'`
          - **4.7.2.2.1.1.** `[If]` `!name.includes(pattern) && !fullPath.includes(pattern)`
  - **4.8.** `[Else]` Otherwise
    - **4.8.1.** `[Sequence]` Calls `/\.(ctrl|controller)\.[cm]?[jt]sx?$/.test` and stores result as `isControllerFile`
    - **4.8.2.** `[If]` `!isControllerFile`
- **5.** `[Return]`  — `results.sort()`

### `function generateStaticManifest` (L273)

Generates a static TypeScript manifest file importing and chaining all discovered controllers. Useful for 100% full compile-time Eden Treaty type inference.

- **1.** `[Sequence]` Calls `path.dirname` and stores result as `outputDir`
- **2.** `[If]` `!fs.existsSync(outputDir)`
  - **2.1.** `[Sequence]` Calls `fs.mkdirSync`
- **3.** `[Sequence]` Define `importStatements`, `chainCalls`
  ```typescript
  const importStatements: string[] = ["import { Elysia } from 'elysia'"]
  const chainCalls: string[] = []
  ```
- **4.** `[Sequence]` Calls `controllers.forEach`
- **5.** `[Sequence]` Define `BATCH_SIZE`, `batches`
  ```typescript
  const BATCH_SIZE = 6
  const batches: string[][] = []
  ```
- **6.** `[Loop]` Loop `i < controllers.length`
  - **6.1.** `[Sequence]` Define `chunk`
    ```typescript
    const chunk = controllers.slice(i, i + BATCH_SIZE)
    ```
- **7.** `[Sequence]` Define `groupDefinitions`, `groupUses`, `code`
  ```typescript
  const groupDefinitions = batches.map((batch, bIdx) => { return `const _group_${bIdx} = new Elysia()\n ${batch.map((name) => `.use(${name})`).join('\n ')}` })
  const groupUses = batches.map((_, bIdx) => `.use(_group_${bIdx})`)
  const code = [ '// [AUTO-GENERATED] DO NOT EDIT MANUALLY', '// Generated by @NamelessLiberty/elysia controllers plugin for Eden Treaty static typing.', ...importStatements, '', ...groupDefinitions, '', ....join('
  ')
  ```
- **8.** `[If]` `fs.existsSync(outputFile)`
  - **8.1.** `[Sequence]` Calls `fs.readFileSync` and stores result as `current`
  - **8.2.** `[If]` `current === code`
    - **8.2.1.** `[Return]`  — `void`
- **9.** `[Sequence]` Calls `fs.writeFileSync`

### `function generateControllersManifest` (L338)

Scans controller files in specifiedDir and regenerates the static controllers.generated.ts manifest.

- **1.** `[Sequence]` Calls `resolveControllerDir` and stores result as `targetDir`
- **2.** `[If]` `!fs.existsSync(targetDir)`
  - **2.1.** `[Return]`  — `null`
- **3.** `[Sequence]` Calls `scanFiles` and stores result as `files`
- **4.** `[Sequence]` Define `items`
  ```typescript
  const items: { exportName: string; filePath: string }[] = []
  ```
- **5.** `[Loop]` Iterate `const filePath` over `files`
  - **5.1.** `[Try]` Try block
    - **5.1.1.** `[Sequence]` Calls `fs.readFileSync` and stores result as `content`
    - **5.1.2.** `[Sequence]` Define `namedRegex`, `match`, `foundNamed`
      ```typescript
      const namedRegex = /export\s+const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:new\s+Elysia|create\w+(?:Router|Controller)|\()/g
      let match: RegExpExecArray | null
      let foundNamed = false
      ```
    - **5.1.3.** `[Loop]` While `match = namedRegex.exec(content) !== null`
      - **5.1.3.1.** `[If]` `match[1]`
        - **5.1.3.1.1.** `[Sequence]` Assign `foundNamed`
          ```typescript
          foundNamed = true
          ```
    - **5.1.4.** `[If]` `!foundNamed && /export\s+default\s+/.test(content)`
  - **5.2.** `[Catch]` Catch (`err`)
    - **5.2.1.** `[Warning]` Logs warning — `[ControllersManifest] Skipping ${filePath}:`, err?.message || err
- **6.** `[Sequence]` Define `outFile`
  ```typescript
  const outFile = specifiedOutFile ? path.resolve(process.cwd(), specifiedOutFile) : path.basename(targetDir) === 'apps' ? path.join(targetDir, 'controllers.generated.ts') : path.join(path.dirname(targetDir), 'controllers.generated.ts')
  ```
- **7.** `[Sequence]` Calls `generateStaticManifest`
- **8.** `[Return]`  — `outFile`

### `interface ControllersPlugin` (L397)

Scans and registers controllers synchronously into an Elysia plugin. Recommended for Bun and environments supporting synchronous module resolution. @example ```typescript import { Elysia } from 'elysia' import { controllers } from './plugins/controllers' export const app = new Elysia() .use(controllers()) .listen(4000) ```

### `const controllers` (L581)

### `const autoloadControllers` (L588)

Convenient alias for `controllers`.

## Dependencies & Call Graph

### Internal Modules (Calls / Imports)
- _None_

### External / Workspace Packages
- `node:fs` — `fs`
- `node:path` — `path`
- `node:module` — `createRequire`
- `node:url` — `pathToFileURL`
- `elysia` — `Elysia`

### Called By / Imported By
- _None_
