"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconAlertTriangle, IconLock } from "@tabler/icons-react"
import type { ReliquarySidebarNode } from "@NamelessLiberty/shared"
import { Button } from "@workspace/ui/components/button"
import { elysia } from "@/lib/elysia"
import { useReliquaryContext } from "../../components/reliquary-context"
import { ReliquaryDocView } from "../../components/reliquary-doc-view"
import type {
  ReliquaryDocDetail,
  ReliquaryPageDetail,
} from "../../components/reliquary-types"

type LoadErrorKind =
  | "unauthorized"
  | "forbidden"
  | "doc_not_found"
  | "page_not_found"
  | "error"
  | null

function updateSidebarPageTitle(
  nodes: ReliquarySidebarNode[],
  pageId: string,
  title: string
): ReliquarySidebarNode[] {
  return nodes.map((node) => ({
    ...node,
    ...(node.pageId === pageId ? { label: title } : {}),
    ...(node.children
      ? { children: updateSidebarPageTitle(node.children, pageId, title) }
      : {}),
  }))
}

export default function ReliquarySubPage() {
  const router = useRouter()
  const params = useParams<{ docId: string; pageId: string }>()
  const docId = params?.docId ?? ""
  const pageId = params?.pageId ?? ""

  const t = useTranslations("reliquary")
  const tErr = useTranslations("reliquary.errors")
  const { activeDoc, setActiveDoc } = useReliquaryContext()

  const [loading, setLoading] = useState(true)
  const [errorKind, setErrorKind] = useState<LoadErrorKind>(null)
  const [docState, setDocState] = useState<ReliquaryDocDetail | null>(null)
  const [pageState, setPageState] = useState<ReliquaryPageDetail | null>(null)

  useEffect(() => {
    if (!docId || !pageId) return
    let cancelled = false

    const loadDocAndPage = async () => {
      setLoading(true)
      setErrorKind(null)
      try {
        const [docRes, pageRes] = await Promise.all([
          elysia.reliquary.docs({ docId }).get(),
          elysia.reliquary.docs({ docId }).pages({ pageId }).get(),
        ])
        if (cancelled) return

        if (docRes.error || !docRes.data?.doc) {
          setActiveDoc(null)
          setDocState(null)
          setPageState(null)
          if (docRes.status === 401) setErrorKind("unauthorized")
          else if (docRes.status === 403) setErrorKind("forbidden")
          else if (docRes.status === 404) setErrorKind("doc_not_found")
          else setErrorKind("error")
          return
        }

        const fetchedDoc = docRes.data.doc as unknown as ReliquaryDocDetail
        setDocState(fetchedDoc)
        setActiveDoc(fetchedDoc)

        if (pageRes.error || !pageRes.data?.page) {
          setPageState(null)
          if (pageRes.status === 401) setErrorKind("unauthorized")
          else if (pageRes.status === 403) setErrorKind("forbidden")
          else if (pageRes.status === 404) setErrorKind("page_not_found")
          else setErrorKind("error")
          return
        }

        const fetchedPage = pageRes.data.page as unknown as ReliquaryPageDetail
        setPageState(fetchedPage)
      } catch {
        if (!cancelled) {
          setActiveDoc(null)
          setDocState(null)
          setPageState(null)
          setErrorKind("error")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDocAndPage()
    return () => {
      cancelled = true
    }
  }, [docId, pageId, setActiveDoc])

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

  if (errorKind || !currentDoc || !pageState) {
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
            {errorKind === "page_not_found" && docId && (
              <Button onPress={() => router.push(`/reliquary/${docId}`)}>
                {tErr("backToDoc")}
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
      pageId={pageState.id}
      schema={pageState.schema}
      initialLock={pageState.lock}
      canEdit={pageState.canEdit}
      canManage={pageState.canManage}
      onSavedSchema={(updatedSchema) => {
        const nextTitle = updatedSchema.title?.trim() || pageState.title
        setPageState((prev) =>
          prev ? { ...prev, title: nextTitle, schema: updatedSchema } : prev
        )
        setActiveDoc((prev) => {
          if (!prev || prev.id !== currentDoc.id) return prev
          return {
            ...prev,
            sidebarConfig: updateSidebarPageTitle(
              prev.sidebarConfig,
              pageState.id,
              nextTitle
            ),
          }
        })
      }}
    />
  )
}
