"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { IconCalendar, IconClock } from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"

import { useBorealisCard } from "../borealis-card-context"

import type { BorealisCardExpandedContentProps } from "../types"

import { getEntityFallbackIcon } from "./shared"
import { BorealisCardHoverContent } from "./borealis-card-hover-content"

// 5.5 BorealisCard.ExpandedContent

// -----------------------------------------------------------------------------
export function BorealisCardExpandedContent({
  imagePosition,
  priority = false,
  showHoverCard = true,
  className,
}: BorealisCardExpandedContentProps) {
  const { data, config } = useBorealisCard()
  const [imageError, setImageError] = useState(false)

  const effectiveRatio = config.aspectRatio ?? data.aspectRatio ?? "video"
  const details = data.hoverDetails
  const shouldShowSubtitle = config.showSubtitle ?? true
  const shouldShowDescription = config.showDescription ?? false
  const descriptionText = data.description || details?.description

  return (
    <>
      {/* 1. Thumbnail Image on Left or Right */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-muted shrink-0 select-none",
          effectiveRatio === "video" && "w-32 sm:w-44 md:w-52 aspect-video",
          effectiveRatio === "poster" && "w-20 sm:w-28 aspect-2/3",
          effectiveRatio === "square" && "w-20 sm:w-28 aspect-square",
          className
        )}
      >
        <a
          href={data.href && data.href !== "#" ? data.href : undefined}
          onClick={(e) => {
            if (!data.href || data.href === "#") {
              e.preventDefault()
            }
          }}
          tabIndex={-1}
          aria-hidden="true"
          className="block size-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {data.image && !imageError ? (
            <img
              src={data.image}
              alt={data.title}
              loading={priority ? "eager" : "lazy"}
              onError={() => setImageError(true)}
              className="size-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground/60">
              {getEntityFallbackIcon(data.type)}
              <span className="text-center text-[10px] font-medium capitalize">
                {data.type}
              </span>
            </div>
          )}
        </a>
      </div>

      {/* 2. Header Content next to Image (matching hoverCard header) */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pe-1">
        {/* Title */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <a
            href={data.href && data.href !== "#" ? data.href : undefined}
            onClick={(e) => {
              if (!data.href || data.href === "#") {
                e.preventDefault()
              }
            }}
            title={data.title}
            className="line-clamp-2 font-mono text-sm sm:text-base font-bold tracking-tight text-primary transition-colors group-hover/bcard:underline"
          >
            {data.title}
          </a>

          {shouldShowSubtitle && (data.titleNative || data.titleSecondary) && (
            <span
              title={data.titleNative ?? data.titleSecondary ?? ""}
              className="line-clamp-1 font-mono text-xs text-muted-foreground/80 tracking-tight"
            >
              {data.titleNative ?? data.titleSecondary}
            </span>
          )}
        </div>

        {/* Quick Meta Row: Badges, Air Date, Duration */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          {/* Badges (EP badge, Airing, Upcoming, Filler, Recap, Format, Queued, etc.) */}
          {data.badges && data.badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {data.badges.map((b, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase shadow-xs select-none",
                    b.className || "border border-border/60 bg-muted/50 text-foreground"
                  )}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {/* Air Date / Year with Calendar Icon */}
          {(details?.airDate || details?.year) && (
            <span className="inline-flex items-center gap-1 select-none text-muted-foreground">
              <IconCalendar className="size-3.5 shrink-0 text-muted-foreground/80" aria-hidden="true" />
              <span>{details.airDate ?? details.year}</span>
            </span>
          )}

          {/* Duration with Clock Icon */}
          {details?.duration && (
            <span className="inline-flex items-center gap-1 select-none text-muted-foreground">
              <IconClock className="size-3.5 shrink-0 text-muted-foreground/80" aria-hidden="true" />
              <span>
                {typeof details.duration === "number"
                  ? `${details.duration}m`
                  : details.duration}
              </span>
            </span>
          )}
        </div>

        {/* Optional Description / Synopsis */}
        {shouldShowDescription && descriptionText && (
          <p
            title={descriptionText}
            className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed mt-0.5 select-none"
          >
            {descriptionText}
          </p>
        )}
      </div>

      {/* 3. Hover Card popover */}
      {showHoverCard && <BorealisCardHoverContent />}
    </>
  )
}

// -----------------------------------------------------------------------------
