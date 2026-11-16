import { IconBook } from "@tabler/icons-react"
import { DocsDirectory } from "@/components/docs/docs-directory"
import { getIrisDocsManifest } from "@/lib/docs-loader"

export const metadata = {
  title: "API & Architecture Docs | IRIS",
  description: "Auto-generated IrisPage documentation for Elysia services, routes, sequences, and errors.",
}

export default function DocsIndexPage() {
  const entries = getIrisDocsManifest()

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2 text-start">
        <div className="flex items-center gap-2.5">
          <IconBook className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Elysia API & Module Documentation</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Rendered via <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">IrisPage</code> from
          generated AST JSON schemas covering pathname, basic info, inputs/outputs, execution sequence, and errors.
        </p>
      </header>

      <DocsDirectory entries={entries} />
    </main>
  )
}
