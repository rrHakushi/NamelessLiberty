"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  IconArrowDown,
  IconArrowUp,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { servarrRequest, type ServarrApp } from "../servarr-client"

export function ServarrSettingsProfiles({ app }: { app: ServarrApp }) {
  const [qualityProfiles, setQualityProfiles] = useState<any[]>([])
  const [qpSchema, setQpSchema] = useState<any>(null)
  const [delayProfiles, setDelayProfiles] = useState<any[]>([])
  const [releaseProfiles, setReleaseProfiles] = useState<any[]>([])
  const [qualityDefs, setQualityDefs] = useState<any[]>([])
  const [editingQp, setEditingQp] = useState<any | null>(null)
  const [editingRp, setEditingRp] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [qp, schema, dp, rp, qd] = await Promise.all([
      servarrRequest<any[]>(app, "rules/qualityprofile"),
      servarrRequest<any>(app, "rules/qualityprofile/schema"),
      servarrRequest<any[]>(app, "rules/delayprofile"),
      servarrRequest<any[]>(app, "rules/releaseprofile"),
      servarrRequest<any[]>(app, "rules/qualitydefinition"),
    ])
    if (qp.success && Array.isArray(qp.data)) setQualityProfiles(qp.data)
    if (schema.success) setQpSchema(schema.data)
    if (dp.success && Array.isArray(dp.data)) setDelayProfiles(dp.data)
    if (rp.success && Array.isArray(rp.data)) setReleaseProfiles(rp.data)
    if (qd.success && Array.isArray(qd.data)) setQualityDefs(qd.data)
    setLoading(false)
  }, [app])

  useEffect(() => {
    void load()
  }, [load])

  const saveQualityProfile = async () => {
    if (!editingQp) return
    setSaving(true)
    const isEdit = Boolean(editingQp.id)
    await servarrRequest(
      app,
      isEdit ? `rules/qualityprofile/${editingQp.id}` : "rules/qualityprofile",
      {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(editingQp),
      }
    )
    setSaving(false)
    setEditingQp(null)
    await load()
  }

  const saveReleaseProfile = async () => {
    if (!editingRp) return
    setSaving(true)
    const isEdit = Boolean(editingRp.id)
    await servarrRequest(
      app,
      isEdit ? `rules/releaseprofile/${editingRp.id}` : "rules/releaseprofile",
      {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(editingRp),
      }
    )
    setSaving(false)
    setEditingRp(null)
    await load()
  }

  const saveQualityDefinitions = async () => {
    setSaving(true)
    await servarrRequest(app, "rules/qualitydefinition/bulk", {
      method: "PUT",
      body: JSON.stringify(qualityDefs),
    })
    setSaving(false)
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
    <div className="space-y-6 text-start">
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-zinc-200">Quality Profiles</CardTitle>
          <Button
            size="xs"
            onPress={() =>
              setEditingQp(
                qpSchema
                  ? { ...structuredClone(qpSchema), name: "New Profile" }
                  : { name: "New Profile", upgradeAllowed: true, items: [] }
              )
            }
            className="gap-1"
          >
            <IconPlus className="size-3.5" />
            Add Profile
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {qualityProfiles.map((qp) => (
            <div
              key={qp.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">{qp.name}</div>
                <div className="text-zinc-400">
                  {qp.upgradeAllowed ? "Upgrades allowed" : "No upgrades"} · Min CF:{" "}
                  {qp.minFormatScore ?? 0}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() => setEditingQp(structuredClone(qp))}
                >
                  <IconEdit className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `rules/qualityprofile/${qp.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  <IconTrash className="size-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-zinc-200">
            {app === "sonarr"
              ? "Quality Definitions (v5 titles; size limits are per Quality Profile)"
              : "Quality Definitions (MB/min)"}
          </CardTitle>
          <Button size="xs" disabled={saving} onPress={saveQualityDefinitions}>
            Save Definitions
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {qualityDefs.map((qd, idx) => (
            <div
              key={qd.id}
              className="grid grid-cols-1 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs sm:grid-cols-4"
            >
              <Input
                value={qd.title ?? ""}
                onChange={(e) =>
                  setQualityDefs((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, title: e.target.value } : x
                    )
                  )
                }
                className="h-7 bg-zinc-900 border-zinc-800 text-xs"
              />
              {app === "radarr" ? (
                <>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={qd.minSize ?? 0}
                    onChange={(e) =>
                      setQualityDefs((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, minSize: Number(e.target.value) } : x
                        )
                      )
                    }
                    className="h-7 bg-zinc-900 border-zinc-800 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={qd.maxSize ?? 0}
                    onChange={(e) =>
                      setQualityDefs((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, maxSize: Number(e.target.value) } : x
                        )
                      )
                    }
                    className="h-7 bg-zinc-900 border-zinc-800 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Preferred"
                    value={qd.preferredSize ?? 0}
                    onChange={(e) =>
                      setQualityDefs((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, preferredSize: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                    className="h-7 bg-zinc-900 border-zinc-800 text-xs"
                  />
                </>
              ) : (
                <div className="col-span-3 text-zinc-400">
                  Weight: {qd.weight} · Edit sizes inside Quality Profiles above
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-200">Delay Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {delayProfiles.map((dp, idx) => (
            <div
              key={dp.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">
                  {dp.preferredProtocol || "Usenet/Torrent"} · Order {dp.order}
                </div>
                <div className="text-zinc-400">
                  Usenet: {dp.usenetDelay}m · Torrent: {dp.torrentDelay}m
                </div>
              </div>
              <div className="flex items-center gap-1">
                {idx > 0 && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() =>
                      servarrRequest(
                        app,
                        `rules/delayprofile/reorder/${dp.id}?moveTo=${delayProfiles[idx - 1].id}`,
                        { method: "PUT" }
                      ).then(load)
                    }
                  >
                    <IconArrowUp className="size-3.5" />
                  </Button>
                )}
                {idx < delayProfiles.length - 1 && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() =>
                      servarrRequest(
                        app,
                        `rules/delayprofile/reorder/${dp.id}?moveTo=${delayProfiles[idx + 1].id}`,
                        { method: "PUT" }
                      ).then(load)
                    }
                  >
                    <IconArrowDown className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-zinc-200">Release Profiles</CardTitle>
          <Button
            size="xs"
            onPress={() =>
              setEditingRp({
                name: "",
                enabled: true,
                required: [],
                ignored: [],
                tags: [],
              })
            }
            className="gap-1"
          >
            <IconPlus className="size-3.5" />
            Add Release Profile
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {releaseProfiles.map((rp) => (
            <div
              key={rp.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">
                  {rp.name || `Profile #${rp.id}`}
                </div>
                <div className="text-zinc-400">
                  Required: {(rp.required || []).join(", ") || "None"} · Ignored:{" "}
                  {(rp.ignored || []).join(", ") || "None"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={rp.enabled ? "default" : "secondary"}>
                  {rp.enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() => setEditingRp(structuredClone(rp))}
                >
                  <IconEdit className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `rules/releaseprofile/${rp.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  <IconTrash className="size-3.5 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        isOpen={Boolean(editingQp)}
        onOpenChange={(o) => !o && setEditingQp(null)}
        className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-start">
            {editingQp?.id ? `Edit ${editingQp.name}` : "New Quality Profile"}
          </DialogTitle>
        </DialogHeader>
        {editingQp && (
          <ScrollArea className="max-h-[65vh] pe-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={editingQp.name ?? ""}
                    onChange={(e) =>
                      setEditingQp((p: any) => ({ ...p, name: e.target.value }))
                    }
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <Label className="text-xs">Upgrades Allowed</Label>
                  <Switch
                    isSelected={Boolean(editingQp.upgradeAllowed)}
                    onChange={(v) =>
                      setEditingQp((p: any) => ({ ...p, upgradeAllowed: v }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  Qualities {app === "sonarr" && "(Sonarr v5 per-quality min/max/preferred MB/min)"}
                </Label>
                <div className="space-y-1.5">
                  {(editingQp.items ?? []).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 text-xs"
                    >
                      <Switch
                        isSelected={Boolean(item.allowed)}
                        onChange={(v) =>
                          setEditingQp((p: any) => ({
                            ...p,
                            items: p.items.map((x: any, i: number) =>
                              i === idx ? { ...x, allowed: v } : x
                            ),
                          }))
                        }
                      />
                      <span className="min-w-32 flex-1 font-medium text-zinc-200">
                        {item.name || item.quality?.name}
                      </span>
                      {app === "sonarr" && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={item.minSize ?? ""}
                            onChange={(e) =>
                              setEditingQp((p: any) => ({
                                ...p,
                                items: p.items.map((x: any, i: number) =>
                                  i === idx
                                    ? {
                                      ...x,
                                      minSize:
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                    }
                                    : x
                                ),
                              }))
                            }
                            className="h-7 w-16 bg-zinc-950 border-zinc-800 text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={item.maxSize ?? ""}
                            onChange={(e) =>
                              setEditingQp((p: any) => ({
                                ...p,
                                items: p.items.map((x: any, i: number) =>
                                  i === idx
                                    ? {
                                      ...x,
                                      maxSize:
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                    }
                                    : x
                                ),
                              }))
                            }
                            className="h-7 w-16 bg-zinc-950 border-zinc-800 text-xs"
                          />
                          <Input
                            type="number"
                            placeholder="Pref"
                            value={item.preferredSize ?? ""}
                            onChange={(e) =>
                              setEditingQp((p: any) => ({
                                ...p,
                                items: p.items.map((x: any, i: number) =>
                                  i === idx
                                    ? {
                                      ...x,
                                      preferredSize:
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                    }
                                    : x
                                ),
                              }))
                            }
                            className="h-7 w-16 bg-zinc-950 border-zinc-800 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onPress={() => setEditingQp(null)}>
            Cancel
          </Button>
          <Button disabled={saving} onPress={saveQualityProfile}>
            Save Profile
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={Boolean(editingRp)}
        onOpenChange={(o) => !o && setEditingRp(null)}
        className="max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
      >
        <DialogHeader>
          <DialogTitle className="text-start">Release Profile</DialogTitle>
        </DialogHeader>
        {editingRp && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={editingRp.name ?? ""}
                onChange={(e) =>
                  setEditingRp((p: any) => ({ ...p, name: e.target.value }))
                }
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Must Contain (comma-separated)</Label>
              <Input
                value={(editingRp.required ?? []).join(", ")}
                onChange={(e) =>
                  setEditingRp((p: any) => ({
                    ...p,
                    required: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Must Not Contain (comma-separated)</Label>
              <Input
                value={(editingRp.ignored ?? []).join(", ")}
                onChange={(e) =>
                  setEditingRp((p: any) => ({
                    ...p,
                    ignored: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }))
                }
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <Label className="text-xs">Enabled</Label>
              <Switch
                isSelected={Boolean(editingRp.enabled)}
                onChange={(v) =>
                  setEditingRp((p: any) => ({ ...p, enabled: v }))
                }
              />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onPress={() => setEditingRp(null)}>
            Cancel
          </Button>
          <Button disabled={saving} onPress={saveReleaseProfile}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
