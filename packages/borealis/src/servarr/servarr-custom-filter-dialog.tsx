"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { servarrRequest, type ServarrApp } from "./servarr-client"

export interface ServarrCustomFilterRule {
  key: string
  type: "equal" | "notEqual" | "contains" | "notContains" | "greaterThan" | "lessThan"
  value: string
}

export interface ServarrCustomFilter {
  id?: number
  type: string
  label: string
  filters: ServarrCustomFilterRule[]
}

export function applyServarrCustomFilter(
  items: any[],
  filter: ServarrCustomFilter | null
): any[] {
  if (!filter || !Array.isArray(filter.filters) || filter.filters.length === 0) {
    return items
  }

  return items.filter((item) =>
    filter.filters.every((rule) => {
      const raw = item?.[rule.key]
      const target = String(rule.value ?? "").toLowerCase()
      if (rule.type === "greaterThan") return Number(raw ?? 0) > Number(rule.value ?? 0)
      if (rule.type === "lessThan") return Number(raw ?? 0) < Number(rule.value ?? 0)

      const strVal = Array.isArray(raw)
        ? raw.map((x) => String(x)).join(",").toLowerCase()
        : String(raw ?? "").toLowerCase()

      switch (rule.type) {
        case "equal":
          return strVal === target
        case "notEqual":
          return strVal !== target
        case "contains":
          return strVal.includes(target)
        case "notContains":
          return !strVal.includes(target)
        default:
          return true
      }
    })
  )
}

export interface ServarrCustomFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  app: ServarrApp
  initialFilter?: ServarrCustomFilter | null
  onSaved: () => void
}

const FILTER_KEYS = [
  { value: "monitored", label: "Monitored (true/false)" },
  { value: "hasFile", label: "Has File (true/false)" },
  { value: "qualityProfile", label: "Quality Profile" },
  { value: "status", label: "Status" },
  { value: "year", label: "Year" },
  { value: "genres", label: "Genres" },
  { value: "path", label: "Path" },
  { value: "sizeOnDisk", label: "Size On Disk (bytes)" },
]

export function ServarrCustomFilterDialog({
  isOpen,
  onClose,
  app,
  initialFilter,
  onSaved,
}: ServarrCustomFilterDialogProps) {
  const [label, setLabel] = useState(initialFilter?.label ?? "")
  const [rules, setRules] = useState<ServarrCustomFilterRule[]>(
    initialFilter?.filters ?? [{ key: "monitored", type: "equal", value: "true" }]
  )
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setLabel(initialFilter?.label ?? "")
      setRules(
        initialFilter?.filters?.length
          ? initialFilter.filters
          : [{ key: "monitored", type: "equal", value: "true" }]
      )
    }
  }, [isOpen, initialFilter])

  const handleSave = async () => {
    if (!label.trim()) return
    setSaving(true)
    const payload: ServarrCustomFilter = {
      ...(initialFilter?.id ? { id: initialFilter.id } : {}),
      type: app === "radarr" ? "movie" : "series",
      label: label.trim(),
      filters: rules,
    }
    const res = await servarrRequest(
      app,
      initialFilter?.id
        ? `rules/customfilter/${initialFilter.id}`
        : "rules/customfilter",
      {
        method: initialFilter?.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }
    )
    setSaving(false)
    if (res.success) {
      onSaved()
      onClose()
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(o) => !o && onClose()}
      className="max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
    >
      <DialogHeader>
          <DialogTitle className="text-start">
            {initialFilter?.id ? "Edit Custom Filter" : "New Custom Filter"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5 text-start">
            <Label className="text-xs">Filter Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Missing 4K Movies"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Conditions (all must match)</Label>
              <Button
                size="xs"
                variant="outline"
                onPress={() =>
                  setRules((prev) => [
                    ...prev,
                    { key: "status", type: "contains", value: "" },
                  ])
                }
                className="gap-1"
              >
                <IconPlus className="size-3.5" />
                Add Rule
              </Button>
            </div>

            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  selectedKey={rule.key}
                  onSelectionChange={(v) =>
                    setRules((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, key: String(v) } : r))
                    )
                  }
                >
                  <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectList>
                      {FILTER_KEYS.map((k) => (
                        <SelectItem key={k.value} id={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectList>
                  </SelectContent>
                </Select>

                <Select
                  selectedKey={rule.type}
                  onSelectionChange={(v) =>
                    setRules((prev) =>
                      prev.map((r, i) =>
                        i === idx
                          ? { ...r, type: String(v) as ServarrCustomFilterRule["type"] }
                          : r
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-32 bg-zinc-900 border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectList>
                      <SelectItem id="equal">Equals</SelectItem>
                      <SelectItem id="notEqual">Not Equal</SelectItem>
                      <SelectItem id="contains">Contains</SelectItem>
                      <SelectItem id="notContains">Not Contains</SelectItem>
                      <SelectItem id="greaterThan">Greater Than</SelectItem>
                      <SelectItem id="lessThan">Less Than</SelectItem>
                    </SelectList>
                  </SelectContent>
                </Select>

                <Input
                  value={rule.value}
                  onChange={(e) =>
                    setRules((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, value: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Value"
                  className="flex-1 bg-zinc-900 border-zinc-800"
                />

                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    setRules((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <IconTrash className="size-3.5 text-zinc-400" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || !label.trim()} onPress={handleSave}>
            Save Filter
          </Button>
        </DialogFooter>
    </Dialog>
  )
}
