"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Tracks the user's active application in localStorage (`iris_last_app`).
 * Used when visiting root (`/`) to redirect the user back to their last used application.
 */
export function LastAppTracker(): null {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname || pathname === "/") return

    // Do not record authentication flows as last used apps
    if (pathname.includes("/auth/")) return

    // Detect if we are inside a known app (e.g. /borealis, /carina, /kiroshi, /akaromi, /tesseract, /reliquary, /runa)
    if (
      pathname.startsWith("/borealis") ||
      pathname.startsWith("/carina") ||
      pathname.startsWith("/kiroshi") ||
      pathname.startsWith("/akaromi") ||
      pathname.startsWith("/tesseract") ||
      pathname.startsWith("/reliquary") ||
      pathname.startsWith("/runa") ||
      pathname.startsWith("/IRIS-") ||
      pathname.startsWith("/list")
    ) {
      try {
        window.localStorage.setItem("iris_last_app", pathname)
      } catch {
        // Ignore storage errors (e.g. private browsing restrictions)
      }
    }
  }, [pathname])

  return null
}
