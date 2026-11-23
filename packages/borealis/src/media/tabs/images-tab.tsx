"use client"

import React, { useMemo, useState } from "react"
import { IconCheck, IconCopy, IconDownload } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"

interface ImagesTabProps {
  coverImage: string | null
  bannerImage: string | null
  images: Record<string, string[] | string | null> | null
  characters?: Array<{ image?: string | null; actor?: { image?: string | null } | null }>
  staff?: Array<{ image?: string | null; person?: { image?: string | null } | null }>
  seasons?: Array<{ posterImage?: string | null; image?: string | null }>
  episodes?: Array<{ thumbnail?: string | null; image?: string | null }>
}

type ImageCategoryKey =
  | "all"
  | "posters"
  | "backgrounds"
  | "banners"
  | "screencaps"
  | "seasons"
  | "episodes"
  | "characters"
  | "people"

function classifyImageUrl(
  url: string,
  context?: Exclude<ImageCategoryKey, "all">
): Exclude<ImageCategoryKey, "all"> {
  if (context) return context

  const lower = url.toLowerCase()
  if (lower.includes("/character/")) return "characters"
  if (lower.includes("/staff/") || lower.includes("/person")) return "people"
  if (lower.includes("/seasons/")) return "seasons"
  if (
    lower.includes("/posters/") ||
    lower.includes("/poster") ||
    lower.includes("/cover/") ||
    lower.includes("cover") ||
    lower.includes("cdn.myanimelist.net/images/anime")
  ) {
    return "posters"
  }
  if (
    lower.includes("/backgrounds/") ||
    lower.includes("/background/") ||
    lower.includes("background") ||
    lower.includes("fanart") ||
    lower.includes("wallpaper")
  ) {
    return "backgrounds"
  }
  if (
    lower.includes("/banners/") ||
    lower.includes("/banner/") ||
    lower.includes("banner")
  ) {
    return "banners"
  }
  if (
    lower.includes("/screencap") ||
    lower.includes("screenshot") ||
    lower.includes("/still/") ||
    lower.includes("episode")
  ) {
    return "screencaps"
  }
  return "posters"
}

export interface ProcessedMediaImage {
  url: string
  category: Exclude<ImageCategoryKey, "all">
}

