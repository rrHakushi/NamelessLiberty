import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LastAppRedirect } from "@/components/navigation/last-app-redirect"

export default async function RootPage() {
  const session = await auth()

  if (!session) {
    redirect("/carina/auth/login")
  }

  return <LastAppRedirect />
}
