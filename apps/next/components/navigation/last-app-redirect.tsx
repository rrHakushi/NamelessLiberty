"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Reads `iris_last_app` from localStorage and redirects authenticated users
 * from `/` to their last visited app (falling back to `/borealis`).
 */
export function LastAppRedirect(): null {
  const router = useRouter()

  useEffect(() => {
    let targetPath = "/borealis"
    try {
      const saved = window.localStorage.getItem("iris_last_app")
      if (
        saved &&
        saved.startsWith("/") &&
        !saved.startsWith("//") &&
        !saved.includes("/auth/")
      ) {
        targetPath = saved
      }
    } catch {
      targetPath = "/borealis"
    }
    router.replace(targetPath)
  }, [router])

  return null
}
