"use client"

import { useMemo } from "react"
import { IconHome } from "@tabler/icons-react"
import type { SidebarConfig } from "@/types/sidebar-config"
import type { Session } from "@/context/session-context"

/**
 * Tesseract uses a single shared local-network page with a Home link back to /.
 */
export function getTesseractSidebarConfig(
  _session?: Session | null,
  _t?: (key: string) => string
): SidebarConfig {
  return [
    {
      section: "",
      dataKey: "tesseract-main",
      items: [
        {
          label: "Home",
          dataKey: "tesseract-home",
          href: "/tesseract",
          icon: <IconHome className="size-4 shrink-0" />,
        },
      ],
    },
  ]
}

export function useTesseractSidebarConfig(
  session?: Session | null
): SidebarConfig {
  return useMemo(() => getTesseractSidebarConfig(session), [session])
}

export const tesseractSidebarConfig: SidebarConfig = getTesseractSidebarConfig()
