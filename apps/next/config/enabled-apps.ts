import irisConfig from "../../../iris.json"

export type IrisAppId =
  | "akaromi"
  | "borealis"
  | "carina"
  | "kiroshi"
  | "reliquary"
  | "runa"
  | "tesseract"

type IrisAppsConfig = Record<string, { enabled?: boolean } | undefined>

export const ALL_APPS: readonly IrisAppId[] = [
  "akaromi",
  "borealis",
  "carina",
  "kiroshi",
  "reliquary",
  "runa",
  "tesseract",
]

let runtimeEnabledApps: Set<string> | null = null

export function setRuntimeEnabledApps(apps: readonly string[]): void {
  runtimeEnabledApps = new Set(apps.map((a) => a.toLowerCase()))
}

export function isAppEnabled(appId: string): boolean {
  const normalized = appId.toLowerCase()
  if (runtimeEnabledApps) {
    return runtimeEnabledApps.has(normalized)
  }
  const entry = (irisConfig as IrisAppsConfig)[normalized]
  return entry?.enabled !== false
}

export const ENABLED_APPS: readonly IrisAppId[] = ALL_APPS.filter((id) =>
  isAppEnabled(id)
)
