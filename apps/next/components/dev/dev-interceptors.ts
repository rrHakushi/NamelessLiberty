"use client"

import { useSyncExternalStore } from "react"

export interface NetworkLogEntry {
  id: string
  method: string
  url: string
  path: string
  status: number | null
  statusText: string
  ok: boolean
  durationMs: number | null
  timestamp: number
  requestHeaders: Record<string, string>
  requestBody: string | null
  responseHeaders: Record<string, string>
  responseBody: string | null
  error: string | null
  pending: boolean
}

export type ConsoleLevel = "log" | "info" | "warn" | "error"

export interface ConsoleLogEntry {
  id: string
  level: ConsoleLevel
  timestamp: number
  message: string
  args: string[]
  stack?: string
}

interface DevStoreState {
  network: NetworkLogEntry[]
  console: ConsoleLogEntry[]
}

const MAX_NETWORK_LOGS = 200
const MAX_CONSOLE_LOGS = 300

let state: DevStoreState = {
  network: [],
  console: [],
}

const listeners = new Set<() => void>()
let initialized = false
let originalFetch: typeof window.fetch | null = null
let notifyScheduled = false

function notify() {
  if (notifyScheduled) return
  notifyScheduled = true
  queueMicrotask(() => {
    notifyScheduled = false
    for (const listener of listeners) {
      listener()
    }
  })
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isElysiaUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl, window.location.origin)
    return parsed.pathname === "/elysia" || parsed.pathname.startsWith("/elysia/")
  } catch {
    return inputUrl.includes("/elysia/")
  }
}

function getPathAndQuery(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl, window.location.origin)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return inputUrl
  }
}

function headersToRecord(headers?: HeadersInit | Headers): Record<string, string> {
  const out: Record<string, string> = {}
  if (!headers) return out
  try {
    const h = headers instanceof Headers ? headers : new Headers(headers)
    h.forEach((value, key) => {
      out[key] = value
    })
  } catch {
    // ignore malformed headers
  }
  return out
}

function formatArg(arg: unknown): string {
  if (typeof arg === "string") return arg
  if (arg instanceof Error) {
    return arg.stack || `${arg.name}: ${arg.message}`
  }
  if (typeof arg === "undefined") return "undefined"
  if (arg === null) return "null"
  if (typeof arg === "function") return `[Function ${arg.name || "anonymous"}]`
  try {
    return JSON.stringify(arg, null, 2)
  } catch {
    return String(arg)
  }
}

function truncateText(text: string, max = 32_000): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n... [truncated ${text.length - max} chars]`
}

function addNetworkEntry(entry: NetworkLogEntry) {
  state = {
    ...state,
    network: [entry, ...state.network].slice(0, MAX_NETWORK_LOGS),
  }
  notify()
}

function updateNetworkEntry(id: string, patch: Partial<NetworkLogEntry>) {
  state = {
    ...state,
    network: state.network.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    ),
  }
  notify()
}

function addConsoleEntry(entry: ConsoleLogEntry) {
  state = {
    ...state,
    console: [entry, ...state.console].slice(0, MAX_CONSOLE_LOGS),
  }
  notify()
}

export function clearNetworkLogs() {
  state = { ...state, network: [] }
  notify()
}

export function clearConsoleLogs() {
  state = { ...state, console: [] }
  notify()
}

export async function replayNetworkRequest(entry: NetworkLogEntry): Promise<void> {
  const fetchFn = window.fetch.bind(window)
  const headers = new Headers(entry.requestHeaders)
  headers.delete("content-length")

  await fetchFn(entry.url, {
    method: entry.method,
    headers,
    body:
      entry.method !== "GET" && entry.method !== "HEAD" && entry.requestBody
        ? entry.requestBody
        : undefined,
    credentials: "include",
  })
}

export function buildCurlCommand(entry: NetworkLogEntry): string {
  const parts = [`curl -X ${entry.method} '${entry.url}'`]
  for (const [key, value] of Object.entries(entry.requestHeaders)) {
    if (key.toLowerCase() === "content-length") continue
    parts.push(`  -H '${key}: ${value.replace(/'/g, "'\\''")}'`)
  }
  if (entry.requestBody && entry.method !== "GET" && entry.method !== "HEAD") {
    parts.push(`  --data-raw '${entry.requestBody.replace(/'/g, "'\\''")}'`)
  }
  return parts.join(" \\\n")
}

