import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const NEXT_ROOT = path.resolve(__dirname, "..")
const REPO_ROOT = path.resolve(NEXT_ROOT, "..", "..")

const ALL_APPS = [
  "akaromi",
  "borealis",
  "carina",
  "kiroshi",
  "reliquary",
  "runa",
  "tesseract",
] as const

type AppId = (typeof ALL_APPS)[number]

/** Maps Next.js app IDs to their workspace package names. */
const APP_PACKAGE_MAP: Record<AppId, string> = {
  akaromi: "@NamelessLiberty/akaromi",
  borealis: "@NamelessLiberty/borealis",
  carina: "@NamelessLiberty/carina",
  kiroshi: "@NamelessLiberty/kiroshi",
  reliquary: "@NamelessLiberty/reliquary",
  runa: "@NamelessLiberty/iris",
  tesseract: "@NamelessLiberty/tesseract",
}

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".turbo", ".git"])

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectSourceFiles(full, out)
    } else if (entry.isFile() && /\.(tsx?|jsx?|mjs)$/.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function readIrisConfig(): Record<string, { enabled?: boolean }> {
  const irisPath = path.join(REPO_ROOT, "iris.json")
  if (!fs.existsSync(irisPath)) {
    throw new Error(`[configure-apps] Missing iris.json at ${irisPath}`)
  }
  return JSON.parse(fs.readFileSync(irisPath, "utf8"))
}

function stripAppMarkers(content: string, disabledApps: AppId[]): string {
  let result = content
  for (const app of disabledApps) {
    const tsMarker = new RegExp(
      `^[ \\t]*\\/\\/ @app:${app}:start[\\s\\S]*?^[ \\t]*\\/\\/ @app:${app}:end\\r?\\n?`,
      "gm"
    )
    const jsxMarker = new RegExp(
      `^[ \\t]*\\{\\/\\* @app:${app}:start \\*\\/\\}[\\s\\S]*?^[ \\t]*\\{\\/\\* @app:${app}:end \\*\\/\\}\\r?\\n?`,
      "gm"
    )
    result = result.replace(tsMarker, "").replace(jsxMarker, "")
  }
  return result
}

function stripDisabledDepsFromPackageJson(
  pkgPath: string,
  disabledPkgNames: string[]
) {
  if (!fs.existsSync(pkgPath)) return false
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
  let changed = false
  for (const pkgName of disabledPkgNames) {
    if (pkg.dependencies?.[pkgName]) {
      delete pkg.dependencies[pkgName]
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
  }
  return changed
}

function main() {
  const irisConfig = readIrisConfig()
  const enabled = ALL_APPS.filter((id) => irisConfig[id]?.enabled !== false)
  const disabled = ALL_APPS.filter((id) => irisConfig[id]?.enabled === false)

  if (disabled.length === 0) {
    console.log("[configure-apps] All apps enabled:", enabled.join(", "))
    return
  }

  console.log("[configure-apps] Enabled apps:", enabled.join(", "))
  console.log("[configure-apps] Disabling apps:", disabled.join(", "))

  // 1. Remove disabled app route directories in app/(APPS)/<app>
  for (const app of disabled) {
    const appDir = path.join(NEXT_ROOT, "app", "(APPS)", app)
    if (fs.existsSync(appDir)) {
      fs.rmSync(appDir, { recursive: true, force: true })
      console.log(`  - Removed route directory: app/(APPS)/${app}`)
    }
  }

  // 2. Remove disabled package dependencies from apps/next/package.json and packages/*/package.json
  const disabledPkgNames = disabled.map((app) => APP_PACKAGE_MAP[app])
  if (
    stripDisabledDepsFromPackageJson(
      path.join(NEXT_ROOT, "package.json"),
      disabledPkgNames
    )
  ) {
    console.log(
      `  - Removed disabled dependencies from apps/next/package.json`
    )
  }

  const packagesDir = path.join(REPO_ROOT, "packages")
  if (fs.existsSync(packagesDir)) {
    for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const pkgJsonPath = path.join(packagesDir, entry.name, "package.json")
      if (stripDisabledDepsFromPackageJson(pkgJsonPath, disabledPkgNames)) {
        console.log(
          `  - Removed disabled dependencies from packages/${entry.name}/package.json`
        )
      }
    }
  }

  // 3. Remove disabled packages from next.config.ts transpilePackages
  const nextConfigPath = path.join(NEXT_ROOT, "next.config.ts")
  let nextConfig = fs.readFileSync(nextConfigPath, "utf8")
  for (const pkgName of disabledPkgNames) {
    nextConfig = nextConfig.replace(
      new RegExp(`^[ \\t]*"${pkgName.replace("/", "\\/")}",?\\r?\\n?`, "gm"),
      ""
    )
  }
  fs.writeFileSync(nextConfigPath, nextConfig)

  // 4. Strip disabled app blocks from any marked file in apps/next and packages/*
  const candidateFiles = [
    ...collectSourceFiles(NEXT_ROOT),
    ...collectSourceFiles(packagesDir),
  ]
  for (const fullPath of candidateFiles) {
    const original = fs.readFileSync(fullPath, "utf8")
    if (!original.includes("@app:")) continue
    const updated = stripAppMarkers(original, disabled)
    if (updated !== original) {
      fs.writeFileSync(fullPath, updated)
      console.log(
        `  - Stripped disabled app blocks in ${path.relative(REPO_ROOT, fullPath)}`
      )
    }
  }
}

main()
