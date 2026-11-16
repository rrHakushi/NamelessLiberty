"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import {
  IconCheck,
  IconStar,
  IconX,
} from "@tabler/icons-react"

import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useBorealisCard } from "../borealis-card-context"

import { normalizeListStatus, type ListStatus } from "../media-list-status-text"
import type { BorealisCardImageProps } from "../types"

import { SCORE_OPTIONS, getEntityFallbackIcon } from "./shared"
import { BorealisCardStatusProgress } from "./borealis-card-status-progress"

// 2. BorealisCard.Image

// -----------------------------------------------------------------------------
export function BorealisCardImage({
  className,
  aspectRatio,
  showBadges: overrideShowBadges,
  onScoreChange,
  children,
}: BorealisCardImageProps) {
  const { data, config, localScore, setLocalScore, localStatus, localProgress } = useBorealisCard()
  const [imageError, setImageError] = useState(false)

  const effectiveRatio = aspectRatio ?? config.aspectRatio ?? data.aspectRatio
  const shouldShowBadges = overrideShowBadges ?? config.showBadges ?? true

  const scoreFormatted = data.hoverDetails?.scoreFormatted
  const isEntity =
    data.type === "character" ||
    data.type === "characters" ||
    data.type === "staff" ||
    data.type === "people" ||
    data.type === "studio" ||
    data.type === "studios" ||
    data.type === "episode" ||
    data.type === "episodes"
  const effectiveOnScoreChange = onScoreChange ?? config.onScoreChange

  return (
    <a
      href={data.href && data.href !== "#" ? data.href : undefined}
      onClick={(e) => {
        if (!data.href || data.href === "#") {
          e.preventDefault()
        }
      }}
      className={cn(
        "relative block w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-primary select-none",
        effectiveRatio === "square" && "aspect-square",
        (effectiveRatio === "poster" || !effectiveRatio) && "aspect-[2/3] aspect-2/3",
        effectiveRatio === "video" && "aspect-video",
        className
      )}
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
          {getEntityFallbackIcon(data.type)}
          <span className="text-center text-[10px] font-medium capitalize">
            {data.type}
          </span>
        </div>
      )}

      {/* Top-Left Overlaid Status & Progress */}
      <div className="pointer-events-none absolute top-1.5 start-1.5 z-10 flex items-center max-w-[calc(100%-0.75rem)]">
        <BorealisCardStatusProgress />
      </div>

      {/* Bottom gradient shadow for badge legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

      {/* Bottom Overlaid Badges: Format / Role Badges + Score Badge right next to each other */}
      {shouldShowBadges && (data.badges.length > 0 || !isEntity) && (
        <div className="pointer-events-none absolute start-1.5 bottom-1.5 z-10 flex flex-wrap items-center gap-1">
          {data.badges.map((badge, idx) => (
            <span
              key={idx}
              className={cn(
                "inline-flex items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black tracking-wider uppercase shadow-md transition-colors",
                badge.className
              )}
            >
              {badge.label}
            </span>
          ))}

          {/* Score Badge next to Format Badge for all media types */}
          {!isEntity && (() => {
            const entryScore =
              localScore !== undefined
                ? localScore
                : typeof data.raw?.entry?.score === "number" && data.raw.entry.score > 0
                  ? data.raw.entry.score
                  : typeof data.raw?.score === "number" && data.raw.score > 0
                    ? data.raw.score
                    : typeof data.hoverDetails?.userScore === "number" && data.hoverDetails.userScore > 0
                      ? data.hoverDetails.userScore
                      : null
            const currentScoreNum =
              entryScore ??
              (typeof data.hoverDetails?.score === "number" && data.hoverDetails.score > 0
                ? data.hoverDetails.score
                : null)
            const displayScore = effectiveOnScoreChange || config.onSaveEntry
              ? entryScore !== null && entryScore > 0
                ? (entryScore > 10 ? (entryScore / 10).toFixed(1) : entryScore.toFixed(1))
                : "N/A"
              : (scoreFormatted ?? "N/A")
            const hasScore = displayScore !== "N/A"

            const handleScoreSelect = (scoreVal: number | null) => {
              setLocalScore?.(scoreVal)
              if (effectiveOnScoreChange) {
                effectiveOnScoreChange(scoreVal)
              } else if (config.onSaveEntry) {
                config.onSaveEntry({
                  status: localStatus ?? normalizeListStatus(data.raw?.entry?.status ?? data.hoverDetails?.listStatus) ?? "IN_PROGRESS",
                  score: scoreVal,
                  progress: localProgress ?? data.progress?.current ?? data.raw?.entry?.progress ?? 0,
                })
              }
            }

            if (effectiveOnScoreChange || config.onSaveEntry) {
              return (
                <div className="pointer-events-auto">
                  <DropdownMenuTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-5 gap-1 rounded-md px-1.5 text-[10px] font-black shadow-md backdrop-blur-md cursor-pointer select-none transition-colors border",
                        hasScore
                          ? "border-primary/40 bg-frost text-foreground hover:border-primary hover:bg-black/60"
                          : "border-zinc-700/60 bg-frost text-zinc-400 hover:border-zinc-500 hover:bg-black/60"
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      aria-label={`Score: ${displayScore}. Click to change.`}
                    >
                      <IconStar
                        className={cn(
                          "size-3",
                          hasScore ? "text-primary" : "text-zinc-500"
                        )}
                      />
                      <span>{displayScore}</span>
                    </Button>
                    <DropdownMenu placement="bottom start" className="max-h-[108px] overflow-y-auto overscroll-contain [scrollbar-width:thin] w-auto min-w-[115px] text-[10px] border border-primary/40 bg-black/65 text-foreground shadow-2xl backdrop-blur-md z-[100]">
                      {SCORE_OPTIONS.map((scoreVal) => {
                        const isSelected = currentScoreNum !== null && (currentScoreNum === scoreVal || currentScoreNum / 10 === scoreVal || currentScoreNum === scoreVal * 10)
                        return (
                          <DropdownMenuItem
                            key={scoreVal}
                            onAction={() => handleScoreSelect(scoreVal)}
                            className="flex items-center gap-1.5 cursor-pointer font-medium text-[10px] py-1 px-2 min-h-6"
                          >
                            <IconStar className="size-3 text-primary shrink-0" />
                            <span className={cn(isSelected && "font-bold text-foreground")}>
                              {scoreVal} <span className="text-primary">/</span> 10
                            </span>
                            {isSelected && (
                              <IconCheck className="size-3 ms-auto text-primary shrink-0" />
                            )}
                          </DropdownMenuItem>
                        )
                      })}
                      <DropdownMenuItem
                        onAction={() => handleScoreSelect(null)}
                        className="flex items-center gap-1.5 cursor-pointer font-medium text-[9px] text-primary hover:text-primary py-1 px-2 min-h-6"
                      >
                        <IconX className="size-3 text-primary shrink-0" />
                        <span>N/A</span>
                        {!hasScore && (
                          <IconCheck className="size-3 ms-auto text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </DropdownMenuTrigger>
                </div>
              )
            }

            return (
              <div
                className={cn(
                  "inline-flex h-5 items-center gap-1 rounded-md px-1.5 font-mono text-[10px] font-black shadow-md backdrop-blur-md border",
                  hasScore
                    ? "border-primary/40 bg-frost text-foreground hover:border-primary hover:bg-black/60"
                    : "border-zinc-700/60 bg-frost text-zinc-400"
                )}
              >
                <IconStar
                  className={cn(
                    "size-3",
                    hasScore ? "text-primary" : "text-zinc-500"
                  )}
                />
                <span>{displayScore}</span>
              </div>
            )
          })()}
        </div>
      )}

      {children}
    </a>
  )
}