export function initDevInterceptors() {
  if (typeof window === "undefined" || initialized) return
  initialized = true

  // 1. Intercept window.fetch for /elysia/* API calls only
  originalFetch = window.fetch.bind(window)
  const interceptedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    if (!isElysiaUrl(urlStr)) {
      return originalFetch!(input, init)
    }

    const method = (
      init?.method ||
      (input instanceof Request ? input.method : "GET")
    ).toUpperCase()

    const reqHeaders = {
      ...(input instanceof Request ? headersToRecord(input.headers) : {}),
      ...(init?.headers ? headersToRecord(init.headers) : {}),
    }

    let reqBody: string | null = null
    if (typeof init?.body === "string") {
      reqBody = truncateText(init.body)
    } else if (init?.body instanceof URLSearchParams) {
      reqBody = init.body.toString()
    } else if (init?.body instanceof FormData) {
      const formObj: Record<string, string> = {}
      init.body.forEach((v, k) => {
        formObj[k] = typeof v === "string" ? v : `[File: ${v.name}]`
      })
      reqBody = JSON.stringify(formObj, null, 2)
    } else if (init?.body != null) {
      reqBody = `[${Object.prototype.toString.call(init.body)}]`
    }

    const id = makeId()
    const startedAt = performance.now()
    const fullUrl = new URL(urlStr, window.location.origin).toString()

    addNetworkEntry({
      id,
      method,
      url: fullUrl,
      path: getPathAndQuery(urlStr),
      status: null,
      statusText: "Pending",
      ok: true,
      durationMs: null,
      timestamp: Date.now(),
      requestHeaders: reqHeaders,
      requestBody: reqBody,
      responseHeaders: {},
      responseBody: null,
      error: null,
      pending: true,
    })

    try {
      const response = await originalFetch!(input, init)
      const durationMs = Math.round(performance.now() - startedAt)
      const resHeaders = headersToRecord(response.headers)

      let resBody: string | null = null
      try {
        const cloned = response.clone()
        const text = await cloned.text()
        if (text) {
          try {
            resBody = truncateText(JSON.stringify(JSON.parse(text), null, 2))
          } catch {
            resBody = truncateText(text)
          }
        }
      } catch {
        resBody = "[Unable to read response body]"
      }

      updateNetworkEntry(id, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        durationMs,
        responseHeaders: resHeaders,
        responseBody: resBody,
        pending: false,
      })

      return response
    } catch (err) {
      const durationMs = Math.round(performance.now() - startedAt)
      updateNetworkEntry(id, {
        status: 0,
        statusText: "Network Error",
        ok: false,
        durationMs,
        error: err instanceof Error ? err.message : String(err),
        pending: false,
      })
      throw err
    }
  }
  window.fetch = Object.assign(interceptedFetch, {
    preconnect: originalFetch.preconnect?.bind(originalFetch),
  }) as typeof window.fetch

  // 2. Intercept console methods
  const levels: ConsoleLevel[] = ["log", "info", "warn", "error"]
  for (const level of levels) {
    const orig = console[level].bind(console)
    console[level] = (...args: unknown[]) => {
      orig(...args)
      const formatted = args.map(formatArg)
      const firstError = args.find((a): a is Error => a instanceof Error)
      addConsoleEntry({
        id: makeId(),
        level,
        timestamp: Date.now(),
        message: formatted[0] ?? "",
        args: formatted,
        stack: firstError?.stack,
      })
    }
  }

  // 3. Global runtime errors & unhandled rejections
  window.addEventListener("error", (event) => {
    addConsoleEntry({
      id: makeId(),
      level: "error",
      timestamp: Date.now(),
      message: event.message || "Uncaught Error",
      args: [event.message || "Uncaught Error"],
      stack:
        event.error instanceof Error
          ? event.error.stack
          : `${event.filename}:${event.lineno}:${event.colno}`,
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason
    const msg =
      reason instanceof Error ? reason.message : formatArg(reason)
    addConsoleEntry({
      id: makeId(),
      level: "error",
      timestamp: Date.now(),
      message: `Unhandled Rejection: ${msg}`,
      args: [`Unhandled Rejection: ${msg}`],
      stack: reason instanceof Error ? reason.stack : undefined,
    })
  })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): DevStoreState {
  return state
}

export function useDevLogs(): DevStoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
