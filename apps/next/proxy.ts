import { NextResponse, type NextRequest } from "next/server"
import { getDomainConfig } from "@/lib/domain"
import { ALL_APPS } from "@/config/enabled-apps"
import { isServerAppEnabled } from "@/config/enabled-apps-server"

export default function proxy(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  if (
    firstSegment &&
    (ALL_APPS as readonly string[]).includes(firstSegment) &&
    !isServerAppEnabled(firstSegment)
  ) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const response = NextResponse.next()
  const { cookieDomain, isSecure } = getDomainConfig()

  if (cookieDomain) {
    const sessionCookie = request.cookies.get("session")
    if (sessionCookie?.value) {
      response.cookies.set("session", sessionCookie.value, {
        domain: cookieDomain,
        path: "/",
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60,
      })
    }
  }

  return response
}
