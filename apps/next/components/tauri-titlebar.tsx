"use client"

import React, { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  IconActivity,
  IconArrowLeft,
  IconArrowRight,
  IconCopy,
  IconMinus,
  IconPlayerPause,
  IconPlayerPlay,
  IconSquare,
  IconX,
} from "@tabler/icons-react"
import { GlassCard } from "@NamelessLiberty/borealis"
import { cn } from "@workspace/ui/lib/utils"

interface TauriWindowHandle {
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
}

interface TauriGlobal {
  core?: {
    invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>
  }
  event?: {
    listen?: <T = unknown>(
      event: string,
      handler: (event: { payload: T }) => void
    ) => Promise<() => void>
  }
  window?: {
    getCurrentWindow?: () => TauriWindowHandle
  }
}

interface TrackedEntry {
  mediaType: string
  mediaId: number
  title: string
  executables: string[]
  accumulatedSeconds: number
  pendingSyncHours: number
  isPaused: boolean
  isRunning: boolean
}

interface TrackerHourPayload {
  mediaType: string
  mediaId: number
  pendingSyncHours: number
}

async function syncPendingEntryHours(
  mediaType: string,
  mediaId: number,
  count: number
): Promise<void> {
  const invoke = getTauri()?.core?.invoke
  if (!invoke || count <= 0 || !mediaId) return

  const segment = mediaType === "other" ? "other" : "games"
  const res = await fetch(`/elysia/borealis/lists/${segment}/${mediaId}/increment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count }),
  })

  if (res.ok) {
    await invoke("tracker_ack_synced_hours", { mediaType, mediaId, count })
  }
}

const KNOWN_APPS = new Set([
  "akaromi",
  "borealis",
  "carina",
  "kiroshi",
  "reliquary",
  "runa",
  "tesseract",
])

function resolveActiveAppId(pathname: string | null): string {
  const segment = pathname?.split("/").filter(Boolean)[0]?.toLowerCase()
  if (segment && KNOWN_APPS.has(segment)) {
    return segment
  }
  return "default"
}

function getTauri(): TauriGlobal | null {
  if (typeof window === "undefined") return null
  return (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__ ?? null
}

function getTauriWindow(): TauriWindowHandle | null {
  return getTauri()?.window?.getCurrentWindow?.() ?? null
}

function formatDuration(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(clamped / 60)
  const secs = clamped % 60
  return `${mins}m ${secs.toString().padStart(2, "0")}s`
}

export function TauriTitlebar(): React.JSX.Element | null {
  const [isTauri, setIsTauri] = useState(false)
  const [isDesktopTauri, setIsDesktopTauri] = useState(false)
  const [pageTitle, setPageTitle] = useState("NamelessLiberty")
  const [isMaximized, setIsMaximized] = useState(false)
  const [globalPaused, setGlobalPaused] = useState(false)
  const [trackedEntries, setTrackedEntries] = useState<TrackedEntry[]>([])
  const [trackerOpen, setTrackerOpen] = useState(false)
  const [navState, setNavState] = useState({ index: 0, maxIndex: 0 })
  const navActionRef = useRef<"back" | "forward" | null>(null)
  const lastPathRef = useRef<string | null>(null)
  const trackerContainerRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const activeAppId = resolveActiveAppId(pathname)
  const isBorealis = activeAppId === "borealis"

  useEffect(() => {
    const win = getTauriWindow()
    if (!win) return

    const isMobilePlatform = /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    )
    setIsTauri(true)
    setIsDesktopTauri(!isMobilePlatform)

    if (isMobilePlatform) {
      document.documentElement.classList.add("tauri-mobile")
      return () => {
        document.documentElement.classList.remove("tauri-mobile")
      }
    }

    document.documentElement.classList.add("tauri-shell")

    win
      .isMaximized()
      .then(setIsMaximized)
      .catch(() => {})

    const handleResize = () => {
      win
        .isMaximized()
        .then(setIsMaximized)
        .catch(() => {})
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      document.documentElement.classList.remove("tauri-shell")
    }
  }, [])

  // Sync desktop titlebar text with document.title
  useEffect(() => {
    if (!isDesktopTauri) return

    const syncTitle = () => {
      const next = document.title?.trim()
      setPageTitle(next || "NamelessLiberty")
    }

    syncTitle()
    const titleEl = document.querySelector("title")
    if (!titleEl) return

    const observer = new MutationObserver(syncTitle)
    observer.observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [isDesktopTauri, pathname])

  // Track route history index for accurate Back / Forward disabled state
  useEffect(() => {
    if (!isTauri) return
    if (lastPathRef.current === null) {
      lastPathRef.current = pathname
      return
    }
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    const action = navActionRef.current
    navActionRef.current = null

    setNavState((prev) => {
      if (action === "back") {
        return { ...prev, index: Math.max(0, prev.index - 1) }
      }
      if (action === "forward") {
        return { ...prev, index: Math.min(prev.maxIndex, prev.index + 1) }
      }
      const nextIndex = prev.index + 1
      return { index: nextIndex, maxIndex: nextIndex }
    })
  }, [isTauri, pathname])

  useEffect(() => {
    if (!isTauri) return
    const invoke = getTauri()?.core?.invoke
    if (!invoke) return
    invoke("set_active_app", { appId: activeAppId }).catch(() => {})
  }, [isTauri, activeAppId])

  useEffect(() => {
    if (!isBorealis) {
      setTrackerOpen(false)
    }
  }, [isBorealis])

  // Close tracker popover on outside click or Escape
  useEffect(() => {
    if (!trackerOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      if (
        trackerContainerRef.current &&
        !trackerContainerRef.current.contains(e.target as Node)
      ) {
        setTrackerOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTrackerOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [trackerOpen])

  useEffect(() => {
    if (!isTauri) return
    const tauri = getTauri()
    const invoke = tauri?.core?.invoke
    const listen = tauri?.event?.listen
    if (!invoke) return

    invoke<boolean>("tracker_get_global_paused")
      .then(setGlobalPaused)
      .catch(() => {})

    invoke<TrackedEntry[]>("tracker_get_all")
      .then((list) => setTrackedEntries(list ?? []))
      .catch(() => {})

    const flushAllPending = async () => {
      try {
        const entries = await invoke<TrackedEntry[]>("tracker_get_all")
        if (entries) setTrackedEntries(entries)
        for (const entry of entries ?? []) {
          if (entry.pendingSyncHours > 0) {
            await syncPendingEntryHours(
              entry.mediaType,
              entry.mediaId,
              entry.pendingSyncHours
            ).catch(() => {})
          }
        }
      } catch {
        // Ignore if offline or unauthenticated
      }
    }

    void flushAllPending()
    const retryTimer = window.setInterval(() => void flushAllPending(), 30_000)

    let unlistenHour: (() => void) | undefined
    let unlistenState: (() => void) | undefined
    let unlistenGlobalPause: (() => void) | undefined
    if (listen) {
      void listen<TrackerHourPayload>("tracker-hour-ready", (ev) => {
        const { mediaType, mediaId, pendingSyncHours } = ev.payload
        void syncPendingEntryHours(mediaType, mediaId, pendingSyncHours).catch(() => {})
      }).then((fn) => {
        unlistenHour = fn
      })

      void listen<TrackedEntry[]>("tracker-state", (ev) => {
        setTrackedEntries(ev.payload ?? [])
      }).then((fn) => {
        unlistenState = fn
      })

      void listen<boolean>("tracker-global-paused", (ev) => {
        setGlobalPaused(Boolean(ev.payload))
      }).then((fn) => {
        unlistenGlobalPause = fn
      })
    }

    return () => {
      window.clearInterval(retryTimer)
      unlistenHour?.()
      unlistenState?.()
      unlistenGlobalPause?.()
    }
  }, [isTauri])

  if (!isTauri || !isDesktopTauri) return null

  const win = getTauriWindow()
  const canGoBack = navState.index > 0
  const canGoForward = navState.index < navState.maxIndex
  const hasActiveTracking =
    !globalPaused && trackedEntries.some((e) => e.isRunning && !e.isPaused)

  const handleBack = () => {
    if (!canGoBack) return
    navActionRef.current = "back"
    window.history.back()
  }

  const handleForward = () => {
    if (!canGoForward) return
    navActionRef.current = "forward"
    window.history.forward()
  }

  const handleToggleGlobalPause = () => {
    const invoke = getTauri()?.core?.invoke
    if (!invoke) return
    invoke<boolean>("tracker_toggle_global_pause")
      .then(setGlobalPaused)
      .catch(() => {})
  }

  const handleToggleEntryPause = (entry: TrackedEntry) => {
    const invoke = getTauri()?.core?.invoke
    if (!invoke) return
    invoke<TrackedEntry>("tracker_toggle_pause", {
      mediaType: entry.mediaType,
      mediaId: entry.mediaId,
      title: entry.title,
    })
      .then((updated) => {
        setTrackedEntries((prev) =>
          prev.map((item) =>
            item.mediaType === updated.mediaType && item.mediaId === updated.mediaId
              ? updated
              : item
          )
        )
      })
      .catch(() => {})
  }

  return (
    <header className="sticky top-0 z-50 flex h-9 w-full shrink-0 select-none items-center justify-between border-b border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="flex h-full items-center">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={handleBack}
          title="Back"
          aria-label="Back"
          className="inline-flex h-full w-9 items-center justify-center transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <IconArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={handleForward}
          title="Forward"
          aria-label="Forward"
          className="inline-flex h-full w-9 items-center justify-center transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <IconArrowRight className="size-4" />
        </button>
      </div>

      <div
        data-tauri-drag-region
        className="flex h-full flex-1 items-center justify-center truncate px-2 text-xs font-medium text-zinc-400"
      >
        {pageTitle}
      </div>

      <div className="flex h-full items-center">
        {isBorealis && (
          <div ref={trackerContainerRef} className="relative flex h-full items-center">
            <button
              type="button"
              onClick={() => setTrackerOpen((prev) => !prev)}
              title="Tracking"
              aria-label="Tracking"
              className={cn(
                "relative inline-flex h-full w-9 items-center justify-center transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer",
                trackerOpen && "bg-zinc-800 text-zinc-100",
                globalPaused && "text-amber-400",
                hasActiveTracking && "text-emerald-400"
              )}
            >
              <IconActivity className="size-4" />
            </button>

            {trackerOpen && (
              <GlassCard
                variant="tinted"
                className="absolute top-10 end-1 z-50 w-80 p-3 text-xs"
              >
                <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
                    <IconActivity className="size-3.5 text-primary" />
                    <span>Tracking</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleGlobalPause}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                      globalPaused
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                        : "border-white/15 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    )}
                  >
                    {globalPaused ? (
                      <>
                        <IconPlayerPlay className="size-3" />
                        <span>Resume All</span>
                      </>
                    ) : (
                      <>
                        <IconPlayerPause className="size-3" />
                        <span>Pause All</span>
                      </>
                    )}
                  </button>
                </div>

                {trackedEntries.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-zinc-400">
                    No tracked games or apps yet. Link a process from any game&apos;s hover card.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto pe-0.5">
                    {trackedEntries.map((entry) => {
                      const paused = globalPaused || entry.isPaused
                      const pct = Math.min(
                        100,
                        Math.round((entry.accumulatedSeconds / 3600) * 100)
                      )
                      const statusLabel = paused
                        ? "PAUSED"
                        : entry.isRunning
                          ? "TRACKING"
                          : "STOPPED"

                      return (
                        <div
                          key={`${entry.mediaType}-${entry.mediaId}`}
                          className="rounded-xl border border-white/10 bg-zinc-950/50 p-2.5"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="truncate font-medium text-zinc-100">
                              {entry.title || `#${entry.mediaId}`}
                            </span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span
                                className={cn(
                                  "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                                  paused
                                    ? "border-amber-500/40 bg-amber-500/15 text-amber-400"
                                    : entry.isRunning
                                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                                      : "border-zinc-700 bg-zinc-800/70 text-zinc-400"
                                )}
                              >
                                {statusLabel}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleEntryPause(entry)}
                                title={entry.isPaused ? "Resume" : "Pause"}
                                aria-label={entry.isPaused ? "Resume" : "Pause"}
                                className="inline-flex size-6 items-center justify-center rounded-md border border-white/10 bg-zinc-900/80 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer"
                              >
                                {entry.isPaused ? (
                                  <IconPlayerPlay className="size-3" />
                                ) : (
                                  <IconPlayerPause className="size-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="font-mono">
                              {formatDuration(entry.accumulatedSeconds)} / 60m ({pct}%)
                            </span>
                            {entry.pendingSyncHours > 0 && (
                              <span className="text-primary">
                                +{entry.pendingSyncHours}h queued
                              </span>
                            )}
                          </div>

                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                paused ? "bg-amber-500/80" : "bg-primary"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => void win?.minimize()}
          title="Minimize"
          aria-label="Minimize"
          className="inline-flex h-full w-10 items-center justify-center transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          <IconMinus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => void win?.toggleMaximize()}
          title={isMaximized ? "Restore" : "Maximize"}
          aria-label={isMaximized ? "Restore" : "Maximize"}
          className="inline-flex h-full w-10 items-center justify-center transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          {isMaximized ? (
            <IconCopy className="size-3.5" />
          ) : (
            <IconSquare className="size-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => void win?.close()}
          title="Close"
          aria-label="Close"
          className="inline-flex h-full w-10 items-center justify-center transition-colors hover:bg-red-600 hover:text-white"
        >
          <IconX className="size-4" />
        </button>
      </div>
    </header>
  )
}
