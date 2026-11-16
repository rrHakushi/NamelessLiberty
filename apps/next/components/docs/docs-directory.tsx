"use client"

import * as React from "react"
import Link from "next/link"
import { IconAlertTriangle, IconFileCode, IconRoute, IconSearch } from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import type { IrisDocManifestEntry } from "@/lib/docs-loader"

interface DocsDirectoryProps {
  entries: IrisDocManifestEntry[]
}

const METHOD_BADGE_CLASS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  POST: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  PATCH: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  DELETE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
}

export function DocsDirectory({ entries }: DocsDirectoryProps) {
  const [query, setQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<string>("ALL")

  const roles = React.useMemo(() => {
    const set = new Set(entries.map((e) => e.role))
    return ["ALL", ...Array.from(set).sort()]
  }, [entries])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((entry) => {
      if (roleFilter !== "ALL" && entry.role !== roleFilter) return false
      if (!q) return true
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.pathname.toLowerCase().includes(q) ||
        entry.relPath.toLowerCase().includes(q) ||
        entry.routePaths.some((p) => p.toLowerCase().includes(q))
      )
    })
  }, [entries, query, roleFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by pathname, route, module, or summary..."
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === role
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {role === "ALL" ? `All (${entries.length})` : role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((entry) => {
          const isRoute = entry.routePaths.length > 0
          return (
            <Link key={entry.slug} href={`/docs/${entry.slug}`} className="group block">
              <Card className="h-full rounded-2xl transition-colors group-hover:border-primary/50">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-start">
                      {isRoute ? (
                        <IconRoute className="size-4 shrink-0 text-primary" />
                      ) : (
                        <IconFileCode className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <CardTitle className="text-base leading-snug text-start">
                        {entry.title}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-mono text-[11px]">
                      {entry.role}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs text-start">
                    {entry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {entry.methods.map((m) => (
                      <Badge
                        key={m}
                        variant="outline"
                        className={`font-mono text-[11px] ${METHOD_BADGE_CLASS[m] ?? ""}`}
                      >
                        {m}
                      </Badge>
                    ))}
                    <code className="truncate rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
                      {entry.pathname}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate font-mono">{entry.relPath}</span>
                    {entry.errorCount > 0 && (
                      <span className="ms-2 flex shrink-0 items-center gap-1 text-destructive">
                        <IconAlertTriangle className="size-3.5" />
                        {entry.errorCount} error{entry.errorCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
