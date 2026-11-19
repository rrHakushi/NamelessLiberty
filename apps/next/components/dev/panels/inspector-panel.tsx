"use client"

import React, { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  IconBorderAll,
  IconCheck,
  IconClick,
  IconCopy,
  IconLayoutDashboard,
  IconPalette,
  IconTextDirectionLtr,
  IconTextDirectionRtl,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

interface InspectedElementInfo {
  tag: string
  id: string
  classes: string[]
  path: string
  rect: { width: number; height: number; top: number; left: number }
  styles: {
    display: string
    position: string
    zIndex: string
    padding: string
    margin: string
    borderRadius: string
    fontFamily: string
    fontSize: string
    color: string
    backgroundColor: string
    direction: string
  }
}

const THEME_TOKEN_NAMES = [
  "--background",
  "--foreground",
  "--card",
  "--primary",
  "--secondary",
  "--muted",
  "--accent",
  "--destructive",
  "--border",
  "--ring",
  "--radius",
] as const

function getTailwindBreakpoint(width: number): string {
  if (width >= 1536) return "2xl"
  if (width >= 1280) return "xl"
  if (width >= 1024) return "lg"
  if (width >= 768) return "md"
  if (width >= 640) return "sm"
  return "xs"
}

function buildDomPath(el: HTMLElement): string {
  const parts: string[] = []
  let curr: HTMLElement | null = el
  let depth = 0
  while (curr && curr !== document.body && depth < 5) {
    let seg = curr.tagName.toLowerCase()
    if (curr.id) seg += `#${curr.id}`
    else if (typeof curr.className === "string" && curr.className.trim()) {
      const firstClass = curr.className.trim().split(/\s+/)[0]
      if (firstClass) seg += `.${firstClass}`
    }
    parts.unshift(seg)
    curr = curr.parentElement
    depth++
  }
  return parts.join(" > ")
}

function readElementInfo(el: HTMLElement): InspectedElementInfo {
  const rect = el.getBoundingClientRect()
  const cs = window.getComputedStyle(el)
  const rawClass = typeof el.className === "string" ? el.className : ""
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || "",
    classes: rawClass.trim() ? rawClass.trim().split(/\s+/) : [],
    path: buildDomPath(el),
    rect: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      top: Math.round(rect.top),
      left: Math.round(rect.left),
    },
    styles: {
      display: cs.display,
      position: cs.position,
      zIndex: cs.zIndex,
      padding: cs.padding,
      margin: cs.margin,
      borderRadius: cs.borderRadius,
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      direction: cs.direction,
    },
  }
}

