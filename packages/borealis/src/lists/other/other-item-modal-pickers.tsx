"use client"

import React, { useState, useEffect } from "react"
import { elysia } from "@/lib/elysia"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

export function ChipInput({
  label,
  values,
  onChange,
  placeholder = "Type and press Enter...",
  suggestions = [],
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  suggestions?: string[]
}) {
  const [draft, setDraft] = useState("")

  const addValue = (raw: string) => {
    const clean = raw.trim()
    if (!clean) return
    if (!values.some((v) => v.toLowerCase() === clean.toLowerCase())) {
      onChange([...values, clean])
    }
    setDraft("")
  }

  const filteredSuggestions = draft.trim()
    ? suggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(draft.trim().toLowerCase()) &&
            !values.some((v) => v.toLowerCase() === s.toLowerCase())
        )
        .slice(0, 8)
    : []

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addValue(draft)
            }
          }}
          placeholder={placeholder}
          className="h-8 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 px-2.5 text-xs"
          onClick={() => addValue(draft)}
          disabled={!draft.trim()}
        >
          <IconPlus className="size-3.5" aria-hidden="true" />
          <span className="ms-1">Add</span>
        </Button>
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 rounded-lg border border-border/50 bg-muted/40 p-1.5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addValue(s)}
              className="rounded-md bg-background px-2 py-0.5 text-[11px] text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {values.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="gap-1 pe-1 text-[11px] font-normal"
            >
              <span>{v}</span>
              <button
                type="button"
                onClick={() => onChange(values.filter((item) => item !== v))}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                aria-label={`Remove ${v}`}
              >
                <IconX className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export interface LinkedCharacterRow {
  characterId: number
  name: string
  image?: string | null
  role: "MAIN" | "SUPPORTING" | "BACKGROUND"
  actorId?: number | null
  actorName?: string | null
}

export interface LinkedStaffRow {
  personId: number
  name: string
  image?: string | null
  role: string
  customRole?: string | null
}

export interface LinkedStudioRow {
  studioId: number
  name: string
  isMain: boolean
}

export interface LinkedRelationRow {
  targetType: "ANIME" | "MANGA" | "MOVIE" | "TV" | "GAME" | "BOOK" | "MUSIC" | "OTHER"
  targetId: number
  title: string
  coverImage?: string | null
  relationType: string
}

