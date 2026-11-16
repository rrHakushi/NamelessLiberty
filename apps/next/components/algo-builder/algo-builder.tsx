"use client"

import * as React from "react"
import * as TablerIcons from "@tabler/icons-react"
import {
  IconArrowBackUp,
  IconCheck,
  IconCode,
  IconCopy,
  IconPencil,
} from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { AlgoAddPalette, AlgoNodeRenderer } from "./algo-node-renderer"
import {
  cloneWithNewIds,
  collectAllNodeIds,
  deleteNodeFromTree,
  duplicateNodeInTree,
  findNodeInTree,
  insertChildInTree,
  insertSiblingInTree,
  moveNodeInTree,
  updateNodeInTree,
} from "./algo-tree-utils"
import {
  ALL_ALGO_KINDS,
  ALGO_KIND_META,
  createDefaultAlgoNode,
  type AlgoBranchKey,
  type AlgoDocument,
  type AlgoNode,
  type AlgoNodeKind,
} from "./types"

export interface AlgoBuilderProps {
  /** Controlled algorithm document */
  value?: AlgoDocument
  /** Uncontrolled initial algorithm document */
  defaultValue?: AlgoDocument
  /** Callback when the algorithm document changes */
  onChange?: (doc: AlgoDocument) => void
  /** Initial / forced mode */
  mode?: "render" | "edit"
  /** Allow switching between render and edit mode in the toolbar (default: true) */
  allowModeToggle?: boolean
  /** Optional container className */
  className?: string
}

const EMPTY_DOC: AlgoDocument = {
  title: "Algorithm Specification",
  description: "Step-by-step execution flow",
  steps: [],
}

function KindIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = (TablerIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    iconName
  ]
  if (!Icon) return null
  return <Icon className={className} />
}

