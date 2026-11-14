"use client"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { cn } from "@workspace/ui/lib/utils"
import {
  IconCalendar,
  IconClock,
  IconDeviceTv,
  IconMovie,
} from "@tabler/icons-react"
import {
  normalizeServarrBorealisData,
  type ServarrCardKind,
} from "./servarr-normalizer"
import type { ServarrApp } from "./servarr-client"
import type { BorealisNormalizedData } from "../types"

export interface ServarrMediaCardProps {
  item: any
  app: ServarrApp
  kind: ServarrCardKind
  variant?: "poster" | "overview" | "banner"
  qualityProfileName?: string
  href?: string
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: (id: number) => void
}

function ServarrProgressPill({ data }: { data: BorealisNormalizedData }) {
  if (!data.progress) return null
  const { current, max, unit } = data.progress
  const isComplete = typeof max === "number" && max > 0 && current >= max
  const label =
    typeof max === "number"
      ? `${current}/${max}${unit ? ` ${unit}` : ""}`
      : `${current}${unit ? ` ${unit}` : ""}`

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight shadow-md backdrop-blur-md",
        isComplete
          ? "border-emerald-500/40 bg-zinc-950/85 text-emerald-400"
          : "border-zinc-700/70 bg-zinc-950/85 text-zinc-200"
      )}
    >
      {label}
    </span>
  )
}

interface HoverPortalProps {
  isOpen: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
  data: BorealisNormalizedData
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function ServarrCardHoverPopover({
  isOpen,
  anchorRef,
  data,
  onMouseEnter,
  onMouseLeave,
}: HoverPortalProps) {
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{
    top: number
    left: number
    maxHeight: number
    placement: "left" | "right"
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !anchorRef.current || typeof window === "undefined") {
      setCoords(null)
      return
    }

    const update = () => {
      if (!anchorRef.current) return
      const rect = anchorRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const width = Math.min(384, vw - 24)
      const gap = 14
      const spaceRight = vw - rect.right
      const spaceLeft = rect.left

      const placement: "left" | "right" =
        spaceRight >= width + gap
          ? "right"
          : spaceLeft >= width + gap
            ? "left"
            : spaceRight >= spaceLeft
              ? "right"
              : "left"

      const left =
        placement === "right"
          ? Math.min(rect.right + gap, vw - width - 12)
          : Math.max(12, rect.left - width - gap)
      const top = Math.max(12, Math.min(rect.top, vh - 360))
      const maxHeight = Math.max(240, vh - top - 16)

      setCoords({ top, left, maxHeight, placement })
    }

    update()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [isOpen, anchorRef])

  if (!mounted || !isOpen || !coords) return null

  const details = data.hoverDetails
  const description = details?.description || data.description
  const heroImage = details?.bannerImage || data.image

