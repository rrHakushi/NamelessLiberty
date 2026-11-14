"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  IconArrowUp,
  IconCheck,
  IconFile,
  IconFolder,
  IconRefresh,
} from "@tabler/icons-react"
import { servarrRequest, type ServarrApp } from "./servarr-client"

interface FilesystemEntry {
  type: "folder" | "file" | "drive"
  name: string
  path: string
  size?: number
}

export interface ServarrFilesystemDialogProps {
  isOpen: boolean
  onClose: () => void
  app: ServarrApp
  initialPath?: string
  includeFiles?: boolean
  title?: string
  onSelect: (path: string) => void
}

export function ServarrFilesystemDialog({
  isOpen,
  onClose,
  app,
  initialPath = "",
  includeFiles = false,
  title = "Browse Server Filesystem",
  onSelect,
}: ServarrFilesystemDialogProps) {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [parentPath, setParentPath] = useState<string | null>(null)
  const [directories, setDirectories] = useState<FilesystemEntry[]>([])
  const [files, setFiles] = useState<FilesystemEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPath = useCallback(
    async (targetPath: string) => {
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (targetPath) qs.set("path", targetPath)
        if (includeFiles) qs.set("includeFiles", "true")
        qs.set("allowFoldersWithoutTrailingSlashes", "true")
        const res = await servarrRequest<{
          parent?: string | null
          directories?: FilesystemEntry[]
          files?: FilesystemEntry[]
        }>(app, `filesystem?${qs.toString()}`)

        if (!res.success || !res.data) {
          setError(res.message || "Failed to browse server path")
          return
        }
        setParentPath(res.data.parent ?? null)
        setDirectories(res.data.directories ?? [])
        setFiles(res.data.files ?? [])
      } catch (err: any) {
        setError(err?.message || "Failed to browse filesystem")
      } finally {
        setLoading(false)
      }
    },
    [app, includeFiles]
  )

  useEffect(() => {
    if (isOpen) {
      setCurrentPath(initialPath)
      void loadPath(initialPath)
    }
  }, [isOpen, initialPath, loadPath])

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      className="max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100 p-6"
    >
      <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-start">
            <IconFolder className="size-5 text-zinc-400" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={loading || parentPath === null}
              onPress={() => {
                const next = parentPath ?? ""
                setCurrentPath(next)
                void loadPath(next)
              }}
              aria-label="Parent folder"
            >
              <IconArrowUp className="size-4" />
            </Button>
            <Input
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void loadPath(currentPath)
              }}
              placeholder="/path/to/folder"
              className="flex-1 bg-zinc-900 border-zinc-800"
            />
            <Button
              variant="outline"
              size="icon"
              disabled={loading}
              onPress={() => void loadPath(currentPath)}
              aria-label="Refresh path"
            >
              <IconRefresh className="size-4" />
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <ScrollArea className="h-72 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2">
            {loading ? (
              <div className="flex h-60 items-center justify-center">
                <Spinner className="size-6" />
              </div>
            ) : (
              <div className="space-y-1">
                {directories.map((dir) => (
                  <button
                    key={dir.path}
                    type="button"
                    onClick={() => {
                      setCurrentPath(dir.path)
                      void loadPath(dir.path)
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    <IconFolder className="size-4 shrink-0 text-amber-400" />
                    <span className="truncate">{dir.name || dir.path}</span>
                  </button>
                ))}

                {includeFiles &&
                  files.map((file) => (
                    <button
                      key={file.path}
                      type="button"
                      onClick={() => {
                        setCurrentPath(file.path)
                        onSelect(file.path)
                        onClose()
                      }}
                      className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                    >
                      <IconFile className="size-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}

                {directories.length === 0 && (!includeFiles || files.length === 0) && (
                  <p className="py-10 text-center text-xs text-zinc-500">
                    Empty directory
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onPress={onClose}>
            Cancel
          </Button>
          <Button
            onPress={() => {
              if (currentPath) {
                onSelect(currentPath)
                onClose()
              }
            }}
            disabled={!currentPath}
            className="gap-1.5"
          >
            <IconCheck className="size-4" />
            Select Path
          </Button>
        </DialogFooter>
    </Dialog>
  )
}
