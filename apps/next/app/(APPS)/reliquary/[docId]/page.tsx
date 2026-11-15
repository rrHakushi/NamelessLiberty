"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconAlertTriangle, IconLock } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { elysia } from "@/lib/elysia"
import { useReliquaryContext } from "../components/reliquary-context"
import { ReliquaryDocView } from "../components/reliquary-doc-view"
import type { ReliquaryDocDetail } from "../components/reliquary-types"

type LoadErrorKind = "unauthorized" | "forbidden" | "not_found" | "error" | null

export default function ReliquaryDocLandingPage() {
  const router = useRouter()
  const params = useParams<{ docId: string }>()
  const docId = params?.docId ?? ""
  const t = useTranslations("reliquary")
  const tErr = useTranslations("reliquary.errors")
  const { activeDoc, setActiveDoc } = useReliquaryContext()

  const [loading, setLoading] = useState(true)
  const [errorKind, setErrorKind] = useState<LoadErrorKind>(null)
  const [docState, setDocState] = useState<ReliquaryDocDetail | null>(null)

  useEffect(() => {
    if (!docId) return
    let cancelled = false

    const loadDoc = async () => {
      setLoading(true)
      setErrorKind(null)
      try {
        const res = await elysia.reliquary.docs({ docId }).get()
        if (cancelled) return

        if (res.error || !res.data?.doc) {
          setActiveDoc(null)
          setDocState(null)
          if (res.status === 401) setErrorKind("unauthorized")
          else if (res.status === 403) setErrorKind("forbidden")
          else if (res.status === 404) setErrorKind("not_found")
          else setErrorKind("error")
          return
        }

        const fetchedDoc = res.data.doc as unknown as ReliquaryDocDetail
        setDocState(fetchedDoc)
        setActiveDoc(fetchedDoc)
      } catch {
        if (!cancelled) {
          setActiveDoc(null)
          setDocState(null)
          setErrorKind("error")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDoc()
    return () => {
      cancelled = true
    }
  }, [docId, setActiveDoc])

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-8">
        <div className="h-10 w-72 animate-pulse rounded-lg bg-muted/60" />
        <div className="h-4 w-96 animate-pulse rounded-lg bg-muted/50" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/40" />
      </div>
    )
  }

  const currentDoc = activeDoc?.id === docState?.id ? activeDoc : docState

  if (errorKind || !currentDoc) {
    const isAuthIssue =
      errorKind === "unauthorized" || errorKind === "forbidden"
    const message =
      errorKind === "unauthorized"
        ? tErr("signInRequired")
        : errorKind === "forbidden"
          ? tErr("forbidden")
          : tErr("notFound")

    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card p-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {isAuthIssue ? (
              <IconLock className="size-5" />
            ) : (
              <IconAlertTriangle className="size-5" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">{message}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {errorKind === "unauthorized" && (
              <Button onPress={() => router.push("/carina/auth/login")}>
                {t("signInButton")}
              </Button>
            )}
            <Button
              variant="outline"
              onPress={() => router.push("/reliquary/browse")}
            >
              {tErr("backToBrowse")}
            </Button>
            <Button variant="ghost" onPress={() => router.push("/reliquary")}>
              {tErr("backToHome")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ReliquaryDocView
      doc={currentDoc}
      schema={currentDoc.schema}
      initialLock={currentDoc.lock}
      canEdit={currentDoc.canEdit}
      canManage={currentDoc.canManage}
      onSavedSchema={(updatedSchema) => {
        setDocState((prev) =>
          prev ? { ...prev, schema: updatedSchema } : prev
        )
        setActiveDoc((prev) =>
          prev && prev.id === currentDoc.id
            ? { ...prev, schema: updatedSchema }
            : prev
        )
      }}
    />
  )
}
