"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  IconEdit,
  IconFolderOpen,
  IconPlugConnected,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { servarrRequest, type ServarrApp } from "../servarr-client"
import { ServarrProviderModal } from "../servarr-schema-form"
import { ServarrFilesystemDialog } from "../servarr-filesystem-dialog"

type ProviderKind = "indexer" | "downloadclient" | "importlist" | "metadata"

const TITLES: Record<ProviderKind, string> = {
  indexer: "Indexers",
  downloadclient: "Download Clients",
  importlist: "Import Lists",
  metadata: "Metadata Providers",
}

export function ServarrSettingsProviders({
  app,
  kind,
}: {
  app: ServarrApp
  kind: ProviderKind
}) {
  const [items, setItems] = useState<any[]>([])
  const [schemas, setSchemas] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [remoteMaps, setRemoteMaps] = useState<any[]>([])
  const [newMap, setNewMap] = useState({ host: "", remotePath: "", localPath: "" })
  const [exclusions, setExclusions] = useState<any[]>([])
  const [modalItem, setModalItem] = useState<any | null | undefined>(undefined)
  const [fsOpen, setFsOpen] = useState(false)
  const [testResults, setTestResults] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const calls: Promise<any>[] = [
      servarrRequest<any[]>(app, `providers/${kind}`),
      servarrRequest<any[]>(app, `providers/${kind}/schema`),
      servarrRequest(app, `config/${kind}`),
    ]
    if (kind === "downloadclient") {
      calls.push(servarrRequest<any[]>(app, "rules/remotepathmapping"))
    }
    if (kind === "importlist") {
      calls.push(servarrRequest<any[]>(app, "exclusions"))
    }

    const results = await Promise.all(calls)
    if (results[0].success && Array.isArray(results[0].data)) setItems(results[0].data)
    if (results[1].success && Array.isArray(results[1].data)) setSchemas(results[1].data)
    if (results[2].success) setConfig(results[2].data)
    if (kind === "downloadclient" && results[3]?.success) {
      setRemoteMaps(Array.isArray(results[3].data) ? results[3].data : [])
    }
    if (kind === "importlist" && results[3]?.success) {
      setExclusions(Array.isArray(results[3].data) ? results[3].data : [])
    }
    setLoading(false)
  }, [app, kind])

  useEffect(() => {
    void load()
  }, [load])

  const handleTestAll = async () => {
    setTestResults("Testing all...")
    const res = await servarrRequest<any[]>(app, `providers/${kind}/testall`, {
      method: "POST",
    })
    if (res.success && Array.isArray(res.data)) {
      const failures = res.data.filter((x) => !x.isValid)
      setTestResults(
        failures.length === 0
          ? "All providers passed!"
          : `${failures.length} provider(s) reported validation warnings`
      )
    } else {
      setTestResults(res.message || "Test all failed")
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return
    await servarrRequest(app, `config/${kind}`, {
      method: "PUT",
      body: JSON.stringify(config),
    })
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
        <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm text-zinc-200">{TITLES[kind]}</CardTitle>
          <div className="flex items-center gap-2">
            {testResults && <Badge variant="secondary">{testResults}</Badge>}
            <Button size="xs" variant="outline" onPress={handleTestAll} className="gap-1">
              <IconPlugConnected className="size-3.5" />
              Test All
            </Button>
            <Button size="xs" onPress={() => setModalItem(null)} className="gap-1">
              <IconPlus className="size-3.5" />
              Add {TITLES[kind].slice(0, -1)}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
            >
              <div>
                <div className="font-semibold text-zinc-100">{item.name}</div>
                <div className="text-zinc-400">
                  {item.implementationName || item.implementation}
                  {item.priority !== undefined && ` · Priority ${item.priority}`}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge
                  variant={
                    item.enable || item.enabled || item.enableRss
                      ? "default"
                      : "secondary"
                  }
                >
                  {item.enable || item.enabled || item.enableRss ? "Active" : "Disabled"}
                </Badge>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() => setModalItem(item)}
                >
                  <IconEdit className="size-3.5" />
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `providers/${kind}/${item.id}`, {
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

      {config && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-zinc-200">
              {TITLES[kind]} Options
            </CardTitle>
            <Button size="xs" onPress={handleSaveConfig}>
              Save Options
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(config)
              .filter(([k]) => k !== "id")
              .map(([key, val]) =>
                typeof val === "boolean" ? (
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
                        setConfig((p: any) => ({ ...p, [key]: v }))
                      }
                    />
                  </div>
                ) : (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </Label>
                    <Input
                      type={typeof val === "number" ? "number" : "text"}
                      value={val === null || val === undefined ? "" : String(val)}
                      onChange={(e) =>
                        setConfig((p: any) => ({
                          ...p,
                          [key]:
                            typeof val === "number"
                              ? Number(e.target.value)
                              : e.target.value,
                        }))
                      }
                      className="bg-zinc-950 border-zinc-800 text-xs"
                    />
                  </div>
                )
              )}
          </CardContent>
        </Card>
      )}

      {kind === "downloadclient" && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-200">
              Remote Path Mappings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <Input
                placeholder="Host (e.g. qbittorrent)"
                value={newMap.host}
                onChange={(e) => setNewMap((p) => ({ ...p, host: e.target.value }))}
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
              <Input
                placeholder="Remote Path (/downloads)"
                value={newMap.remotePath}
                onChange={(e) =>
                  setNewMap((p) => ({ ...p, remotePath: e.target.value }))
                }
                className="bg-zinc-950 border-zinc-800 text-xs"
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Local Path"
                  value={newMap.localPath}
                  onChange={(e) =>
                    setNewMap((p) => ({ ...p, localPath: e.target.value }))
                  }
                  className="bg-zinc-950 border-zinc-800 text-xs"
                />
                <Button size="icon" variant="outline" onPress={() => setFsOpen(true)}>
                  <IconFolderOpen className="size-4" />
                </Button>
              </div>
              <Button
                onPress={() =>
                  servarrRequest(app, "rules/remotepathmapping", {
                    method: "POST",
                    body: JSON.stringify(newMap),
                  }).then(() => {
                    setNewMap({ host: "", remotePath: "", localPath: "" })
                    void load()
                  })
                }
              >
                Add Mapping
              </Button>
            </div>

            {remoteMaps.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
              >
                <span>
                  {m.host}: {m.remotePath} → {m.localPath}
                </span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `rules/remotepathmapping/${m.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  <IconTrash className="size-3.5 text-red-400" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {kind === "importlist" && (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-200">
              Import List Exclusions ({exclusions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {exclusions.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
              >
                <span>
                  {ex.movieTitle || ex.title} ({ex.movieYear || ex.tvdbId || ex.tmdbId})
                </span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() =>
                    servarrRequest(app, `exclusions/${ex.id}`, {
                      method: "DELETE",
                    }).then(load)
                  }
                >
                  <IconTrash className="size-3.5 text-red-400" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ServarrProviderModal
        isOpen={modalItem !== undefined}
        onClose={() => setModalItem(undefined)}
        app={app}
        resource={kind}
        title={
          modalItem
            ? `Edit ${modalItem.name}`
            : `Add ${TITLES[kind].slice(0, -1)}`
        }
        initialItem={modalItem}
        schemas={schemas}
        onSaved={load}
      />

      <ServarrFilesystemDialog
        isOpen={fsOpen}
        onClose={() => setFsOpen(false)}
        app={app}
        onSelect={(path) => setNewMap((p) => ({ ...p, localPath: path }))}
      />
    </div>
  )
}
