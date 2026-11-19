"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useParams, useSearchParams } from "next/navigation"
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconPlayerPlay,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useSession } from "@/context/session-context"
import { useUser } from "@/context/user-context"
import { useWebSocket } from "@/context/websocket-context"
import { ALL_APPS, isAppEnabled } from "@/config/enabled-apps"
import {
  collectReactComponents,
  safeSerialize,
  type HookKind,
  type InspectedComponent,
  type InspectedHook,
} from "../react-fiber-inspector"

type StateSubTab = "hooks" | "app"
type HookFilter = "all" | "state" | "memo" | "effect" | "ref"

function hookBadgeClass(kind: HookKind): string {
  switch (kind) {
    case "useState":
    case "useReducer":
      return "border-sky-500/30 bg-sky-500/15 text-sky-400"
    case "useMemo":
    case "useCallback":
      return "border-violet-500/30 bg-violet-500/15 text-violet-400"
    case "useEffect":
    case "useLayoutEffect":
      return "border-amber-500/30 bg-amber-500/15 text-amber-400"
    case "useRef":
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

function matchesHookFilter(hook: InspectedHook, filter: HookFilter): boolean {
  if (filter === "all") return true
  if (filter === "state") return hook.kind === "useState" || hook.kind === "useReducer"
  if (filter === "memo") return hook.kind === "useMemo" || hook.kind === "useCallback"
  if (filter === "effect")
    return hook.kind === "useEffect" || hook.kind === "useLayoutEffect"
  if (filter === "ref") return hook.kind === "useRef"
  return true
}

function HookRow({
  hook,
  onTriggered,
}: {
  hook: InspectedHook
  onTriggered: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [justTriggered, setJustTriggered] = useState(false)
  const isMultiline = hook.preview.includes("\n") || hook.preview.length > 80

  const handleTrigger = (e: React.MouseEvent) => {
    e.stopPropagation()
    hook.triggerEffect?.()
    setJustTriggered(true)
    setTimeout(() => setJustTriggered(false), 1200)
    onTriggered()
  }

  return (
    <div className="border-t border-border/40 px-3 py-1.5 font-mono text-[11px]">
      <div className="flex items-start justify-between gap-2">
        <div
          onClick={() => isMultiline && setExpanded((v) => !v)}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2",
            isMultiline && "cursor-pointer"
          )}
        >
          <span className="w-5 shrink-0 text-[10px] text-muted-foreground">
            #{hook.index}
          </span>
          <span
            className={cn(
              "shrink-0 rounded border px-1.5 py-0.2 text-[10px] font-semibold",
              hookBadgeClass(hook.kind)
            )}
          >
            {hook.kind}
          </span>
          {hook.varName && (
            <span className="shrink-0 font-semibold text-emerald-300">
              {hook.varName}
            </span>
          )}
          <span
            className={cn(
              "min-w-0 flex-1 break-all text-foreground/90",
              !expanded && "line-clamp-2"
            )}
          >
            {hook.preview}
          </span>
        </div>

        {hook.canTrigger && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleTrigger}
            className="h-6 shrink-0 gap-1 px-2 font-mono text-[10px] text-amber-400 hover:bg-amber-500/15 hover:text-amber-300"
            aria-label={`Trigger ${hook.kind} #${hook.index}`}
          >
            {justTriggered ? (
              <>
                <IconCheck className="size-3 text-emerald-400" />
                <span className="text-emerald-400">Ran</span>
              </>
            ) : (
              <>
                <IconPlayerPlay className="size-3" />
                <span>Run</span>
              </>
            )}
          </Button>
        )}
      </div>

      {expanded && isMultiline && (
        <pre className="mt-1.5 max-h-52 overflow-auto rounded border border-border/60 bg-background/80 p-2 text-[10px] leading-relaxed whitespace-pre-wrap text-foreground">
          {hook.preview}
        </pre>
      )}
    </div>
  )
}

