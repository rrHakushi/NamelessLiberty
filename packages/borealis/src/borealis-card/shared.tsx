"use client"

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import {
  IconBuildingSkyscraper,
  IconDisc,
  IconMovie,
  IconPhotoOff,
  IconUserCheck,
  IconUserHeart,
} from "@tabler/icons-react"

import { type ListStatus } from "../media-list-status-text"
import type { BorealisEntityType } from "../types"

export const STATUS_DROPDOWN_OPTIONS: ListStatus[] = [
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "DROPPED",
  "PLANNED",
  "MAYBE",
]

export const SCORE_OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

/**
 * Strips HTML tags, converts `<br>` to newlines, and collapses consecutive
 * horizontal whitespace (double/triple spaces) while preserving line breaks.
 */
export function cleanMediaDescription(raw?: string | null): string | null {
  if (!raw) return null
  const cleaned = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/[^\S\r\n]{2,}/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim()
  return cleaned || null
}

// -----------------------------------------------------------------------------
// Fallback Icon Helper
// -----------------------------------------------------------------------------
export function getEntityFallbackIcon(type: BorealisEntityType) {
  switch (type) {
    case "character":
      return <IconUserHeart className="size-8 stroke-[1.5] text-muted-foreground/50" />
    case "staff":
      return <IconUserCheck className="size-8 stroke-[1.5] text-muted-foreground/50" />
    case "studio":
      return <IconBuildingSkyscraper className="size-8 stroke-[1.5] text-muted-foreground/50" />
    case "music":
      return <IconDisc className="size-8 stroke-[1.5] text-muted-foreground/50" />
    case "movies":
    case "tv":
      return <IconMovie className="size-8 stroke-[1.5] text-muted-foreground/50" />
    default:
      return <IconPhotoOff className="size-8 stroke-[1.5] text-muted-foreground/50" />
  }
}

export function formatDateToYmd(val?: any): string {
  if (!val) return ""
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.slice(0, 10)
    }
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10)
  }
  return ""
}

export function synthesizeWatchedEpisodes(seasonsList: any[], progressCount: number): any[] {
  const regularSeasons = seasonsList.filter((s: any) => s.seasonNumber > 0)
  const list = regularSeasons.length > 0 ? regularSeasons : seasonsList
  if (list.length === 0 || progressCount <= 0) return []

  const synthesized: any[] = []
  let rem = progressCount
  const now = new Date().toISOString()
  for (const s of list) {
    if (rem <= 0) break
    const count = s.episodes?.length || s.episodeCount || 0
    const take = count > 0 ? Math.min(rem, count) : rem
    for (let ep = 1; ep <= take; ep++) {
      synthesized.push({
        seasonNumber: s.seasonNumber,
        episodeNumber: ep,
        watchedAt: now,
      })
    }
    rem -= take
  }
  return synthesized
}

