"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconCpu,
  IconDatabase,
  IconLayoutDashboard,
  IconMaximize,
  IconMinimize,
  IconNetwork,
  IconSeo,
  IconTerminal2,
  IconTool,
  IconX,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import { initDevInterceptors, useDevLogs } from "./dev-interceptors"
import { usePageMetadata } from "./use-page-metadata"
import { NetworkPanel } from "./panels/network-panel"
import { ConsolePanel } from "./panels/console-panel"
import { StatePanel } from "./panels/state-panel"
import { StoragePanel } from "./panels/storage-panel"
import { InspectorPanel } from "./panels/inspector-panel"
import { SeoPanel } from "./panels/seo-panel"

if (typeof window !== "undefined") {
  initDevInterceptors()
}

type DevToolTab =
  | "network"
  | "console"
  | "state"
  | "storage"
  | "inspector"
  | "seo"

interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

interface CirclePos {
  x: number
  y: number
}

const STORAGE_KEY_STATE = "iris_devtools_layout_v1"
const MIN_WIDTH = 420
const MIN_HEIGHT = 340
const CIRCLE_SIZE = 44

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function getDefaultCirclePos(): CirclePos {
  if (typeof window === "undefined") return { x: 24, y: 24 }
  return {
    x: Math.max(16, window.innerWidth - CIRCLE_SIZE - 20),
    y: Math.max(16, window.innerHeight - CIRCLE_SIZE - 20),
  }
}

