"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import { IconFolderOpen, IconPlus, IconTrash } from "@tabler/icons-react"
import { formatBytes, servarrRequest, type ServarrApp } from "../servarr-client"
import { ServarrFilesystemDialog } from "../servarr-filesystem-dialog"

export function ServarrSettingsMedia({ app }: { app: ServarrApp }) {
  const [naming, setNaming] = useState<any>(null)
  const [examples, setExamples] = useState<any>(null)
  const [mediaMgmt, setMediaMgmt] = useState<any>(null)
  const [rootFolders, setRootFolders] = useState<any[]>([])
  const [newRootPath, setNewRootPath] = useState("")
  const [fsMode, setFsMode] = useState<"root" | "recycle" | "script" | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [nRes, exRes, mmRes, rfRes] = await Promise.all([
      servarrRequest(app, "config/naming"),
      servarrRequest(app, "config/naming/examples"),
      servarrRequest(app, "config/mediamanagement"),
      servarrRequest<any[]>(app, "rules/rootfolder"),
    ])
    if (nRes.success) setNaming(nRes.data)
    if (exRes.success) setExamples(exRes.data)
    if (mmRes.success) setMediaMgmt(mmRes.data)
    if (rfRes.success && Array.isArray(rfRes.data)) setRootFolders(rfRes.data)
    setLoading(false)
  }, [app])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    await Promise.all([
      naming &&
      servarrRequest(app, "config/naming", {
        method: "PUT",
        body: JSON.stringify(naming),
      }),
      mediaMgmt &&
      servarrRequest(app, "config/mediamanagement", {
        method: "PUT",
        body: JSON.stringify(mediaMgmt),
      }),
    ])
    setSaving(false)
    await load()
  }

  const handleAddRootFolder = async () => {
    if (!newRootPath.trim()) return
    await servarrRequest(app, "rules/rootfolder", {
      method: "POST",
      body: JSON.stringify({ path: newRootPath.trim() }),
    })
    setNewRootPath("")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-100">
          Media Management & Naming
        </h2>
        <Button size="sm" disabled={saving} onPress={handleSave}>
          {saving && <Spinner className="me-1.5 size-3.5" />}
          Save Changes
        </Button>
      </div>

      {naming && (
        <Card className="border-zinc-800 bg-zinc-900/50 text-start">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-200">Naming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <Label className="text-sm">
                {app === "radarr" ? "Rename Movies" : "Rename Episodes"}
              </Label>
              <Switch
                isSelected={Boolean(naming.renameMovies ?? naming.renameEpisodes)}
                onChange={(v) =>
                  setNaming((p: any) => ({
                    ...p,
                    ...(app === "radarr"
                      ? { renameMovies: v }
                      : { renameEpisodes: v }),
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <Label className="text-sm">Replace Illegal Characters</Label>
              <Switch
                isSelected={Boolean(naming.replaceIllegalCharacters)}
                onChange={(v) =>
                  setNaming((p: any) => ({ ...p, replaceIllegalCharacters: v }))
                }
              />
            </div>

            {app === "radarr" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Standard Movie Format</Label>
                  <Input
                    value={naming.standardMovieFormat ?? ""}
                    onChange={(e) =>
                      setNaming((p: any) => ({
                        ...p,
                        standardMovieFormat: e.target.value,
                      }))
                    }
                    className="bg-zinc-950 border-zinc-800"
                  />
                  {examples?.movieExample && (
                    <p className="text-[11px] text-zinc-400">
                      Example: {examples.movieExample}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Movie Folder Format</Label>
                  <Input
                    value={naming.movieFolderFormat ?? ""}
                    onChange={(e) =>
                      setNaming((p: any) => ({
                        ...p,
                        movieFolderFormat: e.target.value,
                      }))
                    }
                    className="bg-zinc-950 border-zinc-800"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(
                  [
                    ["standardEpisodeFormat", "Standard Episode Format", "singleEpisodeExample"],
                    ["dailyEpisodeFormat", "Daily Episode Format", "dailyEpisodeExample"],
                    ["animeEpisodeFormat", "Anime Episode Format", "animeEpisodeExample"],
                    ["seriesFolderFormat", "Series Folder Format", "seriesFolderExample"],
                    ["seasonFolderFormat", "Season Folder Format", "seasonFolderExample"],
                    ["specialsFolderFormat", "Specials Folder Format", "specialsFolderExample"],
                  ] as const
                ).map(([key, label, exKey]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      value={naming[key] ?? ""}
                      onChange={(e) =>
                        setNaming((p: any) => ({ ...p, [key]: e.target.value }))
                      }
                      className="bg-zinc-950 border-zinc-800"
                    />
                    {examples?.[exKey] && (
                      <p className="truncate text-[11px] text-zinc-400">
                        Ex: {examples[exKey]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mediaMgmt && (
        <Card className="border-zinc-800 bg-zinc-900/50 text-start">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-200">
              File Management & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  ["deleteEmptyFolders", "Delete Empty Folders"],
                  ["copyUsingHardlinks", "Use Hardlinks instead of Copy"],
                  ["importExtraFiles", "Import Extra Files"],
                  ["setPermissionsLinux", "Set Permissions (Linux)"],
                  ["skipFreeSpaceCheckWhenImporting", "Skip Free Space Check"],
                  ["enableMediaInfo", "Analyse Video Files (MediaInfo)"],
                ] as const
              ).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5"
                >
                  <Label className="text-xs">{label}</Label>
                  <Switch
                    isSelected={Boolean(mediaMgmt[key])}
                    onChange={(v) =>
                      setMediaMgmt((p: any) => ({ ...p, [key]: v }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Recycle Bin Folder</Label>
                <div className="flex gap-2">
                  <Input
                    value={mediaMgmt.recycleBin ?? ""}
                    onChange={(e) =>
                      setMediaMgmt((p: any) => ({
                        ...p,
                        recycleBin: e.target.value,
                      }))
                    }
                    className="bg-zinc-950 border-zinc-800"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onPress={() => setFsMode("recycle")}
                  >
                    <IconFolderOpen className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recycle Bin Cleanup (Days)</Label>
                <Input
                  type="number"
                  value={mediaMgmt.recycleBinCleanupDays ?? 7}
                  onChange={(e) =>
                    setMediaMgmt((p: any) => ({
                      ...p,
                      recycleBinCleanupDays: Number(e.target.value),
                    }))
                  }
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-zinc-800 bg-zinc-900/50 text-start">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-200">Root Folders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newRootPath}
              onChange={(e) => setNewRootPath(e.target.value)}
              placeholder="/media/library"
              className="flex-1 bg-zinc-950 border-zinc-800"
            />
            <Button size="icon" variant="outline" onPress={() => setFsMode("root")}>
              <IconFolderOpen className="size-4" />
            </Button>
            <Button onPress={handleAddRootFolder} className="gap-1.5">
              <IconPlus className="size-4" />
              Add Root Folder
            </Button>
          </div>

          <div className="space-y-1.5">
            {rootFolders.map((rf) => (
              <div
                key={rf.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-medium text-zinc-100">{rf.path}</div>
                  <div className="text-zinc-400">
                    Free: {formatBytes(rf.freeSpace)}
                    {Array.isArray(rf.unmappedFolders) &&
                      rf.unmappedFolders.length > 0 &&
                      ` · ${rf.unmappedFolders.length} unmapped folders`}
                  </div>
                </div>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `rules/rootfolder/${rf.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  <IconTrash className="size-3.5 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ServarrFilesystemDialog
        isOpen={fsMode !== null}
        onClose={() => setFsMode(null)}
        app={app}
        onSelect={(path) => {
          if (fsMode === "root") setNewRootPath(path)
          if (fsMode === "recycle")
            setMediaMgmt((p: any) => ({ ...p, recycleBin: path }))
        }}
      />
    </div>
  )
}
