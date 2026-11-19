"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  IconBook,
  IconCompass,
  IconFolder,
  IconLogin,
  IconPlus,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { useSession } from "@/context/session-context"
import { elysia } from "@/lib/elysia"
import { CreateDocDialog } from "@NamelessLiberty/reliquary"
import { DocSummaryCard } from "@NamelessLiberty/reliquary"
import { useReliquaryContext } from "@NamelessLiberty/reliquary"
import {
  extractApiErrorMessage,
  type ReliquaryDocSummary,
} from "@NamelessLiberty/reliquary"

export default function ReliquaryHomePage() {
  const router = useRouter()
  const t = useTranslations("reliquary")
  const { data: session, status } = useSession()
  const { setActiveDoc } = useReliquaryContext()

  const [createOpen, setCreateOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [myDocs, setMyDocs] = useState<ReliquaryDocSummary[]>([])

  useEffect(() => {
    setActiveDoc(null)
  }, [setActiveDoc])

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return
    let cancelled = false

    const loadHome = async () => {
      setLoading(true)
      try {
        const res = await elysia.reliquary.home.get()
        if (cancelled) return
        if (res.error || !res.data) {
          toast.error(extractApiErrorMessage(res.error, t("errors.saveFailed")))
          return
        }
        setMyDocs(res.data.myDocs as ReliquaryDocSummary[])
      } catch (err) {
        if (!cancelled) {
          toast.error(extractApiErrorMessage(err, t("errors.saveFailed")))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadHome()
    return () => {
      cancelled = true
    }
  }, [session?.user, status, t])

  if (status === "loading") {
    return (
      <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted/60" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-full w-full items-center justify-center p-6">
        <div className="flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border/70 bg-muted/60 text-foreground">
            <IconBook className="size-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("signInTitle")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("signInDescription")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              onPress={() => router.push("/carina/auth/login")}
              className="gap-2"
            >
              <IconLogin className="size-4" />
              <span>{t("signInButton")}</span>
            </Button>
            <Button
              variant="outline"
              onPress={() => router.push("/reliquary/browse")}
              className="gap-2"
            >
              <IconCompass className="size-4" />
              <span>{t("browsePublic")}</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <IconFolder className="size-5 text-muted-foreground" />
          <h1>{t("myDocuments")}</h1>
        </div>

        <Button onPress={() => setCreateOpen(true)} className="gap-2">
          <IconPlus className="size-4" />
          <span>{t("newDocument")}</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : myDocs.length === 0 ? (
        <div className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 p-12 text-center">
          <IconFolder className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("emptyMyDocs")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {myDocs.map((doc) => (
            <DocSummaryCard key={doc.id} doc={doc} showVisibilityBadge />
          ))}
        </div>
      )}

      <CreateDocDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