export function EntitySearchPicker({
  placeholder,
  onSearch,
  onSelect,
}: {
  placeholder: string
  onSearch: (q: string) => Promise<Array<{ id: number; label: string; sublabel?: string | null; image?: string | null }>>
  onSelect: (item: { id: number; label: string; sublabel?: string | null; image?: string | null }) => void
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ id: number; label: string; sublabel?: string | null; image?: string | null }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const clean = query.trim()
    if (clean.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const items = await onSearch(clean)
        setResults(items)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 260)
    return () => clearTimeout(timer)
  }, [query, onSearch])

  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="relative">
        <IconSearch className="pointer-events-none absolute start-2.5 top-2 size-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 ps-8 text-xs"
        />
      </div>
      {loading && (
        <span className="text-[11px] text-muted-foreground">Searching...</span>
      )}
      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelect(r)
                setQuery("")
                setResults([])
              }}
              className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-xs hover:bg-accent"
            >
              <div className="flex min-w-0 items-center gap-2">
                {r.image ? (
                  <img
                    src={r.image}
                    alt=""
                    className="size-6 shrink-0 rounded object-cover"
                  />
                ) : null}
                <span className="truncate font-medium">{r.label}</span>
              </div>
              {r.sublabel && (
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {r.sublabel}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const RELATION_TYPES = [
  "ADAPTATION",
  "PREQUEL",
  "SEQUEL",
  "PARENT",
  "SIDE_STORY",
  "CHARACTER",
  "SUMMARY",
  "ALTERNATIVE",
  "SPIN_OFF",
  "OTHER",
]

export const STAFF_ROLES = [
  "DIRECTOR",
  "WRITER",
  "PRODUCER",
  "COMPOSER",
  "ARTIST",
  "AUTHOR",
  "ILLUSTRATOR",
  "DEVELOPER",
  "DESIGNER",
  "VOICE_ACTOR",
  "CAST",
  "OTHER",
]

export function OneWayCreditsPickers({
  characters,
  setCharacters,
  staff,
  setStaff,
  studios,
  setStudios,
  relations,
  setRelations,
}: {
  characters: LinkedCharacterRow[]
  setCharacters: React.Dispatch<React.SetStateAction<LinkedCharacterRow[]>>
  staff: LinkedStaffRow[]
  setStaff: React.Dispatch<React.SetStateAction<LinkedStaffRow[]>>
  studios: LinkedStudioRow[]
  setStudios: React.Dispatch<React.SetStateAction<LinkedStudioRow[]>>
  relations: LinkedRelationRow[]
  setRelations: React.Dispatch<React.SetStateAction<LinkedRelationRow[]>>
}) {
  const [relationTargetType, setRelationTargetType] =
    useState<LinkedRelationRow["targetType"]>("ANIME")

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
        Links to existing database Characters, People, Studios, and Media are{" "}
        <span className="font-semibold text-foreground">strictly one-way</span>:
        they appear only on this Other item and will never show up on those
        target pages.
      </div>

      {/* Studios */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold">Studios / Organizations</Label>
        <EntitySearchPicker
          placeholder="Search existing studios..."
          onSearch={async (q) => {
            const res = await (elysia.borealis as any).studios.get({
              query: { search: q, limit: 10 },
            })
            const items = res.data?.items ?? []
            return items.map((s: any) => ({
              id: s.id,
              label: s.name,
              sublabel: s.isAnimationStudio ? "Animation Studio" : "Studio",
            }))
          }}
          onSelect={(item) => {
            if (studios.some((s) => s.studioId === item.id)) return
            setStudios((prev) => [
              ...prev,
              { studioId: item.id, name: item.label, isMain: prev.length === 0 },
            ])
          }}
        />
        {studios.map((st, idx) => (
          <div
            key={st.studioId}
            className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-xs"
          >
            <span className="truncate font-medium">{st.name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setStudios((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, isMain: !x.isMain } : x
                    )
                  )
                }
                className={`rounded px-2 py-0.5 text-[11px] ${
                  st.isMain
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {st.isMain ? "Main" : "Secondary"}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-destructive"
                onClick={() =>
                  setStudios((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <IconTrash className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Characters */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold">Characters</Label>
        <EntitySearchPicker
          placeholder="Search existing characters..."
          onSearch={async (q) => {
            const res = await (elysia.borealis as any).characters.get({
              query: { search: q, limit: 10 },
            })
            const items = res.data?.items ?? []
            return items.map((c: any) => ({
              id: c.id,
              label: c.namePrimary,
              sublabel: c.nameNative || null,
              image: c.image || null,
            }))
          }}
          onSelect={(item) => {
            if (characters.some((c) => c.characterId === item.id)) return
            setCharacters((prev) => [
              ...prev,
              {
                characterId: item.id,
                name: item.label,
                image: item.image,
                role: "MAIN",
              },
            ])
          }}
        />
        {characters.map((ch, idx) => (
          <div
            key={`${ch.characterId}-${idx}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-xs"
          >
            <span className="truncate font-medium">{ch.name}</span>
            <div className="flex items-center gap-2">
              <Select
                selectedKey={ch.role}
                onSelectionChange={(k) =>
                  setCharacters((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, role: String(k) as any } : x
                    )
                  )
                }
                aria-label="Character role"
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem id="MAIN">Main</SelectItem>
                  <SelectItem id="SUPPORTING">Supporting</SelectItem>
                  <SelectItem id="BACKGROUND">Background</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-destructive"
                onClick={() =>
                  setCharacters((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <IconTrash className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Staff / Credits */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-semibold">Staff & Credits</Label>
        <EntitySearchPicker
          placeholder="Search existing people..."
          onSearch={async (q) => {
            const res = await (elysia.borealis as any).people.get({
              query: { search: q, limit: 10 },
            })
            const items = res.data?.items ?? []
            return items.map((p: any) => ({
              id: p.id,
              label: p.namePrimary,
              sublabel: p.nameNative || null,
              image: p.image || null,
            }))
          }}
          onSelect={(item) => {
            setStaff((prev) => [
              ...prev,
              {
                personId: item.id,
                name: item.label,
                image: item.image,
                role: "OTHER",
                customRole: "",
              },
            ])
          }}
        />
        {staff.map((st, idx) => (
          <div
            key={`${st.personId}-${idx}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-xs"
          >
            <span className="truncate font-medium">{st.name}</span>
            <div className="flex items-center gap-2">
              <Select
                selectedKey={st.role}
                onSelectionChange={(k) =>
                  setStaff((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, role: String(k) } : x
                    )
                  )
                }
                aria-label="Staff role"
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_ROLES.map((r) => (
                    <SelectItem key={r} id={r}>
                      {r.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={st.customRole ?? ""}
                onChange={(e) =>
                  setStaff((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, customRole: e.target.value } : x
                    )
                  )
                }
                placeholder="Custom role..."
                className="h-7 w-28 text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-destructive"
                onClick={() =>
                  setStaff((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <IconTrash className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Media Relations */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold">Cross-Media Relations</Label>
          <Select
            selectedKey={relationTargetType}
            onSelectionChange={(k) => setRelationTargetType(String(k) as any)}
            aria-label="Target media type"
          >
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem id="ANIME">Anime</SelectItem>
              <SelectItem id="MANGA">Manga</SelectItem>
              <SelectItem id="MOVIE">Movie</SelectItem>
              <SelectItem id="TV">TV</SelectItem>
              <SelectItem id="GAME">Game</SelectItem>
              <SelectItem id="BOOK">Book</SelectItem>
              <SelectItem id="MUSIC">Music</SelectItem>
              <SelectItem id="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <EntitySearchPicker
          placeholder={`Search existing ${relationTargetType.toLowerCase()}...`}
          onSearch={async (q) => {
            const routeMap: Record<string, string> = {
              ANIME: "anime",
              MANGA: "manga",
              MOVIE: "movies",
              TV: "tv",
              GAME: "games",
              BOOK: "books",
              MUSIC: "music",
              OTHER: "other",
            }
            const route = routeMap[relationTargetType] ?? "anime"
            const res = await (elysia.borealis as any)[route].get({
              query: { search: q, limit: 10 },
            })
            const items = res.data?.items ?? []
            return items.map((m: any) => ({
              id: m.id,
              label: m.titlePrimary,
              sublabel: m.format || m.status || null,
              image: m.coverImage || null,
            }))
          }}
          onSelect={(item) => {
            setRelations((prev) => [
              ...prev,
              {
                targetType: relationTargetType,
                targetId: item.id,
                title: item.label,
                coverImage: item.image,
                relationType: "OTHER",
              },
            ])
          }}
        />
        {relations.map((rel, idx) => (
          <div
            key={`${rel.targetType}-${rel.targetId}-${idx}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-xs"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {rel.targetType}
              </Badge>
              <span className="truncate font-medium">{rel.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                selectedKey={rel.relationType}
                onSelectionChange={(k) =>
                  setRelations((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, relationType: String(k) } : x
                    )
                  )
                }
                aria-label="Relation type"
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((rt) => (
                    <SelectItem key={rt} id={rt}>
                      {rt.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-destructive"
                onClick={() =>
                  setRelations((prev) => prev.filter((_, i) => i !== idx))
                }
              >
                <IconTrash className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
