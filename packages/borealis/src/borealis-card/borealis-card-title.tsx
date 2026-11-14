"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { useBorealisCard } from "../borealis-card-context"

import type { BorealisCardTitleProps } from "../types"

// 3. BorealisCard.Title

// -----------------------------------------------------------------------------
export function BorealisCardTitle({
  className,
  showSubtitle: overrideShowSubtitle,
  showDescription: overrideShowDescription,
  titleClassName,
  subtitleClassName,
  descriptionClassName,
}: BorealisCardTitleProps) {
  const { data, config } = useBorealisCard()
  const shouldShowSubtitle =
    overrideShowSubtitle ?? config.showSubtitle ?? true
  const shouldShowDescription =
    overrideShowDescription ?? config.showDescription ?? false

  const descriptionText = data.description || data.hoverDetails?.description

  return (
    <div className={cn("flex flex-col gap-0.5 px-1 py-1.5 min-w-0", className)}>
      <a
        href={data.href && data.href !== "#" ? data.href : undefined}
        onClick={(e) => {
          if (!data.href || data.href === "#") {
            e.preventDefault()
          }
        }}
        title={data.title}
        className={cn(
          "block truncate font-mono text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors hover:underline",
          titleClassName
        )}
      >
        {data.title}
      </a>

      {shouldShowSubtitle && (data.titleNative || data.titleSecondary) && (
        <span
          title={data.titleNative ?? data.titleSecondary ?? ""}
          className={cn(
            "block truncate text-[10px] text-muted-foreground/80 font-mono tracking-tight",
            subtitleClassName
          )}
        >
          {data.titleNative ?? data.titleSecondary}
        </span>
      )}

      {shouldShowDescription && descriptionText && (
        <p
          title={descriptionText}
          className={cn(
            "line-clamp-2 text-[11px] text-muted-foreground/80 leading-snug select-none mt-0.5",
            descriptionClassName
          )}
        >
          {descriptionText}
        </p>
      )}
    </div>
  )
}