  const popover = (
    <div
      role="tooltip"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        maxHeight: `${coords.maxHeight}px`,
        zIndex: 9999,
      }}
      className="flex w-80 max-w-[calc(100vw-24px)] sm:w-96 flex-col overflow-y-auto overscroll-contain rounded-2xl border border-frost bg-frost text-primary shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150 select-text [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]"
    >
      {/* Invisible Hover Bridge spanning the 14px gap */}
      <div
        className={cn(
          "absolute top-0 bottom-0 pointer-events-auto bg-transparent z-0",
          coords.placement === "right" ? "-left-[14px] w-[14px]" : "-right-[14px] w-[14px]"
        )}
        aria-hidden="true"
      />

      {heroImage && (
        <div className="relative h-28 w-full shrink-0 overflow-hidden bg-muted">
          <img
            src={heroImage}
            alt={data.title}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <h4 className="line-clamp-2 font-mono text-sm sm:text-base font-extrabold text-foreground">
            {data.href && data.href !== "#" ? (
              <a
                href={data.href}
                className="text-foreground transition-colors hover:text-primary hover:underline"
              >
                {data.title}
              </a>
            ) : (
              data.title
            )}
          </h4>
          {data.titleNative && data.titleNative !== data.title && (
            <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
              {data.titleNative}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          {details?.format && (
            <span className="inline-flex items-center rounded-md border border-frost bg-frost px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground uppercase">
              {details.format}
            </span>
          )}
          {details?.status && (
            <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground capitalize">
              {details.status}
            </span>
          )}
          {details?.year && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground">
              <IconCalendar className="size-3 text-primary" />
              <span>{details.year}</span>
            </span>
          )}
          {details?.duration && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground">
              <IconClock className="size-3 text-primary" />
              <span>{details.duration}</span>
            </span>
          )}
        </div>

        {description && (
          <p className="line-clamp-5 font-sans text-xs leading-relaxed text-foreground/90">
            {description}
          </p>
        )}

        {details?.genres && details.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
            {details.genres.map((genre, idx) => (
              <span
                key={idx}
                className="rounded-md border border-border/60 bg-muted/70 px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-xs"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(popover, document.body)
}

export function ServarrMediaCard({
  item,
  app,
  kind,
  variant = "poster",
  qualityProfileName,
  href,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ServarrMediaCardProps) {
  const data = normalizeServarrBorealisData(item, {
    app,
    kind,
    qualityProfileName,
    href,
    preferBanner: variant === "banner",
  })

  const cardRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setIsHovered(true), 160)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setIsHovered(false), 140)
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const numericId = Number(item?.id)
  const stopNav = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const FallbackIcon = data.type === "tv" ? IconDeviceTv : IconMovie

  if (variant === "overview") {
    return (
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="bcard group/bcard relative flex w-full flex-row items-center gap-3 rounded-2xl border border-border/60 bg-card p-2 text-start text-primary transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 sm:gap-4"
      >
        <div className="relative aspect-2/3 w-20 shrink-0 overflow-hidden rounded-xl bg-muted select-none sm:w-24">
          <a
            href={data.href && data.href !== "#" ? data.href : undefined}
            className="block size-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {data.image && !imageError ? (
              <img
                src={data.image}
                alt={data.title}
                loading="lazy"
                onError={() => setImageError(true)}
                className="size-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground/60">
                <FallbackIcon className="size-6" />
              </div>
            )}
          </a>
          {selectable && Number.isFinite(numericId) && onToggleSelect && (
            <div
              onClick={stopNav}
              className="absolute start-1.5 top-1.5 z-10 flex items-center justify-center rounded-md bg-zinc-950/85 p-1 backdrop-blur-sm"
            >
              <Checkbox
                isSelected={selected}
                onChange={() => onToggleSelect(numericId)}
                aria-label={`Select ${data.title}`}
              />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pe-1">
          <div className="min-w-0">
            <a
              href={data.href && data.href !== "#" ? data.href : undefined}
              title={data.title}
              className="line-clamp-1 font-mono text-sm font-bold tracking-tight text-foreground transition-colors hover:text-primary hover:underline sm:text-base"
            >
              {data.title}
            </a>
            {data.subtext && (
              <span className="block truncate font-mono text-[11px] text-muted-foreground">
                {data.subtext}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ServarrProgressPill data={data} />
          </div>

          {data.description && (
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              {data.description}
            </p>
          )}
        </div>

        <ServarrCardHoverPopover
          isOpen={isHovered}
          anchorRef={cardRef}
          data={data}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="bcard group/bcard relative flex w-full flex-col rounded-2xl border border-border/60 bg-card p-1.5 text-primary transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl bg-muted select-none",
          variant === "banner" ? "aspect-video" : "aspect-2/3"
        )}
      >
        <a
          href={data.href && data.href !== "#" ? data.href : undefined}
          onClick={(e) => {
            if (!data.href || data.href === "#") {
              e.preventDefault()
            }
          }}
          className="block size-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {data.image && !imageError ? (
            <img
              src={data.image}
              alt={data.title}
              loading="lazy"
              onError={() => setImageError(true)}
              className="size-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 p-3 text-muted-foreground/60">
              <FallbackIcon className="size-8" />
              <span className="text-center text-[10px] font-medium capitalize">
                {data.type}
              </span>
            </div>
          )}
        </a>

        {/* Top-Start Checkbox + Progress Pill */}
        <div className="pointer-events-none absolute start-1.5 top-1.5 z-10 flex items-center gap-1">
          {selectable && Number.isFinite(numericId) && onToggleSelect && (
            <div
              onClick={stopNav}
              className="pointer-events-auto flex items-center justify-center rounded-md bg-zinc-950/85 p-1 backdrop-blur-sm"
            >
              <Checkbox
                isSelected={selected}
                onChange={() => onToggleSelect(numericId)}
                aria-label={`Select ${data.title}`}
              />
            </div>
          )}
          <ServarrProgressPill data={data} />
        </div>
      </div>

      {/* Title & Compact Subtitle */}
      <div className="flex min-w-0 flex-col gap-0.5 px-1 py-1.5">
        <a
          href={data.href && data.href !== "#" ? data.href : undefined}
          onClick={(e) => {
            if (!data.href || data.href === "#") {
              e.preventDefault()
            }
          }}
          title={data.title}
          className="block truncate font-mono text-xs font-bold text-foreground transition-colors hover:text-primary hover:underline sm:text-sm"
        >
          {data.title}
        </a>
        {data.subtext && (
          <span
            title={data.subtext}
            className="block truncate font-mono text-[10px] tracking-tight text-muted-foreground/80"
          >
            {data.subtext}
          </span>
        )}
      </div>

      <ServarrCardHoverPopover
        isOpen={isHovered}
        anchorRef={cardRef}
        data={data}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
