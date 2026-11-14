import { elysia } from "@/lib/elysia"

export type ServarrApp = "radarr" | "sonarr"
export type ServarrProvider = "RADARR" | "SONARR"

export interface ServarrValidationError {
  propertyName: string
  errorMessage: string
  severity?: string
}

export interface ServarrEnvelope<T = any> {
  ok: boolean
  success: boolean
  connected: boolean
  provider: string
  data: T
  message?: string
  error?: string
  validationErrors?: ServarrValidationError[]
}

export interface ServarrField {
  order: number
  name: string
  label: string
  unit?: string
  helpText?: string
  helpTextWarning?: string
  helpLink?: string
  value?: any
  type: string
  advanced?: boolean
  selectOptions?: Array<{
    value: string | number
    name: string
    order?: number
    hint?: string
  }>
  selectOptionsProviderAction?: string
  section?: string
  hidden?: string
  privacy?: string
  placeholder?: string
  isFloat?: boolean
}

export function appFromProvider(provider: ServarrProvider): ServarrApp {
  return provider === "RADARR" ? "radarr" : "sonarr"
}

export function providerFromApp(app: ServarrApp): ServarrProvider {
  return app === "radarr" ? "RADARR" : "SONARR"
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const val = bytes / 1024 ** idx
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

export async function servarrRequest<T = any>(
  app: ServarrApp,
  path: string,
  options: RequestInit = {}
): Promise<ServarrEnvelope<T>> {
  const cleanPath = path.replace(/^\/+/, "")
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData

  const res = await fetch(`/elysia/servarr/${app}/${cleanPath}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string>),
    },
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const errMsg =
      json?.detail ||
      json?.message ||
      `Request failed with status ${res.status}`
    return {
      ok: false,
      success: false,
      connected: true,
      provider: providerFromApp(app),
      data: null as T,
      message: errMsg,
      error: errMsg,
      validationErrors: json?.validationErrors ?? [],
    }
  }

  return {
    ...(json as ServarrEnvelope<T>),
    ok: Boolean(json?.success ?? true),
    error: json?.success === false ? json?.message : undefined,
  }
}

export { elysia }
