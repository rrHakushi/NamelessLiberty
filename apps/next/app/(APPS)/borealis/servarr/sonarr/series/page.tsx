import type { Metadata } from "next"
import React from "react"
import { ServarrMediaView } from "@NamelessLiberty/borealis"

export const metadata: Metadata = {
  title: "Borealis | Servarr > Sonarr > Series",
  description:
    "Browse and manage TV & anime series from your connected Sonarr instance.",
}

export default function SonarrSeriesPage() {
  return (
    <ServarrMediaView
      provider="SONARR"
      pageTitle="Sonarr"
      subtitle="Connected TV & anime series monitoring"
    />
  )
}

