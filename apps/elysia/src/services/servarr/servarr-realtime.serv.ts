import { LogFactory } from '@NamelessLiberty/logger'
import { wsHub } from '../ws.serv'

const logger = new LogFactory('Servarr:Realtime')
const RECORD_SEPARATOR = '\x1e'

export type ServarrRealtimeApp = 'radarr' | 'sonarr'

interface ActiveHubEntry {
  key: string
  userId: string
  app: ServarrRealtimeApp
  provider: 'RADARR' | 'SONARR'
  hostUrl: string
  apiKey: string
  ws: WebSocket | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  attempts: number
  stopped: boolean
  status: 'connected' | 'disconnected'
}

const IGNORED_SIGNALR_TOPICS = new Set([
  'notification',
  'calendar',
  'version',
])

/**
 * Bridges Radarr v3 and Sonarr v5 ASP.NET Core SignalR `/signalr/messages`
 * streams to authenticated browser sessions via `wsHub` without emitting
 * UI notifications/toasts (silent state/query synchronization only).
 */
export class ServarrRealtimeServ {
  private static hubs = new Map<string, ActiveHubEntry>()
  private static initialized = false

  private static ensureInitialized() {
    if (this.initialized) return
    this.initialized = true
    wsHub.onUserDisconnected((userId) => {
      this.disconnectUser(userId)
    })
  }

  private static makeKey(userId: string, app: ServarrRealtimeApp): string {
    return `${userId}:${app}`
  }

  public static getStatus(userId: string, app: ServarrRealtimeApp) {
    const entry = this.hubs.get(this.makeKey(userId, app))
    return entry?.status ?? 'disconnected'
  }

  public static async ensureConnected(
    userId: string,
    app: ServarrRealtimeApp,
    credentials: { hostUrl: string; apiKey: string }
  ): Promise<'connected' | 'disconnected'> {
    this.ensureInitialized()
    const key = this.makeKey(userId, app)
    const normalizedHost = credentials.hostUrl.replace(/\/+$/, '')
    const existing = this.hubs.get(key)

    if (
      existing &&
      !existing.stopped &&
      existing.hostUrl === normalizedHost &&
      existing.apiKey === credentials.apiKey &&
      existing.ws &&
      (existing.ws.readyState === WebSocket.OPEN ||
        existing.ws.readyState === WebSocket.CONNECTING)
    ) {
      return existing.status
    }

    if (existing) {
      this.teardownEntry(existing)
    }

    const entry: ActiveHubEntry = {
      key,
      userId,
      app,
      provider: app === 'radarr' ? 'RADARR' : 'SONARR',
      hostUrl: normalizedHost,
      apiKey: credentials.apiKey,
      ws: null,
      reconnectTimer: null,
      attempts: 0,
      stopped: false,
      status: 'disconnected',
    }
    this.hubs.set(key, entry)
    void this.connectEntry(entry)
    return entry.status
  }

  public static disconnectUser(userId: string, app?: ServarrRealtimeApp): void {
    for (const [key, entry] of this.hubs.entries()) {
      if (entry.userId === userId && (!app || entry.app === app)) {
        this.teardownEntry(entry)
        this.hubs.delete(key)
      }
    }
  }

  private static teardownEntry(entry: ActiveHubEntry): void {
    entry.stopped = true
    if (entry.reconnectTimer) {
      clearTimeout(entry.reconnectTimer)
      entry.reconnectTimer = null
    }
    if (entry.ws) {
      try {
        entry.ws.close(1000, 'Stopped')
      } catch {}
      entry.ws = null
    }
    entry.status = 'disconnected'
  }

  private static emitStatus(
    entry: ActiveHubEntry,
    status: 'connected' | 'disconnected'
  ) {
    if (entry.status === status) return
    entry.status = status
    wsHub.sendToUser(entry.userId, 'servarr:status', {
      provider: entry.provider,
      app: entry.app,
      status,
    })
  }

