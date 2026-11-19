import fs from "node:fs"
import path from "node:path"
import bundledConfig from "../../../iris.json"
import { ALL_APPS, type IrisAppId } from "./enabled-apps"

type IrisAppsConfig = Record<string, { enabled?: boolean } | undefined>

let cachedConfig: IrisAppsConfig | null = null

function readLiveIrisConfig(): IrisAppsConfig {
  if (cachedConfig) return cachedConfig
  const candidates = [
    path.resolve(process.cwd(), "iris.json"),
    path.resolve(process.cwd(), "../../iris.json"),
  ]
  for (const candidate of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      try {
        cachedConfig = JSON.parse(
          fs.readFileSync(/*turbopackIgnore: true*/ candidate, "utf8")
        ) as IrisAppsConfig
        return cachedConfig
      } catch {
        // Fall through to bundled config
      }
    }
  }
  cachedConfig = bundledConfig as IrisAppsConfig
  return cachedConfig
}

export function isServerAppEnabled(appId: string): boolean {
  const entry = readLiveIrisConfig()[appId.toLowerCase()]
  return entry?.enabled !== false
}

export function getRuntimeEnabledApps(): IrisAppId[] {
  return ALL_APPS.filter((id) => isServerAppEnabled(id))
}
