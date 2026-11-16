import fs from "node:fs"
import path from "node:path"
import type { IrisPageSchema } from "@/components/iris-page"

export interface IrisDocManifestEntry {
  slug: string
  title: string
  description: string
  role: string
  pathname: string
  relPath: string
  methods: string[]
  routePaths: string[]
  errorCount: number
}

function resolveIrisDocsDir(): string {
  const fallback = path.resolve(process.cwd(), "../../Docs/apps/elysia/iris-page")
  const candidates = [
    path.resolve(process.cwd(), "Docs/apps/elysia/iris-page"),
    fallback,
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return fallback
}

export function getIrisDocsManifest(): IrisDocManifestEntry[] {
  const docsDir = resolveIrisDocsDir()
  const manifestPath = path.join(docsDir, "manifest.json")
  if (!fs.existsSync(manifestPath)) {
    return []
  }
  const raw = fs.readFileSync(manifestPath, "utf8")
  return JSON.parse(raw) as IrisDocManifestEntry[]
}

export function getIrisDocBySlug(slugParts: string[]): IrisPageSchema | null {
  if (slugParts.length === 0) return null

  const docsDir = path.resolve(resolveIrisDocsDir())
  const joined = `${slugParts.join("/")}.json`
  const resolved = path.resolve(docsDir, joined)

  // Prevent path traversal outside Docs/apps/elysia/iris-page
  if (!resolved.startsWith(docsDir + path.sep)) {
    return null
  }
  if (!fs.existsSync(resolved)) {
    return null
  }

  const raw = fs.readFileSync(resolved, "utf8")
  return JSON.parse(raw) as IrisPageSchema
}
