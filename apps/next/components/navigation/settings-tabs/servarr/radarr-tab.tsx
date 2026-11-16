"use client"

import React from "react"
import Link from "next/link"
import { ServarrSettingsShell } from "@NamelessLiberty/borealis"
import {
  IconMovie,
  IconCloudDownload,
  IconServer,
} from "@tabler/icons-react"
import type { SettingsTabProps } from "../types"

const RADARR_LINKS = [
  { href: "/borealis/servarr/radarr/movies", label: "Movies", icon: IconMovie },
  { href: "/borealis/servarr/radarr/queue", label: "Queue", icon: IconCloudDownload },
  { href: "/borealis/servarr/radarr/system", label: "System", icon: IconServer },
]

export function RadarrSettingsTab({}: SettingsTabProps): React.JSX.Element {
  return (
    <div className="w-full flex-1 animate-in space-y-5 pb-6 duration-200 fade-in-50">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-3">
        {RADARR_LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border/60 bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Icon className="size-3.5 text-primary" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      <ServarrSettingsShell app="radarr" compact />
    </div>
  )
}
