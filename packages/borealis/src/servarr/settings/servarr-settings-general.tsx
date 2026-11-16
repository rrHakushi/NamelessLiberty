"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { IconCopy, IconPlus, IconTrash } from "@tabler/icons-react"
import { servarrRequest, type ServarrApp } from "../servarr-client"

export function ServarrSettingsTags({ app }: { app: ServarrApp }) {
  const [tags, setTags] = useState<any[]>([])
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await servarrRequest<any[]>(app, "tags/detail")
    if (res.success && Array.isArray(res.data)) setTags(res.data)
    setLoading(false)
  }, [app])

  useEffect(() => {
    void load()
  }, [load])

  const handleAdd = async () => {
    if (!newTag.trim()) return
    await servarrRequest(app, "rules/tag", {
      method: "POST",
      body: JSON.stringify({ label: newTag.trim() }),
    })
    setNewTag("")
    await load()
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 text-start">
      <CardHeader>
        <CardTitle className="text-sm text-zinc-200">Tags & Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New tag label"
            className="max-w-xs bg-zinc-950 border-zinc-800"
          />
          <Button onPress={handleAdd} className="gap-1.5">
            <IconPlus className="size-4" />
            Add Tag
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((t) => {
            const mediaCount = t.movieIds?.length ?? t.seriesIds?.length ?? 0
            return (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-zinc-100">{t.label}</div>
                  <div className="text-zinc-400">
                    {mediaCount} items · {t.indexerIds?.length ?? 0} indexers
                  </div>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `rules/tag/${t.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  <IconTrash className="size-3.5 text-red-400" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ServarrSettingsConfigForm({
  app,
  section,
  title,
}: {
  app: ServarrApp
  section: "general" | "ui"
  title: string
}) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await servarrRequest(app, `config/${section}`)
    if (res.success) setData(res.data)
    setLoading(false)
  }, [app, section])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    await servarrRequest(app, `config/${section}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
    setSaving(false)
    await load()
  }

  if (loading || !data) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  const keys = Object.keys(data).filter((k) => k !== "id")

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 text-start">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-zinc-200">{title}</CardTitle>
        <Button size="xs" disabled={saving} onPress={handleSave}>
          {saving && <Spinner className="me-1.5 size-3.5" />}
          Save Settings
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {keys.map((key) => {
          const val = data[key]
          if (typeof val === "boolean") {
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5"
              >
                <Label className="text-xs capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </Label>
                <Switch
                  isSelected={val}
                  onChange={(v) =>
                    setData((p: any) => ({ ...p, [key]: v }))
                  }
                />
              </div>
            )
          }
          const isApiKey = key.toLowerCase() === "apikey"
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </Label>
                {isApiKey && <Badge variant="outline">Secret</Badge>}
              </div>
              <div className="flex gap-1.5">
                <Input
                  type={
                    typeof val === "number"
                      ? "number"
                      : key.toLowerCase().includes("password") ||
                          key.toLowerCase().includes("secret")
                        ? "password"
                        : "text"
                  }
                  value={val === null || val === undefined ? "" : String(val)}
                  onChange={(e) =>
                    setData((p: any) => ({
                      ...p,
                      [key]:
                        typeof val === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                    }))
                  }
                  className="flex-1 bg-zinc-950 border-zinc-800 text-xs"
                />
                {isApiKey && (
                  <Button
                    size="icon"
                    variant="outline"
                    onPress={() => navigator.clipboard?.writeText(String(val))}
                  >
                    <IconCopy className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
