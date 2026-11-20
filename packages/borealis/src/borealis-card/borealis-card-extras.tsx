"use client"

import React from "react"

import { cn } from "@workspace/ui/lib/utils"

import { useBorealisCard } from "../borealis-card-context"
import { getMediaDetailHref } from "@NamelessLiberty/borealis/lib/media-routes"
import type { BorealisCardExtrasProps } from "../types"

// -----------------------------------------------------------------------------
// 4. BorealisCard.Extras
// -----------------------------------------------------------------------------
export function BorealisCardExtras({
  className,
  showActor = true,
  showMetaPills = true,
  showSubtext = true,
}: BorealisCardExtrasProps) {
  const { data, config } = useBorealisCard()

  if (config.showExtras === false) {
    return null
  }

  if (Boolean(data.listStatus) || (config.showProgress !== false && Boolean(data.progress))) {
    return null
  }

  // 1. Character Voice Actor row (matches provided reference screenshot)
  if (data.type === "character" && showActor && data.actor) {
    const actor = data.actor
    return (
      <div
        className={cn(
          "mt-auto flex items-center gap-2 border-t border-border/40 px-1 pt-1.5 pb-0.5 text-[10px]",
          className
        )}
      >
        {actor.image ? (
          <img
            src={actor.image}
            alt={actor.namePrimary}
            loading="lazy"
            className="size-5 shrink-0 rounded-full object-cover ring-1 ring-border/50"
          />
        ) : (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-bold text-muted-foreground">
            VA
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <a
            href={`/borealis/people/${actor.id}`}
            title={actor.namePrimary}
            className="truncate text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline dark:text-cyan-400"
          >
            {actor.namePrimary}
          </a>
          {actor.language && (
            <span className="truncate text-[10px] text-muted-foreground/80">
              {actor.language}
            </span>
          )}
        </div>
      </div>
    )
  }

  // 1b. Character Media Appearance row (used on Person/Staff voiced characters)
  if (data.type === "character" && showActor && data.media) {
    const media = data.media
    const mediaHref = getMediaDetailHref(media.mediaType, media.id)
    const extraCount =
      data.appearances && data.appearances.length > 1
        ? data.appearances.length - 1
        : 0
    const metaLabel = [
      media.format,
      media.year,
      extraCount > 0 ? `+${extraCount} more` : null,
    ]
      .filter(Boolean)
      .join(" • ")
    return (
      <div
        className={cn(
          "mt-auto flex items-center gap-2 border-t border-border/40 px-1 pt-1.5 pb-0.5 text-[10px]",
          className
        )}
      >
        {media.coverImage ? (
          <img
            src={media.coverImage}
            alt={media.titlePrimary}
            loading="lazy"
            className="h-6 w-4.5 shrink-0 rounded-xs object-cover ring-1 ring-border/50"
          />
        ) : (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-xs bg-muted text-[8px] font-bold text-muted-foreground">
            {media.mediaType.slice(0, 2)}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <a
            href={mediaHref}
            title={media.titlePrimary}
            className="truncate text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline dark:text-cyan-400"
          >
            {media.titlePrimary}
          </a>
          {metaLabel && (
            <span className="truncate text-[10px] text-muted-foreground/80">
              {metaLabel}
            </span>
          )}
        </div>
      </div>
    )
  }

  // 2. Staff Person subtext (role / occupation)
  if (data.type === "staff" && showSubtext && data.subtext) {
    return (
      <div
        className={cn(
          "mt-auto border-t border-border/40 px-1 pt-1.5 pb-0.5 text-[10px] text-muted-foreground",
          className
        )}
      >
        <span className="line-clamp-1 font-medium">{data.subtext}</span>
      </div>
    )
  }

  // 3. Media Metadata Pills / Studio
  if (showMetaPills && (data.metaPills?.length || data.subtext)) {
    return (
      <div
        className={cn(
          "mt-auto flex items-center gap-1 border-t border-border/40 px-1 pt-1.5 pb-0.5 text-[10px] text-muted-foreground",
          className
        )}
      >
        {data.subtext ? (
          <span className="line-clamp-1 truncate font-medium text-muted-foreground/90">
            {data.subtext}
          </span>
        ) : data.metaPills && data.metaPills.length > 0 ? (
          <span className="line-clamp-1 truncate text-muted-foreground/75">
            {data.metaPills.join(" • ")}
          </span>
        ) : null}
      </div>
    )
  }

  return null
}
