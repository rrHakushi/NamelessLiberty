import { Suspense } from "react"
import type { Metadata } from "next"
import { CalendarPageClient } from "@NamelessLiberty/borealis"
import { CalendarLoadingFallback } from "@NamelessLiberty/borealis"

export const metadata: Metadata = {
  title: "Borealis | Calendar",
  description:
    "Track upcoming and recent media releases across anime airing schedules, manga publications, TV series episodes, movie premieres, video games, books, and music.",
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarLoadingFallback />}>
      <CalendarPageClient />
    </Suspense>
  )
}