  private static async connectEntry(entry: ActiveHubEntry): Promise<void> {
    if (entry.stopped) return
    if (!wsHub.hasUserConnections(entry.userId)) {
      this.teardownEntry(entry)
      this.hubs.delete(entry.key)
      return
    }

    try {
      const negotiateUrl = `${entry.hostUrl}/signalr/messages/negotiate?negotiateVersion=1`
      const negRes = await fetch(negotiateUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': entry.apiKey,
          Accept: 'application/json',
        },
      })

      if (!negRes.ok) {
        throw new Error(`SignalR negotiate failed (${negRes.status})`)
      }

      const negData = (await negRes.json()) as {
        connectionToken?: string
        connectionId?: string
      }
      const token = negData.connectionToken || negData.connectionId
      if (!token) {
        throw new Error('SignalR negotiate returned no connectionToken')
      }

      const wsBase = entry.hostUrl.replace(/^http/i, 'ws')
      const wsUrl = `${wsBase}/signalr/messages?id=${encodeURIComponent(token)}&access_token=${encodeURIComponent(entry.apiKey)}`

      const ws = new WebSocket(wsUrl, {
        headers: {
          'X-Api-Key': entry.apiKey,
        },
      } as any)
      entry.ws = ws

      ws.onopen = () => {
        if (entry.stopped || entry.ws !== ws) return
        entry.attempts = 0
        ws.send(
          JSON.stringify({ protocol: 'json', version: 1 }) + RECORD_SEPARATOR
        )
        this.emitStatus(entry, 'connected')
      }

      ws.onmessage = (event) => {
        if (entry.stopped || entry.ws !== ws) return
        const raw = typeof event.data === 'string' ? event.data : String(event.data)
        const frames = raw.split(RECORD_SEPARATOR).filter(Boolean)
        for (const frame of frames) {
          try {
            const msg = JSON.parse(frame) as {
              type?: number
              target?: string
              arguments?: any[]
            }
            if (msg.type === 6) {
              // SignalR ping -> respond with ping
              ws.send(JSON.stringify({ type: 6 }) + RECORD_SEPARATOR)
              continue
            }
            if (
              msg.type === 1 &&
              msg.target?.toLowerCase() === 'receivemessage' &&
              Array.isArray(msg.arguments) &&
              msg.arguments[0]
            ) {
              const payload = msg.arguments[0] as {
                name?: string
                body?: { action?: string; resource?: unknown }
              }
              const name = payload.name?.toLowerCase()
              if (!name || IGNORED_SIGNALR_TOPICS.has(name)) continue
              wsHub.sendToUser(entry.userId, 'servarr:sync', {
                provider: entry.provider,
                app: entry.app,
                name,
                action: payload.body?.action ?? 'updated',
                resource: payload.body?.resource ?? null,
              })
            }
          } catch {
            // Ignore malformed SignalR frames
          }
        }
      }

      ws.onclose = () => {
        if (entry.ws !== ws) return
        entry.ws = null
        this.emitStatus(entry, 'disconnected')
        if (!entry.stopped && wsHub.hasUserConnections(entry.userId)) {
          this.scheduleReconnect(entry)
        }
      }

      ws.onerror = () => {
        // onclose handles reconnect
      }
    } catch (err: any) {
      logger.debug(
        `SignalR connect failed for ${entry.provider} (${entry.userId}): ${err?.message || err}`
      )
      this.emitStatus(entry, 'disconnected')
      if (!entry.stopped && wsHub.hasUserConnections(entry.userId)) {
        this.scheduleReconnect(entry)
      }
    }
  }

  private static scheduleReconnect(entry: ActiveHubEntry) {
    if (entry.stopped || entry.reconnectTimer) return
    const delay = Math.min(2000 * 2 ** entry.attempts, 30000)
    entry.attempts += 1
    entry.reconnectTimer = setTimeout(() => {
      entry.reconnectTimer = null
      void this.connectEntry(entry)
    }, delay)
  }
}

