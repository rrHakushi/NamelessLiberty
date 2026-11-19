"use client"

import React, { useMemo, useState } from "react"
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconSearch,
  IconTerminal,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import {
  clearConsoleLogs,
  useDevLogs,
  type ConsoleLevel,
  type ConsoleLogEntry,
} from "../dev-interceptors"

type LevelFilter = "all" | ConsoleLevel

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function LevelIcon({ level }: { level: ConsoleLevel }) {
  switch (level) {
    case "error":
      return <IconAlertCircle className="size-3.5 shrink-0 text-rose-400" />
    case "warn":
      return <IconAlertTriangle className="size-3.5 shrink-0 text-amber-400" />
    case "info":
      return <IconInfoCircle className="size-3.5 shrink-0 text-sky-400" />
    default:
      return <IconTerminal className="size-3.5 shrink-0 text-muted-foreground" />
  }
}

function ConsoleRow({ entry }: { entry: ConsoleLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const hasDetails = entry.args.length > 1 || Boolean(entry.stack)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const payload = [entry.args.join(" "), entry.stack].filter(Boolean).join("\n")
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div
      className={cn(
        "border-b border-border/50 px-3 py-2 font-mono text-[11px]",
        entry.level === "error" && "bg-rose-500/5",
        entry.level === "warn" && "bg-amber-500/5"
      )}
    >
      <div
        onClick={() => hasDetails && setExpanded((v) => !v)}
        className={cn(
          "flex items-start gap-2",
          hasDetails && "cursor-pointer"
        )}
      >
        <div className="mt-0.5">
          <LevelIcon level={entry.level} />
        </div>
        <div className="min-w-0 flex-1 break-words whitespace-pre-wrap text-foreground">
          {entry.message || "(empty)"}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {formatTime(entry.timestamp)}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Copy log"
        >
          {copied ? (
            <IconCheck className="size-3 text-emerald-400" />
          ) : (
            <IconCopy className="size-3" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 ps-5">
          {entry.args.length > 1 && (
            <pre className="overflow-x-auto rounded border border-border/60 bg-background/70 p-2 text-[10px] whitespace-pre-wrap text-muted-foreground">
              {entry.args.slice(1).join("\n")}
            </pre>
          )}
          {entry.stack && (
            <pre className="overflow-x-auto rounded border border-rose-500/20 bg-rose-500/5 p-2 text-[10px] whitespace-pre-wrap text-rose-300">
              {entry.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export function ConsolePanel() {
  const { console: logs } = useDevLogs()
  const [query, setQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all")

  const counts = useMemo(() => {
    let error = 0
    let warn = 0
    for (const l of logs) {
      if (l.level === "error") error++
      else if (l.level === "warn") warn++
    }
    return { error, warn }
  }, [logs])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((entry) => {
      if (levelFilter !== "all" && entry.level !== levelFilter) return false
      if (!q) return true
      return (
        entry.message.toLowerCase().includes(q) ||
        entry.args.some((a) => a.toLowerCase().includes(q)) ||
        (entry.stack?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [logs, query, levelFilter])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2">
        <div className="relative min-w-[160px] flex-1">
          <IconSearch className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter console logs..."
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
          {(["all", "error", "warn", "info", "log"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 font-mono capitalize transition-colors",
                levelFilter === lvl
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{lvl}</span>
              {lvl === "error" && counts.error > 0 && (
                <span className="rounded bg-rose-500/20 px-1 text-[9px] text-rose-400">
                  {counts.error}
                </span>
              )}
              {lvl === "warn" && counts.warn > 0 && (
                <span className="rounded bg-amber-500/20 px-1 text-[9px] text-amber-400">
                  {counts.warn}
                </span>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={clearConsoleLogs}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <IconTrash className="size-3.5" />
          <span>Clear</span>
        </Button>
      </div>

      {/* Log List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              No console output matching filter.
            </p>
          </div>
        ) : (
          filtered.map((entry) => <ConsoleRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}
