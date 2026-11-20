"use client"

import React, { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCheck,
  IconFolderPlus,
  IconGripVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react"
import {
  RELIQUARY_MAX_SIDEBAR_DEPTH,
  removeNodeFromSidebarTree,
  updateNodeInSidebarTree,
  validateSidebarTreeDepth,
  type ReliquarySidebarNode,
} from "@NamelessLiberty/shared"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { DynamicIcon } from "@/components/iris-page/registry"
import { elysia } from "@/lib/elysia"
import { extractApiErrorMessage, type ReliquaryDocDetail } from "./reliquary-types"

function cloneTree(nodes: ReliquarySidebarNode[]): ReliquarySidebarNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }))
}

function generateClientNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function moveSiblingInTree(
  nodes: ReliquarySidebarNode[],
  nodeId: string,
  direction: -1 | 1
): ReliquarySidebarNode[] {
  const idx = nodes.findIndex((n) => n.id === nodeId)
  if (idx !== -1) {
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= nodes.length) return nodes
    const copy = [...nodes]
    const [item] = copy.splice(idx, 1)
    copy.splice(nextIdx, 0, item!)
    return copy
  }
  return nodes.map((n) =>
    n.children ? { ...n, children: moveSiblingInTree(n.children, nodeId, direction) } : n
  )
}

function indentNodeInTree(
  nodes: ReliquarySidebarNode[],
  nodeId: string
): ReliquarySidebarNode[] {
  const idx = nodes.findIndex((n) => n.id === nodeId)
  if (idx > 0) {
    const copy = cloneTree(nodes)
    const [moved] = copy.splice(idx, 1)
    const prevSibling = copy[idx - 1]!
    prevSibling.children = [...(prevSibling.children ?? []), moved!]
    return validateSidebarTreeDepth(copy, RELIQUARY_MAX_SIDEBAR_DEPTH).valid ? copy : nodes
  }
  return nodes.map((n) =>
    n.children ? { ...n, children: indentNodeInTree(n.children, nodeId) } : n
  )
}

function outdentNodeInTree(
  nodes: ReliquarySidebarNode[],
  nodeId: string
): ReliquarySidebarNode[] {
  for (let i = 0; i < nodes.length; i++) {
    const parent = nodes[i]!
    const children = parent.children ?? []
    const childIdx = children.findIndex((c) => c.id === nodeId)
    if (childIdx !== -1) {
      const copy = cloneTree(nodes)
      const targetParent = copy[i]!
      const [promoted] = targetParent.children!.splice(childIdx, 1)
      if (targetParent.children!.length === 0) {
        delete targetParent.children
      }
      copy.splice(i + 1, 0, promoted!)
      return copy
    }
    if (children.length > 0) {
      const updated = outdentNodeInTree(children, nodeId)
      if (updated !== children) {
        const copy = [...nodes]
        copy[i] = { ...parent, children: updated }
        return copy
      }
    }
  }
  return nodes
}

type DropPosition = "before" | "inside" | "after"

function findNodeInTree(
  nodes: ReliquarySidebarNode[],
  nodeId: string
): ReliquarySidebarNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node
    if (node.children) {
      const found = findNodeInTree(node.children, nodeId)
      if (found) return found
    }
  }
  return null
}

function isDescendantInTree(
  rootNode: ReliquarySidebarNode,
  targetId: string
): boolean {
  if (!rootNode.children) return false
  for (const child of rootNode.children) {
    if (child.id === targetId || isDescendantInTree(child, targetId)) {
      return true
    }
  }
  return false
}

function extractNodeFromTree(
  nodes: ReliquarySidebarNode[],
  nodeId: string
): { removed: ReliquarySidebarNode | null; remaining: ReliquarySidebarNode[] } {
  const remaining: ReliquarySidebarNode[] = []
  let removed: ReliquarySidebarNode | null = null

  for (const node of nodes) {
    if (node.id === nodeId) {
      removed = node
      continue
    }
    if (node.children && node.children.length > 0 && !removed) {
      const res = extractNodeFromTree(node.children, nodeId)
      if (res.removed) {
        removed = res.removed
        remaining.push(
          res.remaining.length > 0
            ? { ...node, children: res.remaining }
            : { ...node, children: undefined }
        )
        continue
      }
    }
    remaining.push(node)
  }

  return { removed, remaining }
}