function ComponentHookCard({
  comp,
  hookFilter,
  onRefresh,
}: {
  comp: InspectedComponent
  hookFilter: HookFilter
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showProps, setShowProps] = useState(false)

  const visibleHooks = useMemo(
    () => comp.hooks.filter((h) => matchesHookFilter(h, hookFilter)),
    [comp.hooks, hookFilter]
  )

  if (visibleHooks.length === 0) return null

  const stateCount = visibleHooks.filter(
    (h) => h.kind === "useState" || h.kind === "useReducer"
  ).length
  const memoCount = visibleHooks.filter(
    (h) => h.kind === "useMemo" || h.kind === "useCallback"
  ).length
  const effectCount = visibleHooks.filter(
    (h) => h.kind === "useEffect" || h.kind === "useLayoutEffect"
  ).length

  return (
    <div className="rounded-lg border border-border/70 bg-muted/20">
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-2">
          {open ? (
            <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-mono text-xs font-semibold text-foreground">
            &lt;{comp.name} /&gt;
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
          {stateCount > 0 && (
            <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-400">
              {stateCount} state
            </span>
          )}
          {memoCount > 0 && (
            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-400">
              {memoCount} memo
            </span>
          )}
          {effectCount > 0 && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-400">
              {effectCount} effect
            </span>
          )}
        </div>
      </div>

      {open && (
        <div>
          {Object.keys(comp.propsPreview).length > 0 && (
            <div className="border-t border-border/40 px-3 py-1">
              <button
                type="button"
                onClick={() => setShowProps((v) => !v)}
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground"
              >
                {showProps ? "Hide props" : `Show props (${Object.keys(comp.propsPreview).length})`}
              </button>
              {showProps && (
                <pre className="mt-1 max-h-40 overflow-auto rounded border border-border/60 bg-background/80 p-2 font-mono text-[10px] whitespace-pre-wrap">
                  {safeSerialize(comp.propsPreview)}
                </pre>
              )}
            </div>
          )}

          {visibleHooks.map((hook) => (
            <HookRow
              key={`${comp.id}-${hook.index}`}
              hook={hook}
              onTriggered={() => setTimeout(onRefresh, 60)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function JsonSection({
  title,
  badge,
  data,
  defaultOpen = false,
  action,
}: {
  title: string
  badge?: React.ReactNode
  data: unknown
  defaultOpen?: boolean
  action?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)

  const json = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="rounded-lg border border-border/70 bg-muted/20">
      <div
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40"
      >
        <div className="flex min-w-0 items-center gap-2">
          {open ? (
            <IconChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="font-mono text-xs font-semibold text-foreground">
            {title}
          </span>
          {badge}
        </div>
        <div className="flex items-center gap-1">
          {action}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Copy JSON"
          >
            {copied ? (
              <IconCheck className="size-3.5 text-emerald-400" />
            ) : (
              <IconCopy className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <pre className="max-h-64 overflow-auto border-t border-border/60 bg-background/70 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground">
          {json}
        </pre>
      )}
    </div>
  )
}

export function StatePanel() {
  const [subTab, setSubTab] = useState<StateSubTab>("hooks")
  const [components, setComponents] = useState<InspectedComponent[]>([])
  const [query, setQuery] = useState("")
  const [hookFilter, setHookFilter] = useState<HookFilter>("all")

  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const { data: session, status: authStatus, update: updateSession } = useSession()
  const { user, refetchUser } = useUser()
  const ws = useWebSocket()

  const refreshTree = useCallback(() => {
    setComponents(collectReactComponents())
  }, [])

  useEffect(() => {
    if (subTab === "hooks") {
      refreshTree()
    }
  }, [subTab, pathname, refreshTree])

  const filteredComponents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return components.filter((c) => {
      const hasMatchingHook = c.hooks.some((h) =>
        matchesHookFilter(h, hookFilter)
      )
      if (!hasMatchingHook) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.hooks.some(
          (h) =>
            h.preview.toLowerCase().includes(q) ||
            (h.varName?.toLowerCase().includes(q) ?? false)
        )
      )
    })
  }, [components, query, hookFilter])

  const routeInfo = {
    pathname,
    params,
    searchParams: Object.fromEntries(searchParams.entries()),
    origin: typeof window !== "undefined" ? window.location.origin : "",
    apiUrl:
      typeof window !== "undefined"
        ? (window as unknown as { __IRIS_API_URL__?: string }).__IRIS_API_URL__
        : undefined,
  }

  const appsStatus = ALL_APPS.map((id) => ({
    id,
    enabled: isAppEnabled(id),
  }))

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sub-tab bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
        <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setSubTab("hooks")}
            className={cn(
              "rounded px-2.5 py-0.5 font-mono transition-colors",
              subTab === "hooks"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            React Hooks ({components.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("app")}
            className={cn(
              "rounded px-2.5 py-0.5 font-mono transition-colors",
              subTab === "app"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            App &amp; Auth
          </button>
        </div>

        {subTab === "hooks" && (
          <Button
            variant="ghost"
            size="xs"
            onClick={refreshTree}
            className="h-7 gap-1 px-2 font-mono text-xs text-muted-foreground hover:text-foreground"
            aria-label="Refresh React fiber tree"
          >
            <IconRefresh className="size-3.5" />
            <span>Refresh</span>
          </Button>
        )}
      </div>

      {subTab === "hooks" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Hook Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
            <div className="relative min-w-[150px] flex-1">
              <IconSearch className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter components or values..."
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
              {(["all", "state", "memo", "effect", "ref"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setHookFilter(f)}
                  className={cn(
                    "rounded px-2 py-0.5 font-mono capitalize transition-colors",
                    hookFilter === f
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Component List */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {filteredComponents.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center font-mono text-xs text-muted-foreground">
                <p>No matching React components with hooks found.</p>
                <p className="text-[11px] opacity-70">
                  Click Refresh after interacting with the page.
                </p>
              </div>
            ) : (
              filteredComponents.map((comp) => (
                <ComponentHookCard
                  key={comp.id}
                  comp={comp}
                  hookFilter={hookFilter}
                  onRefresh={refreshTree}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {/* Quick Status Strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                Auth Status
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs font-semibold">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    authStatus === "authenticated"
                      ? "bg-emerald-500"
                      : authStatus === "loading"
                        ? "bg-amber-500"
                        : "bg-zinc-500"
                  )}
                />
                <span>{authStatus}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                WebSocket
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-1 font-mono text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      ws.isConnected ? "bg-emerald-500" : "bg-rose-500"
                    )}
                  />
                  <span>{ws.isConnected ? "Connected" : "Disconnected"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => ws.reconnect()}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Reconnect WebSocket"
                >
                  <IconRefresh className="size-3" />
                </button>
              </div>
            </div>

            <div className="col-span-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 sm:col-span-1">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                User
              </div>
              <div className="mt-0.5 truncate font-mono text-xs font-semibold">
                {user?.username ||
                  (session?.user as { username?: string })?.username ||
                  "Guest"}
              </div>
            </div>
          </div>

          {/* Enabled Apps Pills */}
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="mb-2 font-mono text-xs font-semibold text-foreground">
              Enabled Apps
            </div>
            <div className="flex flex-wrap gap-1.5">
              {appsStatus.map((app) => (
                <span
                  key={app.id}
                  className={cn(
                    "rounded border px-2 py-0.5 font-mono text-[10px]",
                    app.enabled
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-muted/40 text-muted-foreground line-through"
                  )}
                >
                  {app.id}
                </span>
              ))}
            </div>
          </div>

          <JsonSection
            title="Route & Environment"
            data={routeInfo}
            defaultOpen={true}
          />

          <JsonSection
            title="Session"
            badge={
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {authStatus}
              </span>
            }
            data={session}
            action={
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  void updateSession()
                }}
                className="h-6 px-1.5 font-mono text-[10px]"
                aria-label="Refresh session"
              >
                <IconRefresh className="size-3" />
              </Button>
            }
          />

          <JsonSection
            title="User Context"
            data={user}
            action={
              <Button
                variant="ghost"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  void refetchUser()
                }}
                className="h-6 px-1.5 font-mono text-[10px]"
                aria-label="Refresh user"
              >
                <IconRefresh className="size-3" />
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
