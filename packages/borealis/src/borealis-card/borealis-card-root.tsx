"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@workspace/ui/components/button"

import { BorealisCardContext } from "../borealis-card-context"

import { type ListStatus } from "../media-list-status-text"
import type { BorealisCardRootProps } from "../types"

// 1. BorealisCard.Root

// -----------------------------------------------------------------------------
export function BorealisCardRoot({
  data,
  expanded = false,
  imagePosition = "left",
  showExtras = true,
  showBadges = true,
  showSubtitle = true,
  showHoverSubtitle = false,
  showTabNav = false,
  showDescription = false,
  showHoverCard = true,
  showProgress = true,
  statusIconOnly = false,
  canEdit = false,
  onStatusChange,
  onScoreChange,
  onSaveEntry,
  onEdit,
  onIncrement,
  onIncrementVolume,
  isIncrementDisabled = false,
  aspectRatio,
  size = "md",
  hoverPlacement,
  hoverDelay = 150,
  className,
  children,
}: BorealisCardRootProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isHoverCardEditing, setIsHoverCardEditing] = useState(false)
  const [popoverPlacement, setPopoverPlacement] = useState<"left" | "right">("right")
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPointerTypeRef = useRef<string | null>(null)
  const openedByTouchRef = useRef(false)

  const [localScore, setLocalScore] = useState<number | null | undefined>(undefined)
  const [localStatus, setLocalStatus] = useState<ListStatus | undefined>(undefined)
  const [localProgress, setLocalProgress] = useState<number | undefined>(undefined)

  const updatePopoverPlacement = () => {
    // Calculate placement to guarantee the popover does NOT cover the card
    if (containerRef.current && typeof window !== "undefined") {
      const rect = containerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const popoverWidth = Math.min(384, viewportWidth * 0.9)
      const gap = 14
      const spaceOnRight = viewportWidth - rect.right
      const spaceOnLeft = rect.left

      if (spaceOnRight >= popoverWidth + gap) {
        setPopoverPlacement("right")
      } else if (spaceOnLeft >= popoverWidth + gap) {
        setPopoverPlacement("left")
      } else {
        setPopoverPlacement(spaceOnRight >= spaceOnLeft ? "right" : "left")
      }
    }
  }

  const handleMouseEnter = () => {
    if (lastPointerTypeRef.current === "touch") return
    if (timerRef.current) clearTimeout(timerRef.current)

    updatePopoverPlacement()

    timerRef.current = setTimeout(() => {
      openedByTouchRef.current = false
      setIsHovered(true)
    }, hoverDelay)
  }

  const handleMouseLeave = () => {
    if (lastPointerTypeRef.current === "touch" || openedByTouchRef.current) return
    if (isHoverCardEditing) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsHovered(false)
    }, 150)
  }

  // Close touch-opened hover card when tapping outside both the card and its popover
  useEffect(() => {
    if (!isHovered || typeof document === "undefined") return

    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (!openedByTouchRef.current || isHoverCardEditing) return
      const target = e.target as HTMLElement | null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      if (target.closest('[role="menu"], [role="listbox"], [role="dialog"]')) return

      openedByTouchRef.current = false
      setIsHovered(false)
    }

    document.addEventListener("pointerdown", handleOutsidePointerDown, true)
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true)
    }
  }, [isHovered, isHoverCardEditing])

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (lastPointerTypeRef.current !== "touch" || !showHoverCard) {
      return
    }

    const target = e.target as HTMLElement | null
    if (!target) return

    // Let interactive controls (buttons, dropdown triggers, inputs) behave normally
    if (
      target.closest(
        'button, input, select, textarea, [role="button"], [role="menuitem"]'
      )
    ) {
      return
    }

    if (!isHovered) {
      e.preventDefault()
      e.stopPropagation()
      if (timerRef.current) clearTimeout(timerRef.current)
      updatePopoverPlacement()
      openedByTouchRef.current = true
      setIsHovered(true)
      return
    }

    // Hover card is already open: second tap navigates to the link
    if (!target.closest("a[href]") && data.href && data.href !== "#") {
      const anchor = containerRef.current?.querySelector<HTMLAnchorElement>("a[href]")
      if (anchor) {
        anchor.click()
      } else if (typeof window !== "undefined") {
        window.location.assign(data.href)
      }
    }
  }

  const config = {
    expanded,
    imagePosition,
    showExtras,
    showBadges,
    showSubtitle,
    showHoverSubtitle,
    showTabNav,
    showDescription,
    showHoverCard,
    showProgress,
    statusIconOnly,
    canEdit,
    onStatusChange,
    onScoreChange,
    onSaveEntry,
    onEdit,
    onIncrement,
    onIncrementVolume,
    isIncrementDisabled,
    aspectRatio: aspectRatio ?? data.aspectRatio,
    size,
    hoverPlacement: hoverPlacement ?? popoverPlacement,
    hoverDelay,
    className,
  }

  const rawEntry = data.raw?.entry ?? data.raw?.listEntry ?? data.raw
  const entryPriority = (rawEntry?.priority ?? data.priority ?? "").toUpperCase()

  return (
    <BorealisCardContext.Provider
      value={{
        data,
        config,
        isHovered,
        popoverPlacement,
        containerRef,
        popoverRef,
        handleMouseEnter,
        handleMouseLeave,
        localScore,
        setLocalScore,
        localStatus,
        setLocalStatus,
        localProgress,
        setLocalProgress,
        isHoverCardEditing,
        setIsHoverCardEditing,
      }}
    >
      <div
        ref={containerRef}
        onPointerOverCapture={(e) => {
          lastPointerTypeRef.current = e.pointerType
        }}
        onPointerDownCapture={(e) => {
          lastPointerTypeRef.current = e.pointerType
        }}
        onClickCapture={handleClickCapture}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "bcard group/bcard relative flex rounded-2xl border border-border/60 bg-card text-primary transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
          entryPriority === "ULTRA" && "border-t-2 border-e-2 border-t-purple-500 border-e-purple-500",
          entryPriority === "HIGH" && "border-t-2 border-e-2 border-t-rose-500 border-e-rose-500",
          entryPriority === "MEDIUM" && "border-t-2 border-e-2 border-t-amber-500 border-e-amber-500",
          expanded
            ? cn(
              "w-full p-2 items-center gap-3 sm:gap-4",
              imagePosition === "right" || imagePosition === "end"
                ? "flex-row-reverse text-start"
                : "flex-row text-start"
            )
            : cn(
              "flex-col p-1.5 shrink-0",
              size === "sm" && "w-32 text-xs",
              size === "md" && "w-40 text-sm",
              size === "lg" && "w-48 text-base"
            ),
          isHovered ? "z-40" : "z-10",
          className
        )}
      >
        {children}
      </div>
    </BorealisCardContext.Provider>
  )
}

// -----------------------------------------------------------------------------