function insertNodeRelativeInTree(
  nodes: ReliquarySidebarNode[],
  targetId: string,
  position: DropPosition,
  item: ReliquarySidebarNode
): { nodes: ReliquarySidebarNode[]; inserted: boolean } {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    if (node.id === targetId) {
      const copy = [...nodes]
      if (position === "before") {
        copy.splice(i, 0, item)
      } else if (position === "after") {
        copy.splice(i + 1, 0, item)
      } else {
        copy[i] = {
          ...node,
          children: [...(node.children ?? []), item],
        }
      }
      return { nodes: copy, inserted: true }
    }
    if (node.children && node.children.length > 0) {
      const res = insertNodeRelativeInTree(node.children, targetId, position, item)
      if (res.inserted) {
        const copy = [...nodes]
        copy[i] = { ...node, children: res.nodes }
        return { nodes: copy, inserted: true }
      }
    }
  }
  return { nodes, inserted: false }
}

function moveNodeByDragDrop(
  nodes: ReliquarySidebarNode[],
  sourceId: string,
  targetId: string,
  position: DropPosition
): { nodes: ReliquarySidebarNode[]; errorReason?: string } {
  if (sourceId === targetId) return { nodes }
  const sourceNode = findNodeInTree(nodes, sourceId)
  if (!sourceNode || isDescendantInTree(sourceNode, targetId)) {
    return { nodes }
  }

  const cloned = cloneTree(nodes)
  const { removed, remaining } = extractNodeFromTree(cloned, sourceId)
  if (!removed) return { nodes }

  const { nodes: nextTree, inserted } = insertNodeRelativeInTree(
    remaining,
    targetId,
    position,
    removed
  )
  if (!inserted) return { nodes }

  const depthCheck = validateSidebarTreeDepth(nextTree, RELIQUARY_MAX_SIDEBAR_DEPTH)
  if (!depthCheck.valid) {
    return { nodes, errorReason: depthCheck.reason }
  }
  return { nodes: nextTree }
}

export interface BookStructureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doc: ReliquaryDocDetail
  onDocUpdated: (nextDoc: ReliquaryDocDetail) => void
}

