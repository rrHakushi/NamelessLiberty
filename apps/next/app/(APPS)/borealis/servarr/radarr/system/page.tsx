import type { Metadata } from "next"
import React from "react"
import { ServarrSystemView } from "@NamelessLiberty/borealis"

export const metadata: Metadata = {
  title: "Borealis | Servarr > Radarr > System",
  description: "Radarr system status, tasks, backups, updates, events & log files.",
}

export default function RadarrSystemPage() {
  return <ServarrSystemView app="radarr" />
}

