import type { Metadata } from "next"
import React from "react"
import { ServarrSystemView } from "@NamelessLiberty/borealis"

export const metadata: Metadata = {
  title: "Borealis | Servarr > Sonarr > System",
  description: "Sonarr v5 system status, tasks, backups, updates, events & log files.",
}

export default function SonarrSystemPage() {
  return <ServarrSystemView app="sonarr" />
}