export function InspectorPanel() {
  const [viewport, setViewport] = useState({ width: 0, height: 0, dpr: 1 })
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr")
  const [outlinesOn, setOutlinesOn] = useState(false)
  const [picking, setPicking] = useState(false)
  const [hoverBox, setHoverBox] = useState<{
    top: number
    left: number
    width: number
    height: number
    label: string
  } | null>(null)
  const [inspected, setInspected] = useState<InspectedElementInfo | null>(null)
  const [copiedClasses, setCopiedClasses] = useState(false)
  const [cssTokens, setCssTokens] = useState<Array<{ name: string; value: string }>>([])

  const readTokens = useCallback(() => {
    if (typeof window === "undefined") return
    const cs = window.getComputedStyle(document.documentElement)
    setCssTokens(
      THEME_TOKEN_NAMES.map((name) => ({
        name,
        value: cs.getPropertyValue(name).trim() || "(unset)",
      }))
    )
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      })
    }
    updateViewport()
    setDir(document.documentElement.dir === "rtl" ? "rtl" : "ltr")
    readTokens()
    window.addEventListener("resize", updateViewport)
    return () => window.removeEventListener("resize", updateViewport)
  }, [readTokens])

  // Layout outline overlay
  useEffect(() => {
    const id = "iris-devtools-outline-style"
    const existing = document.getElementById(id)
    if (outlinesOn) {
      if (!existing) {
        const style = document.createElement("style")
        style.id = id
        style.textContent = `
          body *:not([data-iris-devtools]):not([data-iris-devtools] *) {
            outline: 1px solid rgba(56, 189, 248, 0.28) !important;
          }
        `
        document.head.appendChild(style)
      }
    } else {
      existing?.remove()
    }
    return () => {
      document.getElementById(id)?.remove()
    }
  }, [outlinesOn])

  // Interactive element picker
  useEffect(() => {
    if (!picking) {
      setHoverBox(null)
      return
    }

    const handleMove = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (
        !(target instanceof HTMLElement) ||
        target.closest("[data-iris-devtools]")
      ) {
        setHoverBox(null)
        return
      }
      const rect = target.getBoundingClientRect()
      const tag = target.tagName.toLowerCase()
      const cls =
        typeof target.className === "string" && target.className.trim()
          ? `.${target.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : ""
      setHoverBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        label: `${tag}${cls} (${Math.round(rect.width)}×${Math.round(rect.height)})`,
      })
    }

    const handleClick = (e: MouseEvent) => {
      const target = document.elementFromPoint(e.clientX, e.clientY)
      if (
        !(target instanceof HTMLElement) ||
        target.closest("[data-iris-devtools]")
      ) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      setInspected(readElementInfo(target))
      setPicking(false)
      setHoverBox(null)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPicking(false)
        setHoverBox(null)
      }
    }

    document.addEventListener("mousemove", handleMove, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("mousemove", handleMove, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [picking])

  const toggleDir = () => {
    const next = dir === "ltr" ? "rtl" : "ltr"
    document.documentElement.dir = next
    setDir(next)
  }

  const handleCopyClasses = async () => {
    if (!inspected) return
    await navigator.clipboard.writeText(inspected.classes.join(" "))
    setCopiedClasses(true)
    setTimeout(() => setCopiedClasses(false), 1200)
  }

  const bp = getTailwindBreakpoint(viewport.width)

  return (
    <div className="h-full space-y-3 overflow-y-auto p-3">
      {/* Quick Controls */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase">
            Viewport
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs font-semibold">
            <span>
              {viewport.width}×{viewport.height}
            </span>
            <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-400">
              {bp}
            </span>
          </div>
        </div>

        <Button
          variant={picking ? "default" : "outline"}
          size="sm"
          onClick={() => setPicking((v) => !v)}
          className="h-auto justify-start gap-2 px-3 py-2 font-mono text-xs"
        >
          <IconClick className="size-4 shrink-0" />
          <div className="text-start">
            <div className="font-semibold">
              {picking ? "Picking..." : "Pick Element"}
            </div>
            <div className="text-[10px] opacity-70">Esc to cancel</div>
          </div>
        </Button>

        <Button
          variant={dir === "rtl" ? "default" : "outline"}
          size="sm"
          onClick={toggleDir}
          className="h-auto justify-start gap-2 px-3 py-2 font-mono text-xs"
        >
          {dir === "rtl" ? (
            <IconTextDirectionRtl className="size-4 shrink-0" />
          ) : (
            <IconTextDirectionLtr className="size-4 shrink-0" />
          )}
          <div className="text-start">
            <div className="font-semibold">Dir: {dir.toUpperCase()}</div>
            <div className="text-[10px] opacity-70">Toggle RTL/LTR</div>
          </div>
        </Button>

        <Button
          variant={outlinesOn ? "default" : "outline"}
          size="sm"
          onClick={() => setOutlinesOn((v) => !v)}
          className="h-auto justify-start gap-2 px-3 py-2 font-mono text-xs"
        >
          <IconBorderAll className="size-4 shrink-0" />
          <div className="text-start">
            <div className="font-semibold">Outlines</div>
            <div className="text-[10px] opacity-70">
              {outlinesOn ? "Visible" : "Hidden"}
            </div>
          </div>
        </Button>
      </div>

      {/* Inspected Element */}
      {inspected ? (
        <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 font-mono text-xs">
              <IconLayoutDashboard className="size-4 shrink-0 text-sky-400" />
              <span className="font-bold text-foreground">
                &lt;{inspected.tag}
                {inspected.id ? `#${inspected.id}` : ""}&gt;
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {inspected.rect.width}×{inspected.rect.height}
              </span>
            </div>
            {inspected.classes.length > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={handleCopyClasses}
                className="h-6 gap-1 px-1.5 font-mono text-[10px]"
              >
                {copiedClasses ? (
                  <IconCheck className="size-3 text-emerald-400" />
                ) : (
                  <IconCopy className="size-3" />
                )}
                <span>Copy classes</span>
              </Button>
            )}
          </div>

          <div className="truncate font-mono text-[10px] text-muted-foreground">
            {inspected.path}
          </div>

          {inspected.classes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {inspected.classes.map((cls, idx) => (
                <span
                  key={`${cls}-${idx}`}
                  className="rounded border border-border/60 bg-background/70 px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                >
                  {cls}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border/60 bg-background/60 p-2 font-mono text-[10px] sm:grid-cols-3">
            {Object.entries(inspected.styles).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <span className="text-muted-foreground">{k}: </span>
                <span className="truncate text-foreground" title={v}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 p-4 text-center font-mono text-xs text-muted-foreground">
          Click &quot;Pick Element&quot; and click any element on the page to inspect its classes, dimensions, and computed styles.
        </div>
      )}

      {/* CSS Theme Tokens */}
      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
          <IconPalette className="size-3.5 text-muted-foreground" />
          <span>CSS Theme Tokens</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px] sm:grid-cols-2">
          {cssTokens.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between gap-2 rounded border border-border/50 bg-background/60 px-2 py-1"
            >
              <span className="truncate text-muted-foreground">{t.name}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-foreground">
                {t.name !== "--radius" && (
                  <span
                    className="size-3 rounded-xs border border-border"
                    style={{ backgroundColor: `var(${t.name})` }}
                  />
                )}
                <span className="max-w-[110px] truncate text-[10px]">
                  {t.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover Highlight Portal */}
      {picking &&
        hoverBox &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-iris-devtools="highlight"
            className="pointer-events-none fixed z-[99998] border-2 border-sky-400 bg-sky-400/15"
            style={{
              top: hoverBox.top,
              left: hoverBox.left,
              width: hoverBox.width,
              height: hoverBox.height,
            }}
          >
            <div className="absolute -top-5 start-0 rounded bg-sky-500 px-1.5 py-0.5 font-mono text-[10px] font-semibold whitespace-nowrap text-black shadow">
              {hoverBox.label}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