export function extractMediaImages(
  coverImage?: string | null,
  bannerImage?: string | null,
  images?: any,
  extras?: {
    characters?: ImagesTabProps["characters"]
    staff?: ImagesTabProps["staff"]
    seasons?: ImagesTabProps["seasons"]
    episodes?: ImagesTabProps["episodes"]
  }
): ProcessedMediaImage[] {
  const result: ProcessedMediaImage[] = []
  const seen = new Set<string>()

  const collectCandidate = (
    url?: string | null,
    context?: Exclude<ImageCategoryKey, "all">
  ) => {
    if (!url || typeof url !== "string") return
    const trimmed = url.trim()
    if (!trimmed) return
    const normalized = trimmed.replace(/^http:\/\//i, "https://")
    const lower = normalized.toLowerCase()
    if (
      lower.includes("/banners/images/missing/") ||
      lower.includes("/images/missing/movie.jpg") ||
      lower.includes("/images/missing/series.jpg") ||
      lower.includes("/images/missing/person.jpg") ||
      (lower.includes("anilistcdn/") && lower.endsWith("/default.jpg"))
    ) {
      return
    }
    if (seen.has(normalized)) return
    seen.add(normalized)
    result.push({
      url: normalized,
      category: classifyImageUrl(normalized, context),
    })
  }

  // 1. Cover and banner first
  if (coverImage) collectCandidate(coverImage, "posters")
  if (bannerImage) collectCandidate(bannerImage, "banners")

  // 2. Extra images (array or object)
  if (images) {
    if (Array.isArray(images)) {
      for (const item of images) {
        if (typeof item === "string") {
          collectCandidate(item)
        } else if (item && typeof item === "object") {
          const u =
            (item as any).url || (item as any).image || (item as any).original
          if (typeof u === "string") collectCandidate(u)
        }
      }
    } else if (typeof images === "object") {
      for (const [key, val] of Object.entries(images)) {
        let context: Exclude<ImageCategoryKey, "all"> | undefined
        const lKey = key.toLowerCase()
        if (lKey.includes("banner")) context = "banners"
        else if (lKey.includes("background")) context = "backgrounds"
        else if (lKey.includes("screencap")) context = "screencaps"
        else if (lKey.includes("episode")) context = "episodes"
        else if (lKey.includes("season")) context = "seasons"
        else if (lKey.includes("character")) context = "characters"
        else if (lKey.includes("people") || lKey.includes("staff"))
          context = "people"
        else if (
          lKey.includes("cover") ||
          lKey.includes("poster") ||
          lKey.includes("mal")
        )
          context = "posters"

        if (Array.isArray(val)) {
          for (const item of val) {
            if (typeof item === "string") {
              collectCandidate(item, context)
            } else if (item && typeof item === "object") {
              const u =
                (item as any).url ||
                (item as any).image ||
                (item as any).original
              if (typeof u === "string") collectCandidate(u, context)
            }
          }
        } else if (typeof val === "string") {
          collectCandidate(val, context)
        }
      }
    }
  }

  // 3. Fallback from already-loaded relation records (for media synced prior to worker update)
  if (extras?.seasons) {
    for (const s of extras.seasons) {
      collectCandidate(s?.posterImage || s?.image, "seasons")
    }
  }
  if (extras?.episodes) {
    for (const ep of extras.episodes) {
      collectCandidate(ep?.thumbnail || ep?.image, "episodes")
    }
  }
  if (extras?.characters) {
    for (const ch of extras.characters) {
      collectCandidate(ch?.image, "characters")
      collectCandidate(ch?.actor?.image, "people")
    }
  }
  if (extras?.staff) {
    for (const st of extras.staff) {
      collectCandidate(st?.person?.image || st?.image, "people")
    }
  }

  // 4. Deduplicate lower resolution variants ONLY when higher resolution exists in the set
  const filtered = result.filter((item) => {
    // MAL: if ...l.jpg exists, drop ...jpg or ...m.jpg
    if (item.url.endsWith(".jpg") && !item.url.endsWith("l.jpg")) {
      const highRes = item.url.slice(0, -4) + "l.jpg"
      if (seen.has(highRes)) return false
    }
    // AniList: if /cover/large/ or /cover/extra-large/ exists, drop /cover/medium/
    if (item.url.includes("/cover/medium/")) {
      const largeRes = item.url.replace("/cover/medium/", "/cover/large/")
      const extraLargeRes = item.url.replace(
        "/cover/medium/",
        "/cover/extra-large/"
      )
      if (seen.has(largeRes) || seen.has(extraLargeRes)) return false
    }
    return true
  })

  return filtered
}

export function ImagesTab({
  coverImage,
  bannerImage,
  images,
  characters,
  staff,
  seasons,
  episodes,
}: ImagesTabProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<ImageCategoryKey>("all")

  // Categorize and deduplicate images
  const categorizedImages = useMemo(() => {
    const list = extractMediaImages(coverImage, bannerImage, images, {
      characters,
      staff,
      seasons,
      episodes,
    })
    const byCat = (cat: Exclude<ImageCategoryKey, "all">) =>
      list.filter((i) => i.category === cat).map((i) => i.url)

    return {
      all: list.map((i) => i.url),
      posters: byCat("posters"),
      backgrounds: byCat("backgrounds"),
      banners: byCat("banners"),
      screencaps: byCat("screencaps"),
      seasons: byCat("seasons"),
      episodes: byCat("episodes"),
      characters: byCat("characters"),
      people: byCat("people"),
    }
  }, [coverImage, bannerImage, images, characters, staff, seasons, episodes])

  // Build category tabs - ONLY SHOW IF AVAILABLE
  const availableCategories = useMemo(() => {
    const defs: Array<{
      key: Exclude<ImageCategoryKey, "all">
      label: string
    }> = [
      { key: "posters", label: "Posters & Covers" },
      { key: "backgrounds", label: "Backgrounds" },
      { key: "banners", label: "Banners" },
      { key: "screencaps", label: "Screencaps" },
      { key: "seasons", label: "Seasons" },
      { key: "episodes", label: "Episodes" },
      { key: "characters", label: "Characters" },
      { key: "people", label: "People" },
    ]
    const tabs: Array<{ key: ImageCategoryKey; label: string; count: number }> =
      [{ key: "all", label: "All", count: categorizedImages.all.length }]

    for (const d of defs) {
      const len = categorizedImages[d.key].length
      if (len > 0) {
        tabs.push({ key: d.key, label: d.label, count: len })
      }
    }

    return tabs
  }, [categorizedImages])

  // Current list based on active category
  const displayedImages =
    categorizedImages[activeCategory] || categorizedImages.all

  if (categorizedImages.all.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        No images available for this title.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Category Filter Pills: Only shown if multiple categories available */}
      {availableCategories.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {availableCategories.map((cat) => {
            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors outline-none select-none ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat.label}
                <span className="ms-1.5 text-[10px] tabular-nums opacity-70">
                  ({cat.count})
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Masonry Layout: Natural aspect ratios without vertical gaps */}
      <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 min-[2000px]:columns-7">
        {displayedImages.map((url, idx) => (
          <div key={idx} className="mb-3 break-inside-avoid">
            <button
              type="button"
              onClick={() => setSelectedImage(url)}
              className="group relative block w-full cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-card/60 p-1 text-start transition-all duration-200 outline-none hover:-translate-y-0.5 hover:border-border/80 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={url}
                alt={`Artwork ${idx + 1}`}
                loading="lazy"
                className="block h-auto w-full rounded-xl object-contain"
              />
            </button>
          </div>
        ))}
      </div>

      {/* Full Image Popup Modal */}
      {selectedImage && (
        <ImagePreviewDialog
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  )
}

function ImagePreviewDialog({
  imageUrl,
  onClose,
}: {
  imageUrl: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl)
      setCopied(true)
      toast.success("Image URL copied to clipboard")
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Failed to copy image URL")
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error("Fetch failed")
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const ext = blob.type.split("/")[1]?.split(";")[0] || "png"
      const filename =
        imageUrl.split("/").pop()?.split("?")[0] || `artwork.${ext}`
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog
      isOpen={true}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      className="w-max max-w-[95vw] sm:max-w-[95vw] gap-2.5 p-3"
    >
      <DialogHeader className="border-b border-border/40 pb-2">
        <DialogTitle className="text-sm font-semibold">
          Artwork Preview
        </DialogTitle>
      </DialogHeader>

      <div className="relative flex min-h-0 min-w-0 items-center justify-center rounded-xl bg-black/40">
        <img
          src={imageUrl}
          alt="Artwork preview"
          className="block max-h-[78vh] max-w-[calc(95vw-1.5rem)] w-auto h-auto rounded-lg object-contain"
        />
      </div>

      <DialogFooter className="border-t border-border/40 pt-2.5 flex-row justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleCopy()}
          className="gap-1.5 cursor-pointer"
        >
          {copied ? (
            <IconCheck className="size-3.5 text-emerald-400" />
          ) : (
            <IconCopy className="size-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy Link"}</span>
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          isDisabled={downloading}
          onClick={() => void handleDownload()}
          className="gap-1.5 cursor-pointer"
        >
          <IconDownload className="size-3.5" />
          <span>{downloading ? "Downloading..." : "Download"}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
