"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Progress } from "@workspace/ui/components/progress"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectList,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  IconActivity,
  IconAlertTriangle,
  IconArchive,
  IconClock,
  IconCloudDownload,
  IconDatabase,
  IconDownload,
  IconFileText,
  IconPlayerPlay,
  IconPower,
  IconRefresh,
  IconRestore,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react"
import { formatBytes, servarrRequest, type ServarrApp } from "./servarr-client"
import { useServarrRealtime } from "./use-servarr-realtime"

export function ServarrSystemView({ app }: { app: ServarrApp }) {
  const [tab, setTab] = useState("status")
  const [overview, setOverview] = useState<any>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [logs, setLogs] = useState<any>({ records: [], totalRecords: 0 })
  const [logLevel, setLogLevel] = useState("all")
  const [logFiles, setLogFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyMsg, setBusyMsg] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const loadAll = useCallback(async () => {
    const [ovRes, bkpRes, lfRes] = await Promise.all([
      servarrRequest(app, "system/overview"),
      servarrRequest<any[]>(app, "system/backups"),
      servarrRequest<any[]>(app, "log/file"),
    ])
    if (ovRes.success) setOverview(ovRes.data)
    if (bkpRes.success && Array.isArray(bkpRes.data)) setBackups(bkpRes.data)
    if (lfRes.success && Array.isArray(lfRes.data)) setLogFiles(lfRes.data)
    setLoading(false)
  }, [app])

  const loadLogs = useCallback(async () => {
    const qs = new URLSearchParams({ page: "1", pageSize: "50", sortKey: "time", sortDirection: "descending" })
    if (logLevel !== "all") qs.set("level", logLevel)
    const res = await servarrRequest(app, `log?${qs.toString()}`)
    if (res.success && res.data) setLogs(res.data)
  }, [app, logLevel])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    if (tab === "events") void loadLogs()
  }, [tab, loadLogs])

  useServarrRealtime({
    app,
    topics: ["command", "system/task", "health"],
    onSync: () => void loadAll(),
  })

  const runCommand = async (name: string) => {
    setBusyMsg(`Triggering ${name}...`)
    await fetch(`/elysia/servarr/${app}/command`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    setBusyMsg(null)
    await loadAll()
  }

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append("file", file)
    setBusyMsg("Uploading & restoring backup...")
    await servarrRequest(app, "system/backups/restore/upload", {
      method: "POST",
      body: form,
    })
    setBusyMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    await loadAll()
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  const status = overview?.status
  const health: any[] = overview?.health ?? []
  const diskspace: any[] = overview?.diskspace ?? []
  const tasks: any[] = overview?.tasks ?? []
  const commands: any[] = overview?.commands ?? []
  const updates: any[] = overview?.updates ?? []
  const stats = overview?.statistics

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-start">
          <IconActivity className="size-6 text-zinc-300" />
          <div>
            <h1 className="text-xl font-bold text-zinc-100">
              {app === "radarr" ? "Radarr System" : "Sonarr v5 System"}
            </h1>
            <p className="text-xs text-zinc-400">
              Status, health checks, disk usage, tasks, backups, updates & logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {busyMsg && <Badge variant="secondary">{busyMsg}</Badge>}
          <Button variant="outline" size="sm" onPress={loadAll} className="gap-1.5">
            <IconRefresh className="size-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => servarrRequest(app, "system/restart", { method: "POST" })}
            className="gap-1.5"
          >
            <IconRestore className="size-4" />
            Restart
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onPress={() => servarrRequest(app, "system/shutdown", { method: "POST" })}
            className="gap-1.5"
          >
            <IconPower className="size-4" />
            Shutdown
          </Button>
        </div>
      </div>

      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger id="status">Status</TabsTrigger>
          <TabsTrigger id="tasks">Tasks & Commands</TabsTrigger>
          <TabsTrigger id="backups">Backups</TabsTrigger>
          <TabsTrigger id="updates">Updates</TabsTrigger>
          <TabsTrigger id="events">Events</TabsTrigger>
          <TabsTrigger id="logs">Log Files</TabsTrigger>
        </TabsList>

        <TabsContent id="status" className="mt-4 space-y-4">
          {health.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-amber-300">
                  <IconAlertTriangle className="size-4" />
                  Health Checks ({health.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-start">
                {health.map((h, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
                  >
                    <div>
                      <Badge variant="outline" className="me-2 uppercase">
                        {h.type}
                      </Badge>
                      <span className="text-zinc-200">{h.message}</span>
                    </div>
                    <span className="text-zinc-500">{h.source}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
                  <IconDatabase className="size-4" />
                  Disk Space
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-start">
                {diskspace.map((d) => {
                  const used = Math.max(0, (d.totalSpace || 0) - (d.freeSpace || 0))
                  const pct = d.totalSpace ? Math.round((used / d.totalSpace) * 100) : 0
                  return (
                    <div key={d.path} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-zinc-200">
                          {d.label || d.path}
                        </span>
                        <span className="text-zinc-400">
                          {formatBytes(d.freeSpace)} free / {formatBytes(d.totalSpace)}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-200">About</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 text-start text-xs">
                {[
                  ["App", status?.appName],
                  ["Version", status?.version],
                  ["Branch", status?.branch],
                  ["Runtime", `${status?.runtimeName || ".NET"} ${status?.runtimeVersion || ""}`],
                  ["OS", `${status?.osName || ""} ${status?.osVersion || ""}`],
                  ["Database", `${status?.databaseType || ""} ${status?.databaseVersion || ""}`],
                  ["AppData", status?.appData],
                  ["Startup", status?.startupPath],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-lg bg-zinc-950/60 p-2">
                    <div className="text-zinc-500">{k}</div>
                    <div className="truncate font-medium text-zinc-200">{v || "—"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {app === "sonarr" && stats && (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-200">
                  Sonarr v5 Library Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-start sm:grid-cols-4">
                {[
                  ["Series", stats.seriesCount],
                  ["Monitored", stats.monitoredSeriesCount],
                  ["Episodes Downloaded", stats.downloadedEpisodeCount],
                  ["Missing Episodes", stats.missingEpisodeCount],
                  ["Total Size", formatBytes(stats.sizeOnDisk)],
                  ["Continuing", stats.continuingSeriesCount],
                  ["Ended", stats.endedSeriesCount],
                  ["Anime Series", stats.animeSeriesCount],
                ].map(([label, val]) => (
                  <div key={String(label)} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                    <div className="text-xs text-zinc-400">{label}</div>
                    <div className="text-lg font-bold text-zinc-100">{val ?? 0}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent id="tasks" className="mt-4 space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-200">
                <IconClock className="size-4" />
                Scheduled Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-start">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-zinc-100">{task.name}</div>
                    <div className="text-zinc-400">
                      Interval: {task.interval}m · Last: {task.lastDuration || "—"}
                    </div>
                  </div>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={() => runCommand(task.taskName)}
                    className="gap-1"
                  >
                    <IconPlayerPlay className="size-3.5" />
                    Run
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-200">
                Command History & Active Jobs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-start">
              {commands.slice(0, 20).map((cmd) => (
                <div
                  key={cmd.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-zinc-200">{cmd.name}</div>
                    <div className="text-zinc-500">{cmd.message || cmd.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{cmd.status}</Badge>
                    {(cmd.status === "queued" || cmd.status === "started") && (
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onPress={() =>
                          servarrRequest(app, `system/commands/${cmd.id}`, {
                            method: "DELETE",
                          }).then(loadAll)
                        }
                      >
                        <IconTrash className="size-3.5 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent id="backups" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onPress={() => runCommand("Backup")} className="gap-1.5">
              <IconArchive className="size-4" />
              Backup Now
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleUploadBackup}
            />
            <Button
              size="sm"
              variant="outline"
              onPress={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <IconUpload className="size-4" />
              Upload & Restore
            </Button>
          </div>

          <div className="space-y-2">
            {backups.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-start text-xs"
              >
                <div>
                  <div className="font-semibold text-zinc-100">{b.name}</div>
                  <div className="text-zinc-400">
                    {b.type} · {formatBytes(b.size)} · {new Date(b.time).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`/elysia/servarr/${app}/system/backups/${b.id}/download`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    <IconDownload className="size-3.5" />
                    Download
                  </a>
                  <Button
                    size="xs"
                    variant="outline"
                    onPress={() =>
                      servarrRequest(app, `system/backups/restore/${b.id}`, {
                        method: "POST",
                      })
                    }
                  >
                    Restore
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() =>
                      servarrRequest(app, `system/backups/${b.id}`, {
                        method: "DELETE",
                      }).then(loadAll)
                    }
                  >
                    <IconTrash className="size-3.5 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent id="updates" className="mt-4 space-y-3">
          {updates.map((u) => (
            <Card key={u.version} className="border-zinc-800 bg-zinc-900/50 text-start">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-zinc-100">
                  v{u.version} ({u.branch})
                </CardTitle>
                <div className="flex items-center gap-2">
                  {u.installed && <Badge variant="secondary">Installed</Badge>}
                  {u.installable && !u.installed && (
                    <Button
                      size="xs"
                      onPress={() => runCommand("ApplicationUpdate")}
                      className="gap-1"
                    >
                      <IconCloudDownload className="size-3.5" />
                      Install
                    </Button>
                  )}
                </div>
              </CardHeader>
              {u.changes && (
                <CardContent className="space-y-1 text-xs text-zinc-300">
                  {u.changes.new?.map((n: string, i: number) => (
                    <div key={i}>+ {n}</div>
                  ))}
                  {u.changes.fixed?.map((f: string, i: number) => (
                    <div key={i} className="text-zinc-400">
                      * {f}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent id="events" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <Select
              selectedKey={logLevel}
              onSelectionChange={(k) => setLogLevel(String(k ?? "all"))}
            >
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectList>
                  <SelectItem id="all">All Levels</SelectItem>
                  <SelectItem id="info">Info</SelectItem>
                  <SelectItem id="warn">Warn</SelectItem>
                  <SelectItem id="error">Error</SelectItem>
                </SelectList>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onPress={loadLogs}>
              Refresh Events
            </Button>
          </div>
          <div className="space-y-1.5">
            {(logs.records ?? []).map((entry: any) => (
              <div
                key={entry.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-start text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{entry.level}</Badge>
                  <span className="font-medium text-zinc-200">{entry.logger}</span>
                  <span className="ms-auto text-zinc-500">
                    {new Date(entry.time).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-zinc-300">{entry.message}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent id="logs" className="mt-4 space-y-2">
          {logFiles.map((lf) => (
            <div
              key={lf.filename}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-start text-xs"
            >
              <div className="flex items-center gap-2">
                <IconFileText className="size-4 text-zinc-400" />
                <span className="font-medium text-zinc-100">{lf.filename}</span>
              </div>
              <a
                href={`/elysia/servarr/${app}/log/file/${encodeURIComponent(lf.filename)}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                <IconDownload className="size-3.5" />
                Open / Download
              </a>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