function getDefaultWindowRect(): WindowRect {
  if (typeof window === "undefined") {
    return { x: 80, y: 80, width: 820, height: 520 }
  }
  const width = Math.min(860, Math.max(MIN_WIDTH, window.innerWidth - 48))
  const height = Math.min(560, Math.max(MIN_HEIGHT, window.innerHeight - 64))
  return {
    x: Math.max(16, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(16, Math.round((window.innerHeight - height) / 2)),
    width,
    height,
  }
}

export function IrisDevTools() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [activeTab, setActiveTab] = useState<DevToolTab>("network")
  const [circlePos, setCirclePos] = useState<CirclePos>(getDefaultCirclePos)
  const [winRect, setWinRect] = useState<WindowRect>(getDefaultWindowRect)
  const [hydrated, setHydrated] = useState(false)

  const { network, console: consoleLogs } = useDevLogs()
  const { metadata, diagnostics, warnCount, refresh } =
    usePageMetadata()

  // Ensure interceptors are initialized
  useEffect(() => {
    initDevInterceptors()
  }, [])

  // Load persisted layout
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATE)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.circlePos) {
          setCirclePos({
            x: clamp(parsed.circlePos.x, 8, window.innerWidth - CIRCLE_SIZE - 8),
            y: clamp(parsed.circlePos.y, 8, window.innerHeight - CIRCLE_SIZE - 8),
          })
        }
        if (parsed.winRect) {
          const w = clamp(parsed.winRect.width, MIN_WIDTH, window.innerWidth - 16)
          const h = clamp(parsed.winRect.height, MIN_HEIGHT, window.innerHeight - 16)
          setWinRect({
            x: clamp(parsed.winRect.x, 8, window.innerWidth - w - 8),
            y: clamp(parsed.winRect.y, 8, window.innerHeight - h - 8),
            width: w,
            height: h,
          })
        }
        if (parsed.activeTab) {
          setActiveTab(parsed.activeTab)
        }
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true)
  }, [])

  // Persist layout
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(
        STORAGE_KEY_STATE,
        JSON.stringify({ circlePos, winRect, activeTab })
      )
    } catch {
      // ignore
    }
  }, [hydrated, circlePos, winRect, activeTab])

  // Keyboard shortcut: Ctrl+Shift+D / Cmd+Shift+D
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  // Keep positions inside viewport on resize
  useEffect(() => {
    const onResize = () => {
      setCirclePos((prev) => ({
        x: clamp(prev.x, 8, window.innerWidth - CIRCLE_SIZE - 8),
        y: clamp(prev.y, 8, window.innerHeight - CIRCLE_SIZE - 8),
      }))
      setWinRect((prev) => {
        const width = clamp(prev.width, MIN_WIDTH, window.innerWidth - 16)
        const height = clamp(prev.height, MIN_HEIGHT, window.innerHeight - 16)
        return {
          width,
          height,
          x: clamp(prev.x, 8, window.innerWidth - width - 8),
          y: clamp(prev.y, 8, window.innerHeight - height - 8),
        }
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  // Dragging floating circle
  const circleDragRef = useRef<{
    startX: number
    startY: number
    origX: number
    origY: number
    moved: boolean
  } | null>(null)

  const onCirclePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      circleDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: circlePos.x,
        origY: circlePos.y,
        moved: false,
      }

      const onMove = (ev: PointerEvent) => {
        const drag = circleDragRef.current
        if (!drag) return
        const dx = ev.clientX - drag.startX
        const dy = ev.clientY - drag.startY
        if (Math.hypot(dx, dy) >= 5) {
          drag.moved = true
        }
        if (drag.moved) {
          setCirclePos({
            x: clamp(drag.origX + dx, 8, window.innerWidth - CIRCLE_SIZE - 8),
            y: clamp(drag.origY + dy, 8, window.innerHeight - CIRCLE_SIZE - 8),
          })
        }
      }

      const onUp = () => {
        const drag = circleDragRef.current
        circleDragRef.current = null
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
        if (drag && !drag.moved) {
          setIsOpen(true)
        }
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [circlePos.x, circlePos.y]
  )

  // Dragging floating window by titlebar
  const onTitlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || isMaximized) return
      if ((e.target as HTMLElement).closest("button")) return
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const origX = winRect.x
      const origY = winRect.y

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        setWinRect((prev) => ({
          ...prev,
          x: clamp(origX + dx, 8, window.innerWidth - prev.width - 8),
          y: clamp(origY + dy, 8, window.innerHeight - prev.height - 8),
        }))
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [isMaximized, winRect.x, winRect.y]
  )

  // Resizing floating window from bottom-right handle
  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || isMaximized) return
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startY = e.clientY
      const origW = winRect.width
      const origH = winRect.height

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        setWinRect((prev) => ({
          ...prev,
          width: clamp(origW + dx, MIN_WIDTH, window.innerWidth - prev.x - 8),
          height: clamp(origH + dy, MIN_HEIGHT, window.innerHeight - prev.y - 8),
        }))
      }

      const onUp = () => {
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }

      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [isMaximized, winRect.width, winRect.height]
  )

  const errorCount = useMemo(
    () => consoleLogs.filter((l) => l.level === "error").length,
    [consoleLogs]
  )
  const failedNetCount = useMemo(
    () => network.filter((n) => !n.pending && !n.ok).length,
    [network]
  )
  const totalErrors = errorCount + failedNetCount

  const tabs: Array<{
    id: DevToolTab
    label: string
    icon: React.ReactNode
    badge?: number
    badgeTone?: "rose" | "amber" | "zinc"
  }> = [
    {
      id: "network",
      label: "Network",
      icon: <IconNetwork className="size-3.5" />,
      badge: failedNetCount > 0 ? failedNetCount : network.length || undefined,
      badgeTone: failedNetCount > 0 ? "rose" : "zinc",
    },
    {
      id: "console",
      label: "Console",
      icon: <IconTerminal2 className="size-3.5" />,
      badge: errorCount > 0 ? errorCount : undefined,
      badgeTone: "rose",
    },
    {
      id: "state",
      label: "State",
      icon: <IconCpu className="size-3.5" />,
    },
    {
      id: "storage",
      label: "Storage",
      icon: <IconDatabase className="size-3.5" />,
    },
    {
      id: "inspector",
      label: "Inspector",
      icon: <IconLayoutDashboard className="size-3.5" />,
    },
    {
      id: "seo",
      label: "SEO",
      icon: <IconSeo className="size-3.5" />,
      badge: warnCount > 0 ? warnCount : undefined,
      badgeTone: "amber",
    },
  ]

  if (!hydrated) return null

  return (
    <div data-iris-devtools="root">
      {/* Floating Circle Trigger */}
      {!isOpen && (
        <button
          type="button"
          onPointerDown={onCirclePointerDown}
          style={{ left: circlePos.x, top: circlePos.y }}
          className="fixed z-50 flex size-11 cursor-grab items-center justify-center rounded-full border border-zinc-700/80 bg-zinc-950/90 text-zinc-100 shadow-xl backdrop-blur-md transition-transform hover:scale-105 hover:border-zinc-500 active:cursor-grabbing active:scale-95"
          title="Open IRIS DevTools (Ctrl+Shift+D) — Drag to move"
          aria-label="Open IRIS DevTools"
        >
          <IconTool className="size-5 text-zinc-200" />
          {totalErrors > 0 ? (
            <span className="absolute -end-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow">
              {totalErrors > 99 ? "99+" : totalErrors}
            </span>
          ) : warnCount > 0 ? (
            <span className="absolute -end-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-black shadow">
              {warnCount}
            </span>
          ) : (
            <span className="absolute end-0.5 top-0.5 size-2.5 rounded-full border border-zinc-950 bg-emerald-500" />
          )}
        </button>
      )}

      {/* Floating DevTools Window */}
      {isOpen && (
        <div
          style={
            isMaximized
              ? { left: 12, top: 12, width: "calc(100vw - 24px)", height: "calc(100vh - 24px)" }
              : {
                  left: winRect.x,
                  top: winRect.y,
                  width: winRect.width,
                  height: winRect.height,
                }
          }
          className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-background/98 shadow-2xl backdrop-blur-xl"
        >
          {/* Draggable Titlebar */}
          <div
            onPointerDown={onTitlePointerDown}
            className={cn(
              "flex items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3 py-2 select-none",
              !isMaximized && "cursor-move"
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200">
                <IconTool className="size-3.5" />
              </div>
              <span className="truncate font-mono text-xs font-semibold text-foreground">
                IRIS DevTools
              </span>
              <span className="rounded border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-zinc-300 uppercase">
                DEV
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMaximized((v) => !v)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title={isMaximized ? "Restore window" : "Maximize window"}
              >
                {isMaximized ? (
                  <IconMinimize className="size-3.5" />
                ) : (
                  <IconMaximize className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Close DevTools (Ctrl+Shift+D)"
              >
                <IconX className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border/70 bg-muted/15 px-2 py-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                  activeTab === tab.id
                    ? "bg-background font-semibold text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "rounded px-1 py-0.2 text-[9px] font-bold",
                      tab.badgeTone === "rose"
                        ? "bg-rose-500/20 text-rose-400"
                        : tab.badgeTone === "amber"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Panel Body */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "network" && <NetworkPanel />}
            {activeTab === "console" && <ConsolePanel />}
            {activeTab === "state" && <StatePanel />}
            {activeTab === "storage" && <StoragePanel />}
            {activeTab === "inspector" && <InspectorPanel />}
            {activeTab === "seo" && (
              <SeoPanel
                metadata={metadata}
                diagnostics={diagnostics}
                warnCount={warnCount}
                refresh={refresh}
              />
            )}
          </div>

          {/* Resize Handle (bottom-right) */}
          {!isMaximized && (
            <div
              onPointerDown={onResizePointerDown}
              className="absolute bottom-0 end-0 size-4 cursor-nwse-resize"
              title="Drag to resize"
            >
              <svg
                viewBox="0 0 12 12"
                className="size-full p-0.5 text-muted-foreground/60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M10 4L4 10M10 8L8 10" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
