"use client"

import React, { useMemo, useState } from "react"
import {
  IconCheck,
  IconCopy,
  IconPlayerPlay,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import {
  buildCurlCommand,
  clearNetworkLogs,
  replayNetworkRequest,
  useDevLogs,
  type NetworkLogEntry,
} from "../dev-interceptors"

type StatusFilter = "all" | "ok" | "error"
type DetailTab = "response" | "request" | "headers"

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function StatusBadge({ entry }: { entry: NetworkLogEntry }) {
  if (entry.pending) {
    return (
      <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
        ...
      </span>
    )
  }
  const status = entry.status ?? 0
  const color =
    status >= 200 && status < 300
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
      : status >= 400 || status === 0
        ? "bg-rose-500/15 text-rose-400 border-rose-500/25"
        : "bg-amber-500/15 text-amber-400 border-amber-500/25"

  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
        color
      )}
    >
      {status === 0 ? "ERR" : status}
    </span>
  )
}

function MethodBadge({ method }: { method: string }) {
  const color =
    method === "GET"
      ? "text-sky-400"
      : method === "POST"
        ? "text-emerald-400"
        : method === "PUT" || method === "PATCH"
          ? "text-amber-400"
          : method === "DELETE"
            ? "text-rose-400"
            : "text-zinc-400"

  return (
    <span className={cn("w-11 shrink-0 font-mono text-[10px] font-bold", color)}>
      {method}
    </span>
  )
}

export function NetworkPanel() {
  const { network } = useDevLogs()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("response")
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [replaying, setReplaying] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return network.filter((entry) => {
      if (statusFilter === "ok" && (!entry.ok || entry.pending)) return false
      if (statusFilter === "error" && (entry.ok || entry.pending)) return false
      if (!q) return true
      return (
        entry.path.toLowerCase().includes(q) ||
        entry.method.toLowerCase().includes(q) ||
        String(entry.status ?? "").includes(q)
      )
    })
  }, [network, query, statusFilter])

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  )

  const handleCopyCurl = async () => {
    if (!selected) return
    await navigator.clipboard.writeText(buildCurlCommand(selected))
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 1500)
  }

  const handleReplay = async () => {
    if (!selected || replaying) return
    setReplaying(true)
    try {
      await replayNetworkRequest(selected)
    } catch {
      // Captured by interceptor
    } finally {
      setReplaying(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2">
        <div className="relative min-w-[160px] flex-1">
          <IconSearch className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter /elysia/* routes..."
            className="h-7 ps-8 pe-7 font-mono text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3" />
            </button>
          )}
        </div>

        <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
          {(["all", "ok", "error"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded px-2 py-0.5 font-mono capitalize transition-colors",
                statusFilter === f
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={clearNetworkLogs}
          aria-label="Clear network logs"
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <IconTrash className="size-3.5" />
          <span>Clear</span>
        </Button>
      </div>

      {/* Split View */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">
            No /elysia/* requests captured yet.
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            API calls made via Elysia will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border/70 md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Request List */}
          <div className="min-h-0 overflow-y-auto">
            {filtered.map((entry) => {
              const isSelected = selected?.id === entry.id
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className={cn(
                    "flex w-full items-center gap-2 border-b border-border/40 px-3 py-2 text-start transition-colors hover:bg-muted/50",
                    isSelected && "bg-muted/80"
                  )}
                >
                  <MethodBadge method={entry.method} />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground">
                    {entry.path}
                  </span>
                  <StatusBadge entry={entry} />
                  <span className="w-12 shrink-0 text-end font-mono text-[10px] text-muted-foreground">
                    {entry.durationMs !== null ? `${entry.durationMs}ms` : "..."}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Detail Inspector */}
          {selected && (
            <div className="flex min-h-0 flex-col bg-muted/10">
              <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5">
                <div className="flex items-center gap-1">
                  {(["response", "request", "headers"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDetailTab(t)}
                      className={cn(
                        "rounded px-2 py-1 font-mono text-[11px] capitalize transition-colors",
                        detailTab === t
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCopyCurl}
                    className="h-6 gap-1 px-1.5 font-mono text-[10px]"
                    aria-label="Copy as cURL"
                  >
                    {copiedCurl ? (
                      <IconCheck className="size-3 text-emerald-400" />
                    ) : (
                      <IconCopy className="size-3" />
                    )}
                    <span>cURL</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleReplay}
                    disabled={replaying}
                    className="h-6 gap-1 px-1.5 font-mono text-[10px]"
                    aria-label="Replay request"
                  >
                    <IconPlayerPlay className="size-3" />
                    <span>Replay</span>
                  </Button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                  <span className="truncate font-mono">{selected.url}</span>
                  <span className="shrink-0 font-mono">
                    {formatTime(selected.timestamp)}
                  </span>
                </div>

                {detailTab === "response" && (
                  <pre className="overflow-x-auto rounded-md border border-border/60 bg-background/70 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">
                    {selected.error
                      ? `Error: ${selected.error}`
                      : selected.responseBody || "(empty response body)"}
                  </pre>
                )}

                {detailTab === "request" && (
                  <pre className="overflow-x-auto rounded-md border border-border/60 bg-background/70 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">
                    {selected.requestBody || "(no request body)"}
                  </pre>
                )}

                {detailTab === "headers" && (
                  <div className="space-y-3 font-mono text-[11px]">
                    <div>
                      <div className="mb-1 font-semibold text-muted-foreground">
                        Response Headers
                      </div>
                      <pre className="overflow-x-auto rounded-md border border-border/60 bg-background/70 p-2 text-[10px] whitespace-pre-wrap">
                        {Object.keys(selected.responseHeaders).length > 0
                          ? JSON.stringify(selected.responseHeaders, null, 2)
                          : "(none)"}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-1 font-semibold text-muted-foreground">
                        Request Headers
                      </div>
                      <pre className="overflow-x-auto rounded-md border border-border/60 bg-background/70 p-2 text-[10px] whitespace-pre-wrap">
                        {Object.keys(selected.requestHeaders).length > 0
                          ? JSON.stringify(selected.requestHeaders, null, 2)
                          : "(none)"}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
