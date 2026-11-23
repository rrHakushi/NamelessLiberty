"use client"

import React, { useEffect, useState } from "react"
import {
  IconAlertTriangle,
  IconMaximize,
  IconServer,
  IconZoomIn,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { signOut } from "@/context/session-context"
import { toast } from "sonner"

interface AppSettingsPayload {
  serverUrl: string | null
  zoom: number
}

function getTauriInvoke() {
  if (typeof window === "undefined") return null
  return (
    (
      window as unknown as {
        __TAURI__?: {
          core?: {
            invoke?: <T = unknown>(
              cmd: string,
              args?: Record<string, unknown>
            ) => Promise<T>
          }
        }
      }
    ).__TAURI__?.core?.invoke ?? null
  )
}

const ZOOM_PRESETS = [0.75, 0.9, 1.0, 1.1, 1.25, 1.5]

export function AppSettingsTab(): React.JSX.Element {
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1.0)
  const [loading, setLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [isMobilePlatform, setIsMobilePlatform] = useState(false)

  useEffect(() => {
    setIsMobilePlatform(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    const invoke = getTauriInvoke()
    if (!invoke) {
      setLoading(false)
      return
    }
    invoke<AppSettingsPayload>("get_app_settings")
      .then((res) => {
        setServerUrl(res.serverUrl ?? null)
        setZoom(typeof res.zoom === "number" ? res.zoom : 1.0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleZoomChange = async (nextZoom: number) => {
    const clamped = Math.min(2.0, Math.max(0.5, Number(nextZoom.toFixed(2))))
    setZoom(clamped)
    const invoke = getTauriInvoke()
    if (!invoke) return
    try {
      const applied = await invoke<number>("set_zoom", { zoom: clamped })
      setZoom(applied)
    } catch (err: any) {
      toast.error(err?.message || "Failed to update zoom")
    }
  }

  const handleResetWindow = async () => {
    const invoke = getTauriInvoke()
    if (!invoke) return
    try {
      await invoke("reset_window_state")
      toast.success("Window size and position reset")
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset window state")
    }
  }

  const handleConfirmChangeServer = async () => {
    const invoke = getTauriInvoke()
    if (!invoke) return
    setSwitching(true)
    try {
      await signOut({ redirect: false }).catch(() => {})
      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
      } catch {
        // ignore storage errors
      }
      await invoke("reset_and_disconnect")
    } catch (err: any) {
      toast.error(err?.message || "Failed to switch server")
      setSwitching(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">App</h3>
        <p className="text-xs text-muted-foreground">
          Manage your NamelessLiberty Tauri application settings and server connection.
        </p>
      </div>

      {/* Server Connection */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <IconServer className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Server Connection
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Connected server</p>
            <p className="truncate font-mono text-xs text-foreground">
              {loading
                ? "Loading..."
                : serverUrl || (typeof window !== "undefined" ? window.location.origin : "Not configured")}
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            className="shrink-0 cursor-pointer"
          >
            Change Server
          </Button>
        </div>
      </div>

      {/* UI Zoom */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconZoomIn className="size-4 text-primary" />
            <span className="text-sm font-medium text-foreground">UI Zoom</span>
          </div>
          <span className="font-mono text-xs font-semibold text-primary">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={Math.round(zoom * 100)}
          onChange={(e) => void handleZoomChange(Number(e.target.value) / 100)}
          className="w-full accent-primary cursor-pointer"
          aria-label="UI Zoom percentage"
        />

        <div className="flex flex-wrap gap-1.5">
          {ZOOM_PRESETS.map((preset) => {
            const active = Math.abs(zoom - preset) < 0.01
            return (
              <Button
                key={preset}
                type="button"
                size="xs"
                variant={active ? "default" : "outline"}
                onClick={() => void handleZoomChange(preset)}
                className="font-mono cursor-pointer"
              >
                {Math.round(preset * 100)}%
              </Button>
            )
          })}
        </div>
      </div>

      {/* Desktop Window */}
      {!isMobilePlatform && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card/50 p-4">
          <div className="flex items-center gap-2.5">
            <IconMaximize className="size-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Window Layout</p>
              <p className="text-xs text-muted-foreground">
                Reset saved window size and screen position to default (1280×800).
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleResetWindow()}
            className="shrink-0 cursor-pointer"
          >
            Reset Window
          </Button>
        </div>
      )}

      {/* Change Server Warning Dialog */}
      <Dialog isOpen={confirmOpen} onOpenChange={setConfirmOpen} className="max-w-md">
        <div className="flex flex-col gap-4 p-1">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <IconAlertTriangle className="size-5" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-base font-semibold">
                Change Server &amp; Log Out?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Switching servers will log you out of your current account, clear
                all local app data and cached sessions, and return you to the
                server setup screen.
              </DialogDescription>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isDisabled={switching}
              onClick={() => setConfirmOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              isDisabled={switching}
              onClick={() => void handleConfirmChangeServer()}
              className="cursor-pointer"
            >
              {switching ? "Disconnecting..." : "Log Out & Change Server"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