export function BookStructureDialog({
  open,
  onOpenChange,
  doc,
  onDocUpdated,
}: BookStructureDialogProps) {
  const t = useTranslations("reliquary.structureDialog")
  const tErr = useTranslations("reliquary.errors")
  const pathname = usePathname() || ""
  const router = useRouter()

  const [tree, setTree] = useState<ReliquarySidebarNode[]>([])
  const [newFolderName, setNewFolderName] = useState("")
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState("")
  const [confirmDeleteNode, setConfirmDeleteNode] = useState<ReliquarySidebarNode | null>(null)
  const [saving, setSaving] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{
    nodeId: string
    position: DropPosition
  } | null>(null)

  useEffect(() => {
    if (open) {
      setTree(cloneTree(doc.sidebarConfig))
      setEditingNodeId(null)
      setConfirmDeleteNode(null)
      setDraggedId(null)
      setDropTarget(null)
    }
  }, [open, doc.sidebarConfig])

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    setTree((prev) => [
      ...prev,
      {
        id: generateClientNodeId(),
        label: newFolderName.trim(),
        icon: "IconFolder",
        pageId: null,
      },
    ])
    setNewFolderName("")
  }

  const commitRename = () => {
    if (!editingNodeId || !editingLabel.trim()) {
      setEditingNodeId(null)
      return
    }
    setTree(
      (prev) =>
        updateNodeInSidebarTree(
          prev,
          (n) => n.id === editingNodeId,
          (n) => ({ ...n, label: editingLabel.trim() })
        ).nodes
    )
    setEditingNodeId(null)
  }

  const handleConfirmDelete = async () => {
    if (!confirmDeleteNode) return
    const target = confirmDeleteNode
    setConfirmDeleteNode(null)

    if (!target.pageId) {
      setTree((prev) => removeNodeFromSidebarTree(prev, target.id).nodes)
      return
    }

    setSaving(true)
    try {
      const res = await elysia.reliquary
        .docs({ docId: doc.id })
        .pages({ pageId: target.pageId })
        .delete()

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }

      if (res.data) {
        const nextTree = res.data.sidebarConfig as ReliquarySidebarNode[]
        setTree(cloneTree(nextTree))
        onDocUpdated({
          ...doc,
          sidebarConfig: nextTree,
          pageIds: res.data.pageIds,
        })
        if (pathname.endsWith(`/${target.pageId}`)) {
          router.push(`/reliquary/${doc.id}`)
        }
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    const check = validateSidebarTreeDepth(tree, RELIQUARY_MAX_SIDEBAR_DEPTH)
    if (!check.valid) {
      toast.error(check.reason || t("maxDepthNotice"))
      return
    }

    setSaving(true)
    try {
      const res = await elysia.reliquary
        .docs({ docId: doc.id })
        .sidebar.put({ sidebarConfig: tree })

      if (res.error) {
        toast.error(extractApiErrorMessage(res.error, tErr("saveFailed")))
        return
      }

      if (res.data?.doc) {
        onDocUpdated(res.data.doc as unknown as ReliquaryDocDetail)
        toast.success(t("savedToast"))
        onOpenChange(false)
      }
    } catch (err) {
      toast.error(extractApiErrorMessage(err, tErr("saveFailed")))
    } finally {
      setSaving(false)
    }
  }

  const handleDropOnNode = (
    e: React.DragEvent<HTMLDivElement>,
    targetId: string
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const sourceId = draggedId || e.dataTransfer.getData("text/plain")
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientY - rect.top) / Math.max(rect.height, 1)
    const position: DropPosition =
      dropTarget?.nodeId === targetId
        ? dropTarget.position
        : ratio < 0.28
          ? "before"
          : ratio > 0.72
            ? "after"
            : "inside"

    setDraggedId(null)
    setDropTarget(null)

    if (!sourceId || sourceId === targetId) return
    const result = moveNodeByDragDrop(tree, sourceId, targetId, position)
    if (result.errorReason) {
      toast.error(result.errorReason || t("maxDepthNotice"))
      return
    }
    setTree(result.nodes)
  }

  const renderNodes = (
    nodes: ReliquarySidebarNode[],
    depth = 1
  ): React.ReactNode => {
    return nodes.map((node, index) => {
      const isEditing = editingNodeId === node.id
      const isDragging = draggedId === node.id
      const activeDrop =
        dropTarget?.nodeId === node.id ? dropTarget.position : null

      return (
        <div key={node.id} className="space-y-1">
          <div
            draggable={!isEditing}
            onDragStart={(e) => {
              e.stopPropagation()
              setDraggedId(node.id)
              e.dataTransfer.effectAllowed = "move"
              e.dataTransfer.setData("text/plain", node.id)
            }}
            onDragOver={(e) => {
              if (!draggedId || draggedId === node.id) return
              e.preventDefault()
              e.stopPropagation()
              e.dataTransfer.dropEffect = "move"
              const rect = e.currentTarget.getBoundingClientRect()
              const ratio = (e.clientY - rect.top) / Math.max(rect.height, 1)
              const position: DropPosition =
                ratio < 0.28 ? "before" : ratio > 0.72 ? "after" : "inside"
              if (
                dropTarget?.nodeId !== node.id ||
                dropTarget.position !== position
              ) {
                setDropTarget({ nodeId: node.id, position })
              }
            }}
            onDragLeave={(e) => {
              if (
                dropTarget?.nodeId === node.id &&
                !e.currentTarget.contains(e.relatedTarget as Node | null)
              ) {
                setDropTarget(null)
              }
            }}
            onDrop={(e) => handleDropOnNode(e, node.id)}
            onDragEnd={() => {
              setDraggedId(null)
              setDropTarget(null)
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-2.5 py-1.5 transition-colors",
              !isEditing && "cursor-grab active:cursor-grabbing",
              isDragging && "opacity-45",
              activeDrop === "before" && "border-t-2 border-t-primary",
              activeDrop === "after" && "border-b-2 border-b-primary",
              activeDrop === "inside" && "border-primary bg-primary/10 ring-1 ring-primary"
            )}
          >
            <IconGripVertical
              className="size-3.5 shrink-0 text-muted-foreground/70"
              aria-hidden="true"
            />
            <span className="shrink-0 text-muted-foreground">
              <DynamicIcon
                name={node.icon || (node.pageId ? "IconFileText" : "IconFolder")}
                size={15}
              />
            </span>

            {isEditing ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Input
                  value={editingLabel}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingLabel(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      commitRename()
                    }
                  }}
                  className="h-7 text-xs"
                />
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  onPress={commitRename}
                >
                  <IconCheck className="size-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-xs font-medium text-foreground">
                  {node.label}
                </span>
                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                  L{depth}
                </Badge>
              </div>
            )}

            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={t("rename")}
                onPress={() => {
                  setEditingNodeId(node.id)
                  setEditingLabel(node.label)
                }}
              >
                <IconPencil className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={t("moveUp")}
                isDisabled={index === 0}
                onPress={() => setTree((prev) => moveSiblingInTree(prev, node.id, -1))}
              >
                <IconArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={t("moveDown")}
                isDisabled={index === nodes.length - 1}
                onPress={() => setTree((prev) => moveSiblingInTree(prev, node.id, 1))}
              >
                <IconArrowDown className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={t("outdent")}
                isDisabled={depth <= 1}
                onPress={() => setTree((prev) => outdentNodeInTree(prev, node.id))}
              >
                <IconArrowLeft className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={t("indent")}
                isDisabled={index === 0 || depth >= RELIQUARY_MAX_SIDEBAR_DEPTH}
                onPress={() => setTree((prev) => indentNodeInTree(prev, node.id))}
              >
                <IconArrowRight className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label={node.pageId ? t("deletePage") : t("deleteFolder")}
                onPress={() => setConfirmDeleteNode(node)}
                className="text-destructive hover:text-destructive"
              >
                <IconTrash className="size-3.5" />
              </Button>
            </div>
          </div>

          {node.children && node.children.length > 0 && (
            <div className="ms-5 space-y-1 border-s border-border/60 ps-3">
              {renderNodes(node.children, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{t("title")}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">{t("description")}</p>

        <form onSubmit={handleAddFolder} className="flex items-center gap-2">
          <Input
            value={newFolderName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewFolderName(e.target.value)
            }
            placeholder={t("folderPlaceholder")}
            className="h-8 text-xs"
          />
          <Button type="submit" size="sm" variant="outline" className="gap-1.5 shrink-0">
            <IconFolderPlus className="size-3.5" />
            <span>{t("addFolder")}</span>
          </Button>
        </form>

        {confirmDeleteNode && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
            <span className="font-medium text-foreground">
              {t("confirmDelete", { label: confirmDeleteNode.label })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onPress={() => setConfirmDeleteNode(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                isDisabled={saving}
                onPress={handleConfirmDelete}
              >
                {t("confirm")}
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-[45vh] space-y-1.5 overflow-y-auto pe-1">
          {renderNodes(tree, 1)}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onPress={() => onOpenChange(false)}>
          {t("cancel")}
        </Button>
        <Button type="button" isDisabled={saving} onPress={handleSave}>
          {t("save")}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
