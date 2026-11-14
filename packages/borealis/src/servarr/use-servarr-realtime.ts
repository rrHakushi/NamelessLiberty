"use client"

import { useEffect, useRef, useState } from "react"
import { useWebSocket } from "@/context/websocket-context"
import { servarrRequest, type ServarrApp } from "./servarr-client"

const connectInFlight = new Map<ServarrApp, Promise<any>>()
const lastConnectResult = new Map<
  ServarrApp,
  { ts: number; realtimeStatus?: "connected" | "disconnected" }
>()
const CONNECT_DEDUP_MS = 5000

function connectServarrRealtime(app: ServarrApp): Promise<any> {
  const cached = lastConnectResult.get(app)
  if (cached && Date.now() - cached.ts < CONNECT_DEDUP_MS) {
    return Promise.resolve({ realtimeStatus: cached.realtimeStatus })
  }
  const existing = connectInFlight.get(app)
  if (existing) return existing

  const promise = servarrRequest(app, "realtime/connect", { method: "POST" })
    .then((res: any) => {
      lastConnectResult.set(app, {
        ts: Date.now(),
        realtimeStatus: res?.realtimeStatus,
      })
      return res
    })
    .finally(() => {
      connectInFlight.delete(app)
    })

  connectInFlight.set(app, promise)
  return promise
}

export interface UseServarrRealtimeOptions {
  app: ServarrApp
  topics: string[]
  onSync: (payload: { name: string; action?: string; resource?: any }) => void
  fallbackPollMs?: number
  enabled?: boolean
}

/**
 * Connects silently to the user's SignalR relay via Elysia `WsServ`.
 * Triggers `onSync` whenever matching *arr topics arrive (`queue`, `command`,
 * `movie`, `series`, `episode`, etc.) without emitting UI toast notifications.
 * Falls back to adaptive polling only when WS or upstream SignalR is disconnected.
 */
export function useServarrRealtime({
  app,
  topics,
  onSync,
  fallbackPollMs = 15000,
  enabled = true,
}: UseServarrRealtimeOptions) {
  const { isConnected, subscribe } = useWebSocket()
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connected" | "disconnected"
  >("disconnected")
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync
  const topicsKey = topics.join(",")

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    void connectServarrRealtime(app)
      .then((res: any) => {
        if (!cancelled && res?.realtimeStatus) {
          setRealtimeStatus(res.realtimeStatus)
        }
      })
      .catch(() => {})

    const topicSet = new Set(topicsKey.split(",").map((t) => t.toLowerCase()))
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const unsubSync = subscribe("servarr:sync", (msg) => {
      const payload = msg.data as {
        app?: string
        name?: string
        action?: string
        resource?: any
      }
      if (payload?.app !== app || !payload?.name) return
      const topic = payload.name.toLowerCase()
      if (
        !topicSet.has("*") &&
        !topicSet.has(topic) &&
        !Array.from(topicSet).some((t) => topic.startsWith(t))
      ) {
        return
      }
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        onSyncRef.current({
          name: topic,
          action: payload.action,
          resource: payload.resource,
        })
      }, 250)
    })

    const unsubStatus = subscribe("servarr:status", (msg) => {
      const payload = msg.data as { app?: string; status?: "connected" | "disconnected" }
      if (payload?.app === app && payload.status) {
        setRealtimeStatus(payload.status)
      }
    })

    return () => {
      cancelled = true
      if (debounceTimer) clearTimeout(debounceTimer)
      unsubSync()
      unsubStatus()
    }
  }, [app, enabled, subscribe, topicsKey])

  // Adaptive polling fallback only while WS or SignalR is disconnected
  useEffect(() => {
    if (!enabled || fallbackPollMs <= 0) return
    if (isConnected && realtimeStatus === "connected") return

    const timer = setInterval(() => {
      onSyncRef.current({ name: "poll" })
    }, fallbackPollMs)

    return () => clearInterval(timer)
  }, [enabled, fallbackPollMs, isConnected, realtimeStatus])

  return {
    wsConnected: isConnected,
    realtimeStatus,
    isLive: isConnected && realtimeStatus === "connected",
  }
}

