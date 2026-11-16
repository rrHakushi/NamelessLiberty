"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import { toast } from "sonner"
import { elysia } from "@/lib/elysia"
import { AddPageDialog } from "./add-page-dialog"
import { BookStructureDialog } from "./book-structure-dialog"
import { DocSettingsDialog } from "./doc-settings-dialog"
import { extractApiErrorMessage, type ReliquaryDocDetail } from "./reliquary-types"

interface ReliquaryContextValue {
  activeDoc: ReliquaryDocDetail | null
  setActiveDoc: React.Dispatch<React.SetStateAction<ReliquaryDocDetail | null>>
  openAddPage: () => void
  openStructure: () => void
  openSettings: () => void
  toggleBookmark: () => Promise<void>
}

const ReliquaryContext = createContext<ReliquaryContextValue | null>(null)

export function ReliquaryProvider({ children }: { children: React.ReactNode }) {
  const [activeDoc, setActiveDoc] = useState<ReliquaryDocDetail | null>(null)
  const [addPageOpen, setAddPageOpen] = useState(false)
  const [structureOpen, setStructureOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const toggleBookmark = useCallback(async () => {
    if (!activeDoc) return
    const nextState = !activeDoc.isBookmarked
    try {
      const api = elysia.reliquary.docs({ docId: activeDoc.id }).bookmark
      const res = nextState ? await api.post() : await api.delete()
      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, "Failed to update bookmark"))
        return
      }
      setActiveDoc((prev) => (prev ? { ...prev, isBookmarked: nextState } : prev))
    } catch (err) {
      toast.error(extractApiErrorMessage(err, "Failed to update bookmark"))
    }
  }, [activeDoc])

  return (
    <ReliquaryContext.Provider
      value={{
        activeDoc,
        setActiveDoc,
        openAddPage: () => setAddPageOpen(true),
        openStructure: () => setStructureOpen(true),
        openSettings: () => setSettingsOpen(true),
        toggleBookmark,
      }}
    >
      {children}

      {activeDoc && (
        <>
          <AddPageDialog
            open={addPageOpen}
            onOpenChange={setAddPageOpen}
            doc={activeDoc}
            onDocUpdated={setActiveDoc}
          />
          <BookStructureDialog
            open={structureOpen}
            onOpenChange={setStructureOpen}
            doc={activeDoc}
            onDocUpdated={setActiveDoc}
          />
          <DocSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            doc={activeDoc}
            onDocUpdated={setActiveDoc}
          />
        </>
      )}
    </ReliquaryContext.Provider>
  )
}

export function useReliquaryContext() {
  const ctx = useContext(ReliquaryContext)
  if (!ctx) {
    throw new Error("useReliquaryContext must be used inside ReliquaryProvider")
  }
  return ctx
}
