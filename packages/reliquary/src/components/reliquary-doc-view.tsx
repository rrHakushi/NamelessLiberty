"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { IconLock, IconLockOpen } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { IrisPage } from "@/components/iris-page/iris-page"
import type { IrisPageSchema } from "@/components/iris-page/types"
import { useWebSocket } from "@/context/websocket-context"
import { useSession } from "@/context/session-context"
import { elysia, getApiUrl } from "@/lib/elysia"
import {
  extractApiErrorMessage,
  type ReliquaryDocDetail,
  type ReliquaryLockStatus,
} from "./reliquary-types"

export interface ReliquaryDocViewProps {
  doc: ReliquaryDocDetail
  pageId?: string | null
  schema: IrisPageSchema
  initialLock: ReliquaryLockStatus
  canEdit: boolean
  canManage: boolean
  onSavedSchema?: (updatedSchema: IrisPageSchema) => void
}

export function ReliquaryDocView({
  doc,
  pageId = null,
  schema,
  initialLock,
  canEdit,
  canManage,
  onSavedSchema,
}: ReliquaryDocViewProps) {
  const tLock = useTranslations("reliquary.lock")
  const tErr = useTranslations("reliquary.errors")

  const { data: session } = useSession()
  const { subscribe } = useWebSocket()

  const [lockState, setLockState] = useState<ReliquaryLockStatus>(initialLock)
  const [holdingLock, setHoldingLock] = useState(false)
  const holdingLockRef = useRef(false)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => {
    setLockState(initialLock)
  }, [initialLock])

  useEffect(() => {
    holdingLockRef.current = holdingLock
  }, [holdingLock])

  // Subscribe to live lock change events on the Main Doc WebSocket channel
  useEffect(() => {
    const currentUserId = session?.user?.id
    const unsubscribe = subscribe(`reliquary-doc-${doc.id}`, (payload: any) => {
      if (!payload || payload.event !== "reliquary:lock-changed") return
      const evt = payload.data as {
        docId?: string
        pageId?: string | null
        lock?: ReliquaryLockStatus
      }
      if (!evt || evt.docId !== doc.id) return
      if ((evt.pageId ?? null) !== (pageId ?? null)) return
      if (!evt.lock) return

      const nextOwned = Boolean(
        currentUserId && evt.lock.locked && evt.lock.lockedBy?.id === currentUserId
      )
      setLockState({
        ...evt.lock,
        isOwnedByCurrentUser: nextOwned,
      })
      if (!nextOwned && holdingLockRef.current) {
        setHoldingLock(false)
      }
    })
    return unsubscribe
  }, [doc.id, pageId, session?.user?.id, subscribe])

  const releaseLockOnServer = useCallback(async () => {
    setHoldingLock(false)
    try {
      await elysia.reliquary
        .docs({ docId: doc.id })
        .locks.release.post({ pageId: pageId ?? null })
    } catch {
      // Ignore cleanup errors
    }
  }, [doc.id, pageId])

  // 30s heartbeat + unload sendBeacon while PageBuilder is open
  useEffect(() => {
    if (!holdingLock) return

    const heartbeatTimer = window.setInterval(async () => {
      try {
        const res = await elysia.reliquary
          .docs({ docId: doc.id })
          .locks.heartbeat.post({ pageId: pageId ?? null })
        if (res.error) {
          setHoldingLock(false)
          toast.error(extractApiErrorMessage(res.error, tLock("acquireError")))
        } else if (res.data?.lock) {
          setLockState(res.data.lock as ReliquaryLockStatus)
        }
      } catch {
        // Retry next interval until lease expires
      }
    }, 30_000)

    const handleBeforeUnload = () => {
      try {
        const url = `${getApiUrl()}/reliquary/docs/${doc.id}/locks/release`
        const body = new Blob([JSON.stringify({ pageId: pageId ?? null })], {
          type: "application/json",
        })
        navigator.sendBeacon(url, body)
      } catch {
        // Ignore unload beacon failure
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.clearInterval(heartbeatTimer)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [doc.id, holdingLock, pageId, tLock])

  // Release lock if user navigates away via client-side router while editing
  useEffect(() => {
    return () => {
      if (holdingLockRef.current) {
        try {
          const url = `${getApiUrl()}/reliquary/docs/${doc.id}/locks/release`
          const body = new Blob([JSON.stringify({ pageId: pageId ?? null })], {
            type: "application/json",
          })
          navigator.sendBeacon(url, body)
        } catch {}
      }
    }
  }, [doc.id, pageId])

  const handleBeforeEdit = useCallback(async () => {
    try {
      const res = await elysia.reliquary
        .docs({ docId: doc.id })
        .locks.acquire.post({ pageId: pageId ?? null })

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tLock("acquireError")))
        return false
      }

      if (res.data?.lock) {
        setLockState(res.data.lock as ReliquaryLockStatus)
      }
      setHoldingLock(true)
      return true
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tLock("acquireError")))
      return false
    }
  }, [doc.id, pageId, tLock])

  const handleSaveSchema = useCallback(
    async (updatedSchema: IrisPageSchema) => {
      try {
        if (pageId) {
          const res = await elysia.reliquary
            .docs({ docId: doc.id })
            .pages({ pageId })
            .put({
              ...(typeof updatedSchema.title === "string" && updatedSchema.title.trim()
                ? { title: updatedSchema.title.trim() }
                : {}),
              schema: updatedSchema as unknown as Record<string, unknown>,
              releaseLock: true,
            })

          if (res.error) {
            toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
            return false
          }
          if (res.data?.page) {
            setLockState(res.data.page.lock as ReliquaryLockStatus)
          }
        } else {
          const res = await elysia.reliquary
            .docs({ docId: doc.id })
            .schema.put({
              schema: updatedSchema as unknown as Record<string, unknown>,
              releaseLock: true,
            })

          if (res.error) {
            toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
            return false
          }
          if (res.data?.doc) {
            setLockState(res.data.doc.lock as ReliquaryLockStatus)
          }
        }

        setHoldingLock(false)
        onSavedSchema?.(updatedSchema)
        return true
      } catch (err) {
        toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
        return false
      }
    },
    [doc.id, onSavedSchema, pageId, tErr]
  )

  const handleForceUnlock = async () => {
    setUnlocking(true)
    try {
      const res = await elysia.reliquary
        .docs({ docId: doc.id })
        .locks["force-unlock"].post({ pageId: pageId ?? null })

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }
      if (res.data?.lock) {
        setLockState(res.data.lock as ReliquaryLockStatus)
      }
      toast.success(tLock("forceUnlockSuccess"))
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setUnlocking(false)
    }
  }

  const lockedByOther = Boolean(
    lockState.locked && !lockState.isOwnedByCurrentUser && lockState.lockedBy
  )

  const lockedUsername = lockState.lockedBy?.username ?? "editor"

  return (
    <div className="flex min-h-full w-full flex-col has-[[data-iris-editing=true]]:h-full has-[[data-iris-editing=true]]:min-h-0 has-[[data-iris-editing=true]]:flex-1 has-[[data-iris-editing=true]]:overflow-hidden">
      {lockedByOther && (
        <div className="mx-auto mt-4 flex w-full max-w-4xl items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <IconLock className="size-4 shrink-0" />
            <span className="font-medium">
              {tLock("lockedBy", { username: lockedUsername })}
            </span>
          </div>
          {canManage && (
            <Button
              size="xs"
              variant="outline"
              isDisabled={unlocking}
              onPress={handleForceUnlock}
              className="gap-1.5 shrink-0"
            >
              <IconLockOpen className="size-3.5" />
              <span>{tLock("forceUnlock")}</span>
            </Button>
          )}
        </div>
      )}

      <IrisPage
        schema={schema}
        canEdit={canEdit}
        beforeEdit={handleBeforeEdit}
        onCancelEdit={() => {
          void releaseLockOnServer()
        }}
        onSaveSchema={handleSaveSchema}
        editDisabled={lockedByOther}
        editDisabledReason={
          lockedByOther ? tLock("editingLockedTooltip", { username: lockedUsername }) : undefined
        }
      />
    </div>
  )
}