export function AlgoBuilder({
  value,
  defaultValue,
  onChange,
  mode: propMode,
  allowModeToggle = true,
  className,
}: AlgoBuilderProps) {
  const isControlled = value !== undefined
  const [internalDoc, setInternalDoc] = React.useState<AlgoDocument>(defaultValue ?? EMPTY_DOC)
  const doc = isControlled ? value : internalDoc

  const [internalMode, setInternalMode] = React.useState<"render" | "edit">(propMode ?? "render")
  React.useEffect(() => {
    if (propMode !== undefined) setInternalMode(propMode)
  }, [propMode])

  const activeMode = allowModeToggle ? internalMode : (propMode ?? internalMode)

  const [history, setHistory] = React.useState<AlgoDocument[]>([])
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(() => new Set())
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [clipboardNode, setClipboardNode] = React.useState<AlgoNode | null>(null)
  const [showJsonPanel, setShowJsonPanel] = React.useState(false)
  const [jsonDraft, setJsonDraft] = React.useState("")
  const [jsonError, setJsonError] = React.useState<string | null>(null)
  const [copiedJson, setCopiedJson] = React.useState(false)

  const commitDoc = React.useCallback(
    (next: AlgoDocument) => {
      setHistory((prev) => [...prev.slice(-24), doc])
      if (!isControlled) {
        setInternalDoc(next)
      }
      onChange?.(next)
    },
    [doc, isControlled, onChange]
  )

  const handleUndo = () => {
    const prev = history[history.length - 1]
    if (!prev) return
    setHistory((h) => h.slice(0, -1))
    if (!isControlled) setInternalDoc(prev)
    onChange?.(prev)
  }

  const updateSteps = (steps: AlgoNode[]) => commitDoc({ ...doc, steps })

  const handleToggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExpandAll = () => setCollapsedIds(new Set())
  const handleCollapseAll = () => setCollapsedIds(new Set(collectAllNodeIds(doc.steps)))

  const handleAddRootStep = (kind: AlgoNodeKind, selectionMode?: "if_else" | "switch") => {
    const node = createDefaultAlgoNode(kind)
    if (kind === "selection" && selectionMode) {
      node.selectionMode = selectionMode
      if (selectionMode === "switch") {
        node.cases = [{ id: `${node.id}_c1`, label: "case A", children: [] }]
      }
    }
    updateSteps([...doc.steps, node])
    setEditingId(node.id)
  }

  const handleAddChild = (
    parentId: string,
    branchKey: AlgoBranchKey,
    kind: AlgoNodeKind,
    caseId?: string,
    selectionMode?: "if_else" | "switch"
  ) => {
    const node = createDefaultAlgoNode(kind)
    if (kind === "selection" && selectionMode) {
      node.selectionMode = selectionMode
      if (selectionMode === "switch") {
        node.cases = [{ id: `${node.id}_c1`, label: "case A", children: [] }]
      }
    }
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      next.delete(parentId)
      return next
    })
    updateSteps(insertChildInTree(doc.steps, parentId, branchKey, node, caseId))
    setEditingId(node.id)
  }

  const handleInsertSibling = (
    targetId: string,
    position: "before" | "after",
    kind: AlgoNodeKind = "step"
  ) => {
    const node = createDefaultAlgoNode(kind)
    updateSteps(insertSiblingInTree(doc.steps, targetId, position, node))
    setEditingId(node.id)
  }

  const handleCutNode = (id: string) => {
    const found = findNodeInTree(doc.steps, id)
    if (!found) return
    setClipboardNode(cloneWithNewIds(found))
    if (editingId === id) setEditingId(null)
    updateSteps(deleteNodeFromTree(doc.steps, id))
  }

  const handlePasteSibling = (targetId: string, position: "before" | "after") => {
    if (!clipboardNode) return
    const cloned = cloneWithNewIds(clipboardNode)
    updateSteps(insertSiblingInTree(doc.steps, targetId, position, cloned))
    setEditingId(cloned.id)
  }

  const handleOpenJson = () => {
    if (!showJsonPanel) {
      setJsonDraft(JSON.stringify(doc, null, 2))
      setJsonError(null)
    }
    setShowJsonPanel((prev) => !prev)
  }

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as AlgoDocument
      if (!parsed || !Array.isArray(parsed.steps)) {
        setJsonError('JSON must be an object with a "steps" array.')
        return
      }
      setJsonError(null)
      commitDoc(parsed)
      setShowJsonPanel(false)
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }

  const handleCopyJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(doc, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 1500)
  }

  return (
    <Card className={cn("rounded-2xl", className)}>
      <CardHeader className="space-y-3 border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1 text-start">
            {activeMode === "edit" ? (
              <div className="space-y-2">
                <Input
                  value={doc.title ?? ""}
                  onChange={(e) => commitDoc({ ...doc, title: e.target.value })}
                  placeholder="Algorithm title..."
                  className="h-9 text-base font-semibold"
                />
                <Input
                  value={doc.description ?? ""}
                  onChange={(e) => commitDoc({ ...doc, description: e.target.value })}
                  placeholder="Brief algorithm description..."
                  className="h-8 text-xs text-muted-foreground"
                />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg text-start">
                    {doc.title || "Algorithm Specification"}
                  </CardTitle>
                </div>
                {doc.description && (
                  <CardDescription className="text-start">{doc.description}</CardDescription>
                )}
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {activeMode === "edit" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs"
                disabled={history.length === 0}
                onClick={handleUndo}
                aria-label="Undo"
              >
                <IconArrowBackUp className="me-1 size-3.5" />
                Undo
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant={showJsonPanel ? "secondary" : "outline"}
              className="h-8 px-2.5 text-xs"
              onClick={handleOpenJson}
            >
              <IconCode className="me-1 size-3.5" />
              JSON
            </Button>

            {allowModeToggle && (
              <Button
                type="button"
                size="sm"
                variant={activeMode === "edit" ? "default" : "outline"}
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  if (activeMode === "edit") {
                    setInternalMode("render")
                    setEditingId(null)
                  } else {
                    setInternalMode("edit")
                  }
                }}
              >
                {activeMode === "edit" ? (
                  <>
                    <IconCheck className="me-1 size-3.5" />
                    Done
                  </>
                ) : (
                  <>
                    <IconPencil className="me-1 size-3.5" />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* JSON Import / Export Panel */}
        {showJsonPanel && (
          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3 text-start">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-foreground">
                AlgoDocument JSON
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={handleCopyJson}
                >
                  {copiedJson ? (
                    <IconCheck className="me-1 size-3.5" />
                  ) : (
                    <IconCopy className="me-1 size-3.5" />
                  )}
                  {copiedJson ? "Copied" : "Copy"}
                </Button>
                {activeMode === "edit" && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={handleApplyJson}
                  >
                    Apply JSON
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={activeMode === "edit" ? jsonDraft : JSON.stringify(doc, null, 2)}
              onChange={(e) => setJsonDraft(e.target.value)}
              readOnly={activeMode !== "edit"}
              rows={10}
              className="font-mono text-xs"
            />
            {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2.5 pt-5">
        {doc.steps.length === 0 && activeMode === "render" ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No algorithm steps defined.
          </div>
        ) : (
          <>
            {doc.steps.map((step, idx) => (
              <AlgoNodeRenderer
                key={step.id}
                node={step}
                stepNumber={`${idx + 1}`}
                mode={activeMode}
                collapsedIds={collapsedIds}
                editingId={editingId}
                index={idx}
                siblingCount={doc.steps.length}
                hasClipboard={clipboardNode !== null}
                onToggleCollapse={handleToggleCollapse}
                onToggleEdit={(id) => setEditingId((prev) => (prev === id ? null : id))}
                onUpdateNode={(id, updated) =>
                  updateSteps(updateNodeInTree(doc.steps, id, () => updated))
                }
                onDeleteNode={(id) => {
                  if (editingId === id) setEditingId(null)
                  updateSteps(deleteNodeFromTree(doc.steps, id))
                }}
                onDuplicateNode={(id) => updateSteps(duplicateNodeInTree(doc.steps, id))}
                onMoveNode={(id, dir) => updateSteps(moveNodeInTree(doc.steps, id, dir))}
                onInsertSibling={handleInsertSibling}
                onCutNode={handleCutNode}
                onPasteSibling={handlePasteSibling}
                onAddChild={handleAddChild}
              />
            ))}
            {activeMode === "edit" && (
              <AlgoAddPalette
                nextNumber={`${doc.steps.length + 1}.`}
                onAdd={handleAddRootStep}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
