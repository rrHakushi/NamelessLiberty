"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"
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
  IconCopy,
  IconEdit,
  IconFileImport,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { servarrRequest, type ServarrApp } from "../servarr-client"
import { ServarrProviderModal, ServarrSchemaFields } from "../servarr-schema-form"

export function ServarrSettingsFormats({ app }: { app: ServarrApp }) {
  const [formats, setFormats] = useState<any[]>([])
  const [cfSchema, setCfSchema] = useState<any[]>([])
  const [autoTags, setAutoTags] = useState<any[]>([])
  const [atSchema, setAtSchema] = useState<any[]>([])
  const [editingCf, setEditingCf] = useState<any | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importJson, setImportJson] = useState("")
  const [importErr, setImportErr] = useState<string | null>(null)
  const [atModalItem, setAtModalItem] = useState<any | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [cf, cfs, at, ats] = await Promise.all([
      servarrRequest<any[]>(app, "rules/customformat"),
      servarrRequest<any[]>(app, "rules/customformat/schema"),
      servarrRequest<any[]>(app, "providers/autotagging"),
      servarrRequest<any[]>(app, "providers/autotagging/schema"),
    ])
    if (cf.success && Array.isArray(cf.data)) setFormats(cf.data)
    if (cfs.success && Array.isArray(cfs.data)) setCfSchema(cfs.data)
    if (at.success && Array.isArray(at.data)) setAutoTags(at.data)
    if (ats.success && Array.isArray(ats.data)) setAtSchema(ats.data)
    setLoading(false)
  }, [app])

  useEffect(() => {
    void load()
  }, [load])

  const handleSaveCf = async () => {
    if (!editingCf) return
    const isEdit = Boolean(editingCf.id)
    await servarrRequest(
      app,
      isEdit ? `rules/customformat/${editingCf.id}` : "rules/customformat",
      {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(editingCf),
      }
    )
    setEditingCf(null)
    await load()
  }

  const handleImportJson = async () => {
    setImportErr(null)
    try {
      const parsed = JSON.parse(importJson)
      const list = Array.isArray(parsed) ? parsed : [parsed]
      for (const cf of list) {
        const { id: _ignore, ...rest } = cf
        await servarrRequest(app, "rules/customformat", {
          method: "POST",
          body: JSON.stringify(rest),
        })
      }
      setImportOpen(false)
      setImportJson("")
      await load()
    } catch (err: any) {
      setImportErr(err?.message || "Invalid Custom Format JSON")
    }
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
        <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm text-zinc-200">Custom Formats</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onPress={() => setImportOpen(true)}
              className="gap-1"
            >
              <IconFileImport className="size-3.5" />
              Import JSON
            </Button>
            <Button
              size="xs"
              onPress={() =>
                setEditingCf({
                  name: "New Custom Format",
                  includeCustomFormatWhenRenaming: false,
                  specifications: [],
                })
              }
              className="gap-1"
            >
              <IconPlus className="size-3.5" />
              Add Custom Format
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {formats.map((cf) => (
            <div
              key={cf.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">{cf.name}</div>
                <div className="text-zinc-400">
                  {cf.specifications?.length ?? 0} conditions
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    navigator.clipboard?.writeText(JSON.stringify(cf, null, 2))
                  }
                  aria-label="Copy JSON"
                >
                  <IconCopy className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() => setEditingCf(structuredClone(cf))}
                >
                  <IconEdit className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `rules/customformat/${cf.id}`, {
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
          <CardTitle className="text-sm text-zinc-200">Auto Tagging</CardTitle>
          <Button size="xs" onPress={() => setAtModalItem(null)} className="gap-1">
            <IconPlus className="size-3.5" />
            Add Auto Tag
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {autoTags.map((at) => (
            <div
              key={at.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">{at.name}</div>
                <div className="text-zinc-400">
                  {at.specifications?.length ?? 0} specs ·{" "}
                  {at.removeTagsAutomatically ? "Auto-removes" : "Keep tags"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() => setAtModalItem(at)}
                >
                  <IconEdit className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `providers/autotagging/${at.id}`, {
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
        isOpen={Boolean(editingCf)}
        onOpenChange={(o) => !o && setEditingCf(null)}
        className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
      >
        <DialogHeader>
            <DialogTitle className="text-start">
              {editingCf?.id ? `Edit ${editingCf.name}` : "New Custom Format"}
            </DialogTitle>
          </DialogHeader>
          {editingCf && (
            <ScrollArea className="max-h-[65vh] pe-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={editingCf.name ?? ""}
                    onChange={(e) =>
                      setEditingCf((p: any) => ({ ...p, name: e.target.value }))
                    }
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                  <Label className="text-xs">Include Custom Format When Renaming</Label>
                  <Switch
                    isSelected={Boolean(editingCf.includeCustomFormatWhenRenaming)}
                    onChange={(v) =>
                      setEditingCf((p: any) => ({
                        ...p,
                        includeCustomFormatWhenRenaming: v,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Conditions</Label>
                    <div className="flex flex-wrap gap-1">
                      {cfSchema.map((spec) => (
                        <Button
                          key={spec.implementation}
                          size="xs"
                          variant="outline"
                          onPress={() =>
                            setEditingCf((p: any) => ({
                              ...p,
                              specifications: [
                                ...(p.specifications ?? []),
                                {
                                  ...structuredClone(spec),
                                  name: spec.implementationName || spec.implementation,
                                  negate: false,
                                  required: false,
                                },
                              ],
                            }))
                          }
                        >
                          + {spec.implementationName || spec.implementation}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {(editingCf.specifications ?? []).map((spec: any, idx: number) => (
                    <div
                      key={idx}
                      className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <Badge>{spec.implementationName || spec.implementation}</Badge>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onPress={() =>
                            setEditingCf((p: any) => ({
                              ...p,
                              specifications: p.specifications.filter(
                                (_: any, i: number) => i !== idx
                              ),
                            }))
                          }
                        >
                          <IconTrash className="size-3.5 text-red-400" />
                        </Button>
                      </div>
                      <Input
                        value={spec.name ?? ""}
                        onChange={(e) =>
                          setEditingCf((p: any) => ({
                            ...p,
                            specifications: p.specifications.map((s: any, i: number) =>
                              i === idx ? { ...s, name: e.target.value } : s
                            ),
                          }))
                        }
                        placeholder="Condition Name"
                        className="bg-zinc-950 border-zinc-800"
                      />
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={Boolean(spec.negate)}
                            onChange={(v) =>
                              setEditingCf((p: any) => ({
                                ...p,
                                specifications: p.specifications.map((s: any, i: number) =>
                                  i === idx ? { ...s, negate: v } : s
                                ),
                              }))
                            }
                          />
                          <Label className="text-xs">Negate</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={Boolean(spec.required)}
                            onChange={(v) =>
                              setEditingCf((p: any) => ({
                                ...p,
                                specifications: p.specifications.map((s: any, i: number) =>
                                  i === idx ? { ...s, required: v } : s
                                ),
                              }))
                            }
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                      </div>
                      {Array.isArray(spec.fields) && (
                        <ServarrSchemaFields
                          app={app}
                          fields={spec.fields}
                          onChange={(fieldName, val) =>
                            setEditingCf((p: any) => ({
                              ...p,
                              specifications: p.specifications.map((s: any, i: number) =>
                                i === idx
                                  ? {
                                      ...s,
                                      fields: s.fields.map((f: any) =>
                                        f.name === fieldName ? { ...f, value: val } : f
                                      ),
                                    }
                                  : s
                              ),
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onPress={() => setEditingCf(null)}>
              Cancel
            </Button>
            <Button onPress={handleSaveCf}>Save Custom Format</Button>
          </DialogFooter>
      </Dialog>

      <Dialog
        isOpen={importOpen}
        onOpenChange={setImportOpen}
        className="max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
      >
        <DialogHeader>
            <DialogTitle className="text-start">
              Import Custom Format JSON (TRaSH Guides compatible)
            </DialogTitle>
          </DialogHeader>
          <Textarea
            rows={10}
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder='{"name": "WEB Tier 01", "specifications": [...]}'
            className="bg-zinc-900 border-zinc-800 font-mono text-xs"
          />
          {importErr && <p className="text-xs text-red-400">{importErr}</p>}
          <DialogFooter className="gap-2">
            <Button variant="outline" onPress={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onPress={handleImportJson}>Import</Button>
          </DialogFooter>
      </Dialog>

      <ServarrProviderModal
        isOpen={atModalItem !== undefined}
        onClose={() => setAtModalItem(undefined)}
        app={app}
        resource="autotagging"
        title={atModalItem ? `Edit ${atModalItem.name}` : "Add Auto Tagging Rule"}
        initialItem={atModalItem}
        schemas={atSchema}
        onSaved={load}
      />
    </div>
  )
}
