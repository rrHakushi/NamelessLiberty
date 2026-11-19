"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  IconBook,
  IconBookmark,
  IconCategory,
  IconCode,
  IconCompass,
  IconLoader2,
  IconPlus,
  IconSchool,
  IconSearch,
  IconSparkles,
  IconTag,
  IconX,
} from "@tabler/icons-react"
import {
  RELIQUARY_CATEGORIES,
  type ReliquaryCategory,
} from "@NamelessLiberty/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { useSession } from "@/context/session-context"
import { elysia } from "@/lib/elysia"
import { CreateDocDialog } from "@NamelessLiberty/reliquary"
import { DocSummaryCard } from "@NamelessLiberty/reliquary"
import { useReliquaryContext } from "@NamelessLiberty/reliquary"
import {
  extractApiErrorMessage,
  type ReliquaryDocSummary,
} from "@NamelessLiberty/reliquary"

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
}

const CATEGORY_ICONS: Record<
  "all" | ReliquaryCategory,
  React.ComponentType<{ className?: string }>
> = {
  all: IconSparkles,
  API_DOCS: IconCode,
  WIKI: IconBook,
  GUIDES: IconCompass,
  TUTORIALS: IconSchool,
  REFERENCE: IconBookmark,
  OTHER: IconCategory,
}

export default function ReliquaryBrowsePage() {
  const t = useTranslations("reliquary")
  const tBrowse = useTranslations("reliquary.browsePage")
  const tCat = useTranslations("reliquary.categories")
  const { data: session } = useSession()
  const { setActiveDoc } = useReliquaryContext()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | ReliquaryCategory
  >("all")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<ReliquaryDocSummary[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1,
  })

  useEffect(() => {
    setActiveDoc(null)
  }, [setActiveDoc])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim())
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false

    const loadDocs = async () => {
      setLoading(true)
      try {
        const res = await elysia.reliquary.docs.get({
          query: {
            ...(debouncedQuery ? { q: debouncedQuery } : {}),
            ...(selectedCategory !== "all"
              ? { category: selectedCategory }
              : {}),
            ...(selectedTag ? { tag: selectedTag } : {}),
            page,
            limit: 24,
          },
        })
        if (cancelled) return
        if (res.error || !res.data) {
          toast.error(extractApiErrorMessage(res.error, t("errors.saveFailed")))
          return
        }
        setDocs(res.data.docs as ReliquaryDocSummary[])
        setAvailableTags(res.data.availableTags as string[])
        setPagination(res.data.pagination as PaginationState)
      } catch (err) {
        if (!cancelled) {
          toast.error(extractApiErrorMessage(err, t("errors.saveFailed")))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDocs()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, page, selectedCategory, selectedTag, t])

  const docsByCategory = useMemo(() => {
    return RELIQUARY_CATEGORIES.map((category) => ({
      category,
      items: docs.filter((doc) => doc.category === category),
    })).filter((group) => group.items.length > 0)
  }, [docs])

  const filterKeys: Array<"all" | ReliquaryCategory> = [
    "all",
    ...RELIQUARY_CATEGORIES,
  ]

  return (
    <div className="flex w-full flex-1 flex-col bg-background text-foreground">
      <main className="flex w-full flex-1 flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
        {/* Borealis-style Header Controls */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <h1 className="sr-only">{tBrowse("title")}</h1>

          {/* Category Pill Navigation */}
          <div className="flex items-center justify-between gap-2">
            <nav
              aria-label={tBrowse("title")}
              className="relative flex min-w-0 flex-1 items-center overflow-hidden"
            >
              <div
                role="tablist"
                aria-orientation="horizontal"
                className="-mx-4 no-scrollbar flex max-w-[calc(100%+2rem)] items-center gap-1.5 overflow-x-auto px-4 py-1 sm:mx-0 sm:max-w-full sm:px-0"
              >
                {filterKeys.map((key) => {
                  const Icon = CATEGORY_ICONS[key]
                  const isActive = selectedCategory === key
                  const label =
                    key === "all" ? t("categories.all") : tCat(key)

                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "secondary"}
                      size="sm"
                      aria-current={isActive ? "page" : undefined}
                      onPress={() => {
                        setSelectedCategory(key)
                        setPage(1)
                      }}
                      className={cn(
                        "group relative flex h-auto shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-all select-none",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </Button>
                  )
                })}
              </div>
            </nav>

            {session?.user && (
              <Button
                size="sm"
                onPress={() => setCreateOpen(true)}
                className="shrink-0 gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              >
                <IconPlus className="size-3.5" />
                <span>{t("newDocument")}</span>
              </Button>
            )}
          </div>

          {/* Full-width Rounded-2xl Title Search Bar */}
          <div className="relative flex w-full items-center">
            <div className="pointer-events-none absolute inset-y-0 start-0 z-10 flex items-center ps-3.5 text-muted-foreground">
              {loading ? (
                <IconLoader2
                  className="size-4.5 animate-spin text-primary"
                  aria-hidden="true"
                />
              ) : (
                <IconSearch className="size-4.5" aria-hidden="true" />
              )}
            </div>

            <Input
              ref={searchInputRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={tBrowse("searchPlaceholder")}
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "h-11 w-full rounded-2xl border border-input/60 bg-muted/40 ps-10 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20",
                searchInput ? "pe-10" : "pe-4"
              )}
            />

            {searchInput && (
              <div className="absolute inset-y-0 end-0 z-10 flex items-center pe-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onPress={() => {
                    setSearchInput("")
                    setDebouncedQuery("")
                    setPage(1)
                    searchInputRef.current?.focus()
                  }}
                  aria-label="Clear search"
                  className="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <IconX className="size-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>

          {/* Optional Tag Pills */}
          {availableTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <IconTag className="me-1 size-3.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => {
                  setSelectedTag(null)
                  setPage(1)
                }}
                className="cursor-pointer"
              >
                <Badge
                  variant={selectedTag === null ? "default" : "outline"}
                  className="rounded-full text-xs"
                >
                  {tBrowse("allTags")}
                </Badge>
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? null : tag)
                    setPage(1)
                  }}
                  className="cursor-pointer"
                >
                  <Badge
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="rounded-full text-xs"
                  >
                    #{tag}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl bg-muted/50"
              />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 p-12 text-center">
            <IconBook className="size-8 text-muted-foreground" />
            <h2 className="text-base font-medium text-foreground">
              {tBrowse("emptyTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tBrowse("emptyHint")}
            </p>
          </div>
        ) : selectedCategory === "all" ? (
          <div className="flex flex-col gap-8">
            {docsByCategory.map(({ category, items }) => (
              <section key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-foreground">
                    {tCat(category)}
                  </h2>
                  <Badge variant="secondary" className="text-xs">
                    {items.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {items.map((doc) => (
                    <DocSummaryCard
                      key={doc.id}
                      doc={doc}
                      showCategoryBadge={false}
                      showVisibilityBadge={doc.visibility !== "PUBLIC"}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {docs.map((doc) => (
              <DocSummaryCard
                key={doc.id}
                doc={doc}
                showCategoryBadge={false}
                showVisibilityBadge={doc.visibility !== "PUBLIC"}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button
              size="sm"
              variant="outline"
              isDisabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              {tBrowse("previous")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              isDisabled={page >= pagination.totalPages}
              onPress={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
            >
              {tBrowse("next")}
            </Button>
          </div>
        )}
      </main>

      <CreateDocDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
