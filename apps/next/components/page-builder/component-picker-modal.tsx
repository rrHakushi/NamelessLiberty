"use client"

import * as React from "react"
import { IconBook, IconSearch, IconSparkles, IconX } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  ALL_TABLER_ICON_NAMES,
  DynamicIcon,
  resolveComponent,
  resolveTablerIcon,
  type IrisNode,
} from "@/components/iris-page"
import { COMPONENT_PRESETS } from "./catalog"

export interface ComponentPickerModalProps {
  isOpen: boolean
  title?: string
  description?: string
  positionLabel?: string // e.g. "Inside <div.layout-item>", "Above <Card>", "Under <Button>"
  initialCategory?: string
  onClose: () => void
  onSelectComponent: (node: IrisNode) => void
}

const PICKER_CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "sections", label: "Sections" },
  { id: "docs", label: "Docs" },
  { id: "blocks", label: "Blocks" },
  { id: "typography", label: "Typography" },
  { id: "forms", label: "Forms" },
  { id: "feedback", label: "Feedback" },
  { id: "html", label: "Media & HTML" },
  { id: "icons", label: "Icons" },
] as const

export function ComponentPickerModal({
  isOpen,
  title = "Choose Component",
  description,
  positionLabel,
  initialCategory = "all",
  onClose,
  onSelectComponent,
}: ComponentPickerModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] =
    React.useState<string>(initialCategory)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Reset search/category and focus input whenever modal opens
  React.useEffect(() => {
    if (!isOpen) return
    setSearchQuery("")
    setSelectedCategory(initialCategory)
    const raf = requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [isOpen, initialCategory])

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [isOpen, onClose])

  const trimmedQuery = searchQuery.trim()

  const filteredItems = React.useMemo(() => {
    if (selectedCategory === "icons") return []
    const q = trimmedQuery.toLowerCase()
    return COMPONENT_PRESETS.filter((item) => {
      // When typing a search query, search across all preset categories so matches aren't hidden by an active filter pill
      if (!q && selectedCategory !== "all" && item.category !== selectedCategory) {
        return false
      }
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    })
  }, [selectedCategory, trimmedQuery])

  const matchingIcons = React.useMemo(() => {
    if (selectedCategory !== "icons") return []
    if (!trimmedQuery) return ALL_TABLER_ICON_NAMES
    const q = trimmedQuery.toLowerCase().replace(/^icon/, "")
    return ALL_TABLER_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(q)
    )
  }, [selectedCategory, trimmedQuery])

  const customResolvedType = React.useMemo(() => {
    if (!trimmedQuery || selectedCategory === "icons") return null
    const resolved = resolveComponent(trimmedQuery)
    return resolved ? trimmedQuery : null
  }, [trimmedQuery, selectedCategory])

  if (!isOpen) return null

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-md duration-150 fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[85vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-[min(var(--radius-4xl),28px)] border border-border/80 bg-card shadow-2xl duration-150 zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconBook className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                {positionLabel && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 font-mono text-[10px]"
                  >
                    {positionLabel}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {description ||
                  "Select a section layout, container, or component to insert."}
              </p>
            </div>
          </div>

          <Button
            size="icon-xs"
            variant="ghost"
            onPress={onClose}
            aria-label="Close picker"
          >
            <IconX className="size-4" />
          </Button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="space-y-3 border-b border-border/40 bg-muted/10 px-6 pt-4 pb-3">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              placeholder={
                selectedCategory === "icons"
                  ? "Search 3,500+ Tabler icons (e.g. sparkles, arrow, shield)..."
                  : "Search components, layouts, HTML tags, or custom types..."
              }
              className="h-9 rounded-xl bg-background ps-9 pe-8 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("")
                  searchInputRef.current?.focus()
                }}
                aria-label="Clear search"
                className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <IconX className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {PICKER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-primary font-semibold text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
            {trimmedQuery && selectedCategory !== "all" && selectedCategory !== "icons" && (
              <span className="ms-auto text-[10px] text-muted-foreground">
                Searching all presets
              </span>
            )}
          </div>
        </div>

        {/* Component Grid List / Icon Browser */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedCategory === "icons" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{matchingIcons.length} matching icons</span>
                <span>Click any icon to insert</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {matchingIcons.slice(0, 120).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onSelectComponent({
                        type: "Icon",
                        props: { name: iconName, className: "size-5" },
                      })
                      onClose()
                    }}
                    title={iconName}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border/60 bg-background p-3 text-center transition-all hover:border-primary/60 hover:bg-primary/5"
                  >
                    <DynamicIcon
                      name={iconName}
                      className="size-5 text-foreground transition-colors group-hover:text-primary"
                    />
                    <span className="mt-1.5 w-full truncate text-[10px] text-muted-foreground group-hover:text-foreground">
                      {iconName.replace(/^Icon/, "")}
                    </span>
                  </button>
                ))}
              </div>
              {matchingIcons.length > 120 && (
                <p className="text-center text-[11px] text-muted-foreground">
                  Showing first 120 of {matchingIcons.length} icons. Refine search to narrow down.
                </p>
              )}
              {matchingIcons.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No Tabler icons matching &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filteredItems.map((item) => {
                  const IconComp = resolveTablerIcon(item.icon) || IconSparkles
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectComponent(item.getNode())
                        onClose()
                      }}
                      className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-3.5 text-start transition-all duration-150 hover:border-primary/60 hover:bg-primary/5"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 transition-colors group-hover:bg-primary/10">
                        <IconComp className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                            {item.name}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-3.5 px-1 font-mono text-[9px] uppercase"
                          >
                            {item.category}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {customResolvedType && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectComponent({ type: customResolvedType })
                    onClose()
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-start transition-colors hover:bg-primary/10"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Insert raw{" "}
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-primary">
                        &lt;{customResolvedType}&gt;
                      </code>{" "}
                      component
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Resolved directly from the IRIS registry, HTML tags, or Tabler icons.
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                    Custom
                  </Badge>
                </button>
              )}

              {filteredItems.length === 0 && !customResolvedType && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No components matching &quot;{searchQuery}&quot;. Try searching a category or switch to Icons.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-3 text-[11px] text-muted-foreground">
          <span>Click any item to insert immediately.</span>
          <Button size="xs" variant="ghost" onPress={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
