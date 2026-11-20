import { useMemo } from "react"
import type { Session } from "@/context/session-context"
import type { SidebarConfig } from "@/types/sidebar-config"
// @app:borealis:start
import {
  useBorealisSidebarConfig,
  getBorealisSidebarConfig,
} from "@NamelessLiberty/borealis"
// @app:borealis:end
// @app:akaromi:start
import {
  useAkaromiSidebarConfig,
  getAkaromiSidebarConfig,
} from "@NamelessLiberty/akaromi"
// @app:akaromi:end
// @app:kiroshi:start
import {
  useKiroshiSidebarConfig,
  getKiroshiSidebarConfig,
} from "@NamelessLiberty/kiroshi"
// @app:kiroshi:end
// @app:carina:start
import {
  useCarinaSidebarConfig,
  getCarinaSidebarConfig,
  useCarinaUserSidebarConfig,
  getCarinaUserSidebarConfig,
} from "@NamelessLiberty/carina"
// @app:carina:end
// @app:tesseract:start
import {
  useTesseractSidebarConfig,
  getTesseractSidebarConfig,
} from "@NamelessLiberty/tesseract"
// @app:tesseract:end
// @app:reliquary:start
import {
  useReliquarySidebarConfig,
  getReliquarySidebarConfig,
} from "@NamelessLiberty/reliquary"
// @app:reliquary:end

export interface AppSidebarRegistryEntry {
  appId: string
  appName: string
  config: SidebarConfig
}

/**
 * Hook returning sidebar navigation configurations for all registered apps.
 * Encapsulates the proper localized translation namespaces for each app.
 */
export function useAllAppSidebarConfigs(
  session: Session | null
): AppSidebarRegistryEntry[] {
  // @app:borealis:start
  const borealisConfig = useBorealisSidebarConfig(session)
  // @app:borealis:end
  // @app:akaromi:start
  const akaromiConfig = useAkaromiSidebarConfig(session)
  // @app:akaromi:end
  // @app:kiroshi:start
  const kiroshiConfig = useKiroshiSidebarConfig(session)
  // @app:kiroshi:end
  // @app:carina:start
  const carinaConfig = useCarinaSidebarConfig(session)
  // @app:carina:end
  // @app:tesseract:start
  const tesseractConfig = useTesseractSidebarConfig(session)
  // @app:tesseract:end
  // @app:reliquary:start
  const reliquaryConfig = useReliquarySidebarConfig(session)
  // @app:reliquary:end

  return useMemo(
    () => [
      // @app:borealis:start
      {
        appId: "borealis",
        appName: "Borealis",
        config: borealisConfig,
      },
      // @app:borealis:end
      // @app:akaromi:start
      {
        appId: "akaromi",
        appName: "Akaromi",
        config: akaromiConfig,
      },
      // @app:akaromi:end
      // @app:kiroshi:start
      {
        appId: "kiroshi",
        appName: "Kiroshi",
        config: kiroshiConfig,
      },
      // @app:kiroshi:end
      // @app:carina:start
      {
        appId: "carina",
        appName: "Carina",
        config: carinaConfig,
      },
      // @app:carina:end
      // @app:tesseract:start
      {
        appId: "tesseract",
        appName: "Tesseract",
        config: tesseractConfig,
      },
      // @app:tesseract:end
      // @app:reliquary:start
      {
        appId: "reliquary",
        appName: "Reliquary",
        config: reliquaryConfig,
      },
      // @app:reliquary:end
    ],
    [
      // @app:borealis:start
      borealisConfig,
      // @app:borealis:end
      // @app:akaromi:start
      akaromiConfig,
      // @app:akaromi:end
      // @app:kiroshi:start
      kiroshiConfig,
      // @app:kiroshi:end
      // @app:carina:start
      carinaConfig,
      // @app:carina:end
      // @app:tesseract:start
      tesseractConfig,
      // @app:tesseract:end
      // @app:reliquary:start
      reliquaryConfig,
      // @app:reliquary:end
    ]
  )
}

/**
 * Non-hook helper returning sidebar navigation configurations.
 */
export function getAllAppSidebarConfigs(
  session: Session | null,
  tList?: (key: string) => string,
  connectedServarr?: string[]
): AppSidebarRegistryEntry[] {
  return [
    // @app:borealis:start
    {
      appId: "borealis",
      appName: "Borealis",
      config: getBorealisSidebarConfig(
        session,
        tList ?? ((k: string) => k),
        connectedServarr
      ),
    },
    // @app:borealis:end
    // @app:akaromi:start
    {
      appId: "akaromi",
      appName: "Akaromi",
      config: getAkaromiSidebarConfig(session),
    },
    // @app:akaromi:end
    // @app:kiroshi:start
    {
      appId: "kiroshi",
      appName: "Kiroshi",
      config: getKiroshiSidebarConfig(session),
    },
    // @app:kiroshi:end
    // @app:carina:start
    {
      appId: "carina",
      appName: "Carina",
      config: getCarinaSidebarConfig(session),
    },
    // @app:carina:end
    // @app:tesseract:start
    {
      appId: "tesseract",
      appName: "Tesseract",
      config: getTesseractSidebarConfig(session),
    },
    // @app:tesseract:end
    // @app:reliquary:start
    {
      appId: "reliquary",
      appName: "Reliquary",
      config: getReliquarySidebarConfig(session),
    },
    // @app:reliquary:end
  ]
}

// @app:borealis:start
export * from "@NamelessLiberty/borealis/config/borealis-sidebar-config"
// @app:borealis:end
// @app:akaromi:start
export * from "@NamelessLiberty/akaromi/config/akaromi-sidebar-config"
// @app:akaromi:end
// @app:kiroshi:start
export * from "@NamelessLiberty/kiroshi/config/kiroshi-sidebar-config"
// @app:kiroshi:end
// @app:carina:start
export {
  useCarinaSidebarConfig,
  getCarinaSidebarConfig,
  useCarinaUserSidebarConfig,
  getCarinaUserSidebarConfig,
}
// @app:carina:end
// @app:tesseract:start
export * from "@NamelessLiberty/tesseract/config/tesseract-sidebar-config"
// @app:tesseract:end
// @app:reliquary:start
export * from "@NamelessLiberty/reliquary/config/reliquary-sidebar-config"
// @app:reliquary:end
