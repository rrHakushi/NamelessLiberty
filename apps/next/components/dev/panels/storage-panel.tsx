"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

type StorageKind = "local" | "session" | "cookies"

interface StorageEntry {
  key: string
  value: string
}

function readStorage(kind: StorageKind): StorageEntry[] {
  if (typeof window === "undefined") return []
  try {
    if (kind === "cookies") {
      if (!document.cookie) return []
      return document.cookie
        .split(";")
        .map((c) => {
          const idx = c.indexOf("=")
          if (idx === -1) return { key: c.trim(), value: "" }
          const key = decodeURIComponent(c.slice(0, idx).trim())
          const value = decodeURIComponent(c.slice(idx + 1).trim())
          return { key, value }
        })
        .sort((a, b) => a.key.localeCompare(b.key))
    }

    const store = kind === "local" ? window.localStorage : window.sessionStorage
    const entries: StorageEntry[] = []
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)
      if (key !== null) {
        entries.push({ key, value: store.getItem(key) ?? "" })
      }
    }
    return entries.sort((a, b) => a.key.localeCompare(b.key))
  } catch {
    return []
  }
}

function writeStorageItem(kind: StorageKind, key: string, value: string) {
  if (kind === "cookies") {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/`
  } else {
    const store = kind === "local" ? window.localStorage : window.sessionStorage
    store.setItem(key, value)
  }
}

function removeStorageItem(kind: StorageKind, key: string) {
  if (kind === "cookies") {
    document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0`
  } else {
    const store = kind === "local" ? window.localStorage : window.sessionStorage
    store.removeItem(key)
  }
}

export function StoragePanel() {
  const [kind, setKind] = useState<StorageKind>("local")
  const [entries, setEntries] = useState<StorageEntry[]>([])
  const [query, setQuery] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [adding, setAdding] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")

  const refresh = useCallback(() => {
    setEntries(readStorage(kind))
  }, [kind])

  useEffect(() => {
    refresh()
    setEditingKey(null)
    setAdding(false)
  }, [refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q)
    )
  }, [entries, query])

  const handleSaveEdit = (key: string) => {
    writeStorageItem(kind, key, editValue)
    setEditingKey(null)
    refresh()
  }

  const handleAdd = () => {
    if (!newKey.trim()) return
    writeStorageItem(kind, newKey.trim(), newValue)
    setNewKey("")
    setNewValue("")
    setAdding(false)
    refresh()
  }

  const handleDelete = (key: string) => {
    removeStorageItem(kind, key)
    refresh()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2">
        <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-[11px]">
          {(
            [
              { id: "local", label: "localStorage" },
              { id: "session", label: "sessionStorage" },
              { id: "cookies", label: "Cookies" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={cn(
                "rounded px-2 py-0.5 font-mono transition-colors",
                kind === item.id
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[140px] flex-1">
          <IconSearch className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter keys..."
            className="h-7 ps-8 pe-7 font-mono text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3" />
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => setAdding((v) => !v)}
          className="h-7 gap-1 px-2 text-xs"
          aria-label="Add entry"
        >
          <IconPlus className="size-3.5" />
          <span>Add</span>
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={refresh}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
          aria-label="Refresh"
        >
          <IconRefresh className="size-3.5" />
        </Button>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/30 px-3 py-2">
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key"
            className="h-7 min-w-[120px] flex-1 font-mono text-xs"
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="h-7 min-w-[160px] flex-[2] font-mono text-xs"
          />
          <Button size="xs" onClick={handleAdd} className="h-7 px-2.5 text-xs">
            Save
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setAdding(false)}
            className="h-7 px-2 text-xs"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Entries */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 font-mono text-xs text-muted-foreground">
            No entries found.
          </div>
        ) : (
          filtered.map((entry) => {
            const isEditing = editingKey === entry.key
            return (
              <div
                key={entry.key}
                className="flex items-start gap-2 border-b border-border/40 px-3 py-2 font-mono text-[11px] hover:bg-muted/30"
              >
                <span className="w-1/3 shrink-0 truncate font-semibold text-foreground">
                  {entry.key}
                </span>

                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-6 flex-1 font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(entry.key)}
                        className="rounded p-1 text-emerald-400 hover:bg-muted"
                        title="Save"
                      >
                        <IconCheck className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted"
                        title="Cancel"
                      >
                        <IconX className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="break-all text-muted-foreground">
                      {entry.value || <em className="opacity-50">(empty)</em>}
                    </span>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingKey(entry.key)
                        setEditValue(entry.value)
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Edit"
                    >
                      <IconEdit className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.key)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-rose-400"
                      title="Delete"
                    >
                      <IconTrash className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
