"use client"

import React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  IconBookmarkFilled,
  IconFileText,
  IconLock,
} from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import { DynamicIcon } from "@/components/iris-page/registry"
import type { ReliquaryDocSummary } from "./reliquary-types"

export interface DocSummaryCardProps {
  doc: ReliquaryDocSummary
  href?: string
  subtitleBadge?: string | null
  showCategoryBadge?: boolean
  showVisibilityBadge?: boolean
}

/**
 * Shared summary card for Reliquary Home and Browse grids.
 * Keeps card link separate from matched sub-page links to avoid nested anchors.
 */
export function DocSummaryCard({
  doc,
  href,
  subtitleBadge,
  showCategoryBadge = true,
  showVisibilityBadge = false,
}: DocSummaryCardProps) {
  const t = useTranslations("reliquary")
  const tBrowse = useTranslations("reliquary.browsePage")
  const tCat = useTranslations("reliquary.categories")
  const tVis = useTranslations("reliquary.visibility")
  const targetHref = href ?? `/reliquary/${doc.id}`
  const creatorLabel = doc.creator.displayName || doc.creator.username

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border hover:bg-accent/20">
      <Link href={targetHref} className="flex flex-1 flex-col gap-3 text-start">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-foreground">
              <DynamicIcon name={doc.icon || "IconBook"} size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                {doc.title}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                {creatorLabel}
              </p>
            </div>
          </div>

          {doc.isBookmarked && (
            <IconBookmarkFilled
              className="size-4 shrink-0 text-primary"
              aria-label={t("bookmarkedLabel")}
            />
          )}
        </div>

        {subtitleBadge && (
          <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md bg-muted/70 px-2 py-1 text-xs text-foreground">
            <IconFileText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{subtitleBadge}</span>
          </div>
        )}

        {doc.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {doc.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          {showCategoryBadge && (
            <Badge variant="secondary" className="text-[11px] font-medium">
              {tCat(doc.category)}
            </Badge>
          )}
          {showVisibilityBadge && (
            <Badge variant="outline" className="gap-1 text-[11px]">
              {doc.visibility === "PRIVATE" && <IconLock className="size-3" />}
              <span>{tVis(doc.visibility)}</span>
            </Badge>
          )}
          <span className="ms-auto text-[11px] text-muted-foreground">
            {tBrowse("pagesCount", { count: doc.pageCount })}
          </span>
        </div>

        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {doc.matchedPages && doc.matchedPages.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-2.5">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            {tBrowse("matchingPages")}
          </p>
          <div className="flex flex-col gap-1">
            {doc.matchedPages.slice(0, 3).map((matchedPage) => (
              <Link
                key={matchedPage.id}
                href={`/reliquary/${doc.id}/${matchedPage.id}`}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-foreground/90 transition-colors hover:bg-muted"
              >
                <DynamicIcon
                  name={matchedPage.icon || "IconFileText"}
                  size={13}
                  className="shrink-0 text-muted-foreground"
                />
                <span className="truncate">{matchedPage.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
