"use client"

import * as React from "react"
import * as TablerIcons from "@tabler/icons-react"
import {
  IconChevronDown,
  IconChevronRight,
  IconClipboard,
  IconCopy,
  IconArrowUp,
  IconArrowDown,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconScissors,
  IconTrash,
  IconCheck,
} from "@tabler/icons-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { cn } from "@workspace/ui/lib/utils"
import { AlgoCodeView } from "./algo-code-input"
import { AlgoNodeEditor } from "./algo-node-editor"
import { formatVarDefCode } from "./nodes/var-def-node"
import {
  ALL_ALGO_KINDS,
  ALGO_KIND_META,
  generateAlgoId,
  type AlgoBranchKey,
  type AlgoNode,
  type AlgoNodeKind,
} from "./types"

interface AlgoNodeRendererProps {
  node: AlgoNode
  stepNumber: string
  mode: "render" | "edit"
  collapsedIds: Set<string>
  editingId: string | null
  index: number
  siblingCount: number
  hasClipboard?: boolean
  onToggleCollapse: (id: string) => void
  onToggleEdit: (id: string) => void
  onUpdateNode: (id: string, updated: AlgoNode) => void
  onDeleteNode: (id: string) => void
  onDuplicateNode: (id: string) => void
  onMoveNode: (id: string, dir: "up" | "down") => void
  onInsertSibling?: (targetId: string, position: "before" | "after", kind?: AlgoNodeKind) => void
  onCutNode?: (id: string) => void
  onPasteSibling?: (targetId: string, position: "before" | "after") => void
  onAddChild: (
    parentId: string,
    branchKey: AlgoBranchKey,
    kind: AlgoNodeKind,
    caseId?: string,
    selectionMode?: "if_else" | "switch"
  ) => void
}

function renderInlineFormattedText(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={idx}
          className="mx-0.5 rounded bg-rose-500/15 px-1.5 py-0.5 font-mono text-[11px] font-medium text-rose-700 dark:text-rose-300"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

function KindIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = (TablerIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    iconName
  ]
  if (!Icon) return null
  return <Icon className={className} />
}

interface BranchContainerProps {
  label: string
  hideLabel?: boolean
  badgeClass?: string
  nodes: AlgoNode[]
  parentId: string
  branchKey: AlgoBranchKey
  caseId?: string
  stepPrefix: string
  mode: "render" | "edit"
  collapsedIds: Set<string>
  editingId: string | null
  hasClipboard?: boolean
  onToggleCollapse: (id: string) => void
  onToggleEdit: (id: string) => void
  onUpdateNode: (id: string, updated: AlgoNode) => void
  onDeleteNode: (id: string) => void
  onDuplicateNode: (id: string) => void
  onMoveNode: (id: string, dir: "up" | "down") => void
  onInsertSibling?: (targetId: string, position: "before" | "after", kind?: AlgoNodeKind) => void
  onCutNode?: (id: string) => void
  onPasteSibling?: (targetId: string, position: "before" | "after") => void
  onAddChild: (
    parentId: string,
    branchKey: AlgoBranchKey,
    kind: AlgoNodeKind,
    caseId?: string,
    selectionMode?: "if_else" | "switch"
  ) => void
}

function AddStepInlineControl({
  onSelect,
}: {
  onSelect: (kind: AlgoNodeKind) => void
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative inline-block">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((prev) => !prev)}
      >
        <IconPlus className="me-1 size-3.5" />
        Add step
      </Button>
      {open && (
        <div className="absolute start-0 top-full z-20 mt-1 grid w-64 grid-cols-2 gap-1 rounded-xl border border-border bg-popover p-1.5 shadow-lg">
          {ALL_ALGO_KINDS.map((kind) => {
            const meta = ALGO_KIND_META[kind]
            return (
              <button
                key={kind}
                type="button"
                onClick={() => {
                  onSelect(kind)
                  setOpen(false)
                }}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-start text-xs hover:bg-muted"
              >
                <KindIcon iconName={meta.iconName} className="size-3.5 shrink-0 opacity-80" />
                <span className="truncate">{meta.shortLabel}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface AlgoPaletteOption {
  label: string
  kind: AlgoNodeKind
  selectionMode?: "if_else" | "switch"
  iconName: string
  badgeClass: string
}

const PALETTE_OPTIONS: AlgoPaletteOption[] = [
  { label: "Step", kind: "step", iconName: ALGO_KIND_META.step.iconName, badgeClass: ALGO_KIND_META.step.badgeClass },
  { label: "Sequence", kind: "sequence", iconName: ALGO_KIND_META.sequence.iconName, badgeClass: ALGO_KIND_META.sequence.badgeClass },
  { label: "Selection (If)", kind: "selection", selectionMode: "if_else", iconName: ALGO_KIND_META.selection.iconName, badgeClass: ALGO_KIND_META.selection.badgeClass },
  { label: "Selection (Switch)", kind: "selection", selectionMode: "switch", iconName: ALGO_KIND_META.selection.iconName, badgeClass: ALGO_KIND_META.selection.badgeClass },
  { label: "Iteration", kind: "iteration", iconName: ALGO_KIND_META.iteration.iconName, badgeClass: ALGO_KIND_META.iteration.badgeClass },
  { label: "Warning", kind: "warning", iconName: ALGO_KIND_META.warning.iconName, badgeClass: ALGO_KIND_META.warning.badgeClass },
  { label: "Error", kind: "error", iconName: ALGO_KIND_META.error.iconName, badgeClass: ALGO_KIND_META.error.badgeClass },
  { label: "Try-Catch-Finally", kind: "try_catch_finally", iconName: ALGO_KIND_META.try_catch_finally.iconName, badgeClass: ALGO_KIND_META.try_catch_finally.badgeClass },
  { label: "Variables definition", kind: "var_def", iconName: ALGO_KIND_META.var_def.iconName, badgeClass: ALGO_KIND_META.var_def.badgeClass },
  { label: "Algorithm call", kind: "alg_call", iconName: ALGO_KIND_META.alg_call.iconName, badgeClass: ALGO_KIND_META.alg_call.badgeClass },
  { label: "Return", kind: "return", iconName: ALGO_KIND_META.return.iconName, badgeClass: ALGO_KIND_META.return.badgeClass },
]

export function AlgoAddPalette({
  nextNumber,
  onAdd,
}: {
  nextNumber: string
  onAdd: (kind: AlgoNodeKind, selectionMode?: "if_else" | "switch") => void
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-border/80 bg-muted/20 p-2.5 text-start">
      <span className="pt-1 font-mono text-xs font-semibold text-muted-foreground">
        {nextNumber}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {PALETTE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onAdd(opt.kind, opt.selectionMode)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-opacity hover:opacity-85",
              opt.badgeClass
            )}
          >
            <KindIcon iconName={opt.iconName} className="size-3.5 shrink-0" />
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BranchContainer({
  label,
  hideLabel = false,
  badgeClass,
  nodes,
  parentId,
  branchKey,
  caseId,
  stepPrefix,
  mode,
  collapsedIds,
  editingId,
  hasClipboard,
  onToggleCollapse,
  onToggleEdit,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onMoveNode,
  onInsertSibling,
  onCutNode,
  onPasteSibling,
  onAddChild,
}: BranchContainerProps) {
  if (nodes.length === 0 && mode === "render") {
    return null
  }

  return (
    <div className="mt-2.5 space-y-2 border-s-2 border-border/70 ps-4 ms-2">
      {!hideLabel && (
        <div className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn("font-mono text-[11px]", badgeClass ?? "bg-muted/50 text-muted-foreground")}
          >
            {label}
          </Badge>
        </div>
      )}

      {nodes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
          Empty {label.toLowerCase()} block
        </div>
      ) : (
        <div className="space-y-2">
          {nodes.map((child, idx) => (
            <AlgoNodeRenderer
              key={child.id}
              node={child}
              stepNumber={`${stepPrefix}.${idx + 1}`}
              mode={mode}
              collapsedIds={collapsedIds}
              editingId={editingId}
              index={idx}
              siblingCount={nodes.length}
              hasClipboard={hasClipboard}
              onToggleCollapse={onToggleCollapse}
              onToggleEdit={onToggleEdit}
              onUpdateNode={onUpdateNode}
              onDeleteNode={onDeleteNode}
              onDuplicateNode={onDuplicateNode}
              onMoveNode={onMoveNode}
              onInsertSibling={onInsertSibling}
              onCutNode={onCutNode}
              onPasteSibling={onPasteSibling}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}

      {mode === "edit" && editingId === parentId && (
        <AlgoAddPalette
          nextNumber={`${stepPrefix}.${nodes.length + 1}.`}
          onAdd={(kind, selectionMode) =>
            onAddChild(parentId, branchKey, kind, caseId, selectionMode)
          }
        />
      )}
    </div>
  )
}

export function AlgoNodeRenderer({
  node,
  stepNumber,
  mode,
  collapsedIds,
  editingId,
  index,
  siblingCount,
  hasClipboard,
  onToggleCollapse,
  onToggleEdit,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onMoveNode,
  onInsertSibling,
  onCutNode,
  onPasteSibling,
  onAddChild,
}: AlgoNodeRendererProps) {
  const meta = ALGO_KIND_META[node.kind]
  const isCollapsed = collapsedIds.has(node.id)
  const isEditingThis = mode === "edit" && editingId === node.id
  const [copiedPayload, setCopiedPayload] = React.useState(false)
  const [showInsertPicker, setShowInsertPicker] = React.useState(false)

  const hasNestedContent =
    (node.children?.length ?? 0) > 0 ||
    (node.thenBranch?.length ?? 0) > 0 ||
    (node.elseIfBranches?.length ?? 0) > 0 ||
    (node.elseBranch?.length ?? 0) > 0 ||
    (node.tryBlock?.length ?? 0) > 0 ||
    (node.catchBlock?.length ?? 0) > 0 ||
    (node.finallyBlock?.length ?? 0) > 0 ||
    (node.cases?.length ?? 0) > 0 ||
    (mode === "edit" && meta.isContainer)

  const containerStyle = isEditingThis
    ? "border-primary/80 bg-primary/[0.04] ring-2 ring-primary/25 shadow-sm"
    : node.kind === "error"
      ? "border-rose-500/35 bg-rose-500/[0.04]"
      : node.kind === "warning"
        ? "border-amber-500/35 bg-amber-500/[0.04]"
        : "border-border/75 bg-card/70"

  const copyPayload = () => {
    if (!node.payload) return
    navigator.clipboard?.writeText(node.payload)
    setCopiedPayload(true)
    setTimeout(() => setCopiedPayload(false), 1500)
  }

  return (
    <div className={cn("rounded-xl border p-3 transition-colors", containerStyle)}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-start">
          {hasNestedContent && (
            <button
              type="button"
              onClick={() => onToggleCollapse(node.id)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={isCollapsed ? "Expand step" : "Collapse step"}
            >
              {isCollapsed ? (
                <IconChevronRight className="size-4" />
              ) : (
                <IconChevronDown className="size-4" />
              )}
            </button>
          )}

          <span className="font-mono text-xs font-semibold text-muted-foreground">
            {stepNumber}.
          </span>

          <Badge variant="outline" className={cn("gap-1 font-mono text-[11px]", meta.badgeClass)}>
            <KindIcon iconName={meta.iconName} className="size-3" />
            <span>
              {node.kind === "selection"
                ? node.selectionMode === "switch"
                  ? "Switch"
                  : "If"
                : meta.shortLabel}
            </span>
          </Badge>

          {node.kind === "error" && node.httpStatus && (
            <Badge variant="destructive" className="font-mono text-[11px]">
              HTTP {node.httpStatus}
            </Badge>
          )}

          {(node.kind === "selection" ? node.condition || node.title : node.title) && (
            <span className="text-sm font-semibold text-foreground">
              {renderInlineFormattedText(
                (node.kind === "selection" ? node.condition || node.title : node.title)!
              )}
            </span>
          )}

          {node.kind === "selection" && node.selectionMode !== "switch" && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 font-mono text-[11px] text-emerald-700 dark:text-emerald-300"
            >
              Then
            </Badge>
          )}
        </div>

        {mode === "edit" && (
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={index === 0}
              onClick={() => onMoveNode(node.id, "up")}
              aria-label="Move up"
            >
              <IconArrowUp className="size-3.5" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              disabled={index === siblingCount - 1}
              onClick={() => onMoveNode(node.id, "down")}
              aria-label="Move down"
            >
              <IconArrowDown className="size-3.5" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant={isEditingThis ? "secondary" : "ghost"}
              className="size-7"
              onClick={() => onToggleEdit(node.id)}
              aria-label="Edit step"
            >
              <IconPencil className="size-3.5" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant={showInsertPicker ? "secondary" : "ghost"}
              className="size-7"
              onClick={() => setShowInsertPicker((prev) => !prev)}
              aria-label={meta.isContainer ? "Insert inside" : "Insert after"}
            >
              <IconPlus className="size-3.5" />
            </Button>

            <DropdownMenuTrigger>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7"
                aria-label="Step actions"
              >
                <IconDotsVertical className="size-3.5" />
              </Button>
              <DropdownMenu
                placement="bottom end"
                onAction={(key) => {
                  const action = String(key)
                  if (action === "up") onMoveNode(node.id, "up")
                  else if (action === "down") onMoveNode(node.id, "down")
                  else if (action === "insert-before") onInsertSibling?.(node.id, "before")
                  else if (action === "insert-after") onInsertSibling?.(node.id, "after")
                  else if (action === "insert-inside") setShowInsertPicker(true)
                  else if (action === "paste-before") onPasteSibling?.(node.id, "before")
                  else if (action === "paste-after") onPasteSibling?.(node.id, "after")
                  else if (action === "change-type") {
                    if (!isEditingThis) onToggleEdit(node.id)
                  } else if (action === "duplicate") onDuplicateNode(node.id)
                  else if (action === "cut") onCutNode?.(node.id)
                  else if (action === "delete") onDeleteNode(node.id)
                }}
              >
                <DropdownMenuItem id="up" isDisabled={index === 0}>
                  <IconArrowUp className="size-4" />
                  <span>Move up</span>
                </DropdownMenuItem>
                <DropdownMenuItem id="down" isDisabled={index === siblingCount - 1}>
                  <IconArrowDown className="size-4" />
                  <span>Move down</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem id="insert-before">
                  <IconRowInsertTop className="size-4" />
                  <span>Insert before</span>
                </DropdownMenuItem>
                <DropdownMenuItem id="insert-after">
                  <IconRowInsertBottom className="size-4" />
                  <span>Insert after</span>
                </DropdownMenuItem>
                {meta.isContainer && (
                  <DropdownMenuItem id="insert-inside">
                    <IconPlus className="size-4" />
                    <span>Insert inside</span>
                  </DropdownMenuItem>
                )}
                {hasClipboard && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem id="paste-before">
                      <IconClipboard className="size-4" />
                      <span>Paste before</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem id="paste-after">
                      <IconClipboard className="size-4" />
                      <span>Paste after</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem id="change-type">
                  <IconRefresh className="size-4" />
                  <span>Change type</span>
                </DropdownMenuItem>
                <DropdownMenuItem id="duplicate">
                  <IconCopy className="size-4" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuItem id="cut">
                  <IconScissors className="size-4" />
                  <span>Cut</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem id="delete" variant="destructive">
                  <IconTrash className="size-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenu>
            </DropdownMenuTrigger>
          </div>
        )}
      </div>

      {/* Specialized Body Details */}
      <div className="mt-1.5 space-y-2 ps-7 text-start">
        {/* Var Definition (legacy fallback when payload is not set) */}
        {node.kind === "var_def" && !node.payload && (() => {
          const formatted = formatVarDefCode(node)
          if (!formatted) return null
          return (
            <AlgoCodeView
              code={formatted}
              language={node.payloadLanguage || "typescript"}
              showDiagnostics
            />
          )
        })()}

        {/* Algorithm Call */}
        {node.kind === "alg_call" && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 font-mono text-xs">
            {node.assignTo && (
              <>
                <span className="text-indigo-600 dark:text-indigo-400">{node.assignTo}</span>
                <span className="text-muted-foreground">=</span>
              </>
            )}
            {node.isAsync && <span className="text-sky-600 dark:text-sky-400">await</span>}
            <span className="font-semibold text-cyan-700 dark:text-cyan-300">
              {node.targetAlg || "algorithm"}
            </span>
            <span className="text-muted-foreground">({node.callArgs ?? ""})</span>
          </div>
        )}

        {/* Return */}
        {node.kind === "return" && (node.returnValue || node.returnType) && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 font-mono text-xs">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">return</span>
            {node.returnValue && <span className="text-foreground">{node.returnValue}</span>}
            {node.returnType && (
              <span className="ms-auto text-[11px] text-muted-foreground">→ {node.returnType}</span>
            )}
          </div>
        )}

        {/* Condition line for Iteration / Warning */}
        {node.condition && node.kind !== "selection" && node.kind !== "error" && (
          <div className="flex flex-wrap items-start gap-2 text-xs">
            <Badge
              variant="outline"
              className="border-sky-500/40 bg-sky-500/10 font-mono text-[11px] text-sky-700 dark:text-sky-300"
            >
              {node.kind === "iteration" ? node.loopType || "While" : "If"}
            </Badge>
            <span className="pt-0.5 text-foreground/90">
              {renderInlineFormattedText(node.condition)}
            </span>
          </div>
        )}

        {/* For-each iterator line */}
        {node.kind === "iteration" && (node.loopType === "for_each" || !node.loopType) && (
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span>for</span>
            <code className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-700 dark:text-violet-300">
              {node.iterator || "item"}
            </code>
            <span>in</span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
              {node.collection || "items"}
            </code>
          </div>
        )}

        {/* Error / Warning Code + Message */}
        {(node.kind === "error" || node.kind === "warning") && (
          <div className="space-y-1">
            {node.code && (
              <div>
                <code
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-xs font-semibold",
                    node.kind === "error"
                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  )}
                >
                  {node.code}
                </code>
              </div>
            )}
            {node.message && (
              <p className="text-xs text-foreground/90">{renderInlineFormattedText(node.message)}</p>
            )}
          </div>
        )}

        {/* Description */}
        {node.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {renderInlineFormattedText(node.description)}
          </p>
        )}

        {/* Payload Block */}
        {node.payload && node.kind !== "error" && (
          <AlgoCodeView
            code={node.payload}
            language={node.payloadLanguage || (node.kind === "var_def" ? "typescript" : "json")}
            showDiagnostics
          />
        )}

        {/* Inline Edit Form */}
        {isEditingThis && (
          <AlgoNodeEditor
            node={node}
            onChange={(updated) => onUpdateNode(node.id, updated)}
          />
        )}

        {/* Quick Insert Palette triggered by Header (+) */}
        {mode === "edit" && showInsertPicker && (
          <AlgoAddPalette
            nextNumber={meta.isContainer ? `${stepNumber}.+` : `${stepNumber} →`}
            onAdd={(kind, selectionMode) => {
              if (meta.isContainer) {
                const targetBranch: AlgoBranchKey =
                  node.kind === "selection"
                    ? "thenBranch"
                    : node.kind === "try_catch_finally"
                      ? "tryBlock"
                      : "children"
                onAddChild(node.id, targetBranch, kind, undefined, selectionMode)
              } else {
                onInsertSibling?.(node.id, "after", kind)
              }
              setShowInsertPicker(false)
            }}
          />
        )}

        {/* Nested Branches (when expanded) */}
        {!isCollapsed && (
          <>
            {(node.kind === "sequence" || node.kind === "iteration" || node.kind === "step") &&
              ((node.children?.length ?? 0) > 0 || (mode === "edit" && isEditingThis && node.kind !== "step")) && (
                <div className="mt-2.5 space-y-2 border-s-2 border-border/70 ps-4 ms-2">
                  {(node.children ?? []).map((child, idx) => (
                    <AlgoNodeRenderer
                      key={child.id}
                      node={child}
                      stepNumber={`${stepNumber}.${idx + 1}`}
                      mode={mode}
                      collapsedIds={collapsedIds}
                      editingId={editingId}
                      index={idx}
                      siblingCount={node.children?.length ?? 0}
                      hasClipboard={hasClipboard}
                      onToggleCollapse={onToggleCollapse}
                      onToggleEdit={onToggleEdit}
                      onUpdateNode={onUpdateNode}
                      onDeleteNode={onDeleteNode}
                      onDuplicateNode={onDuplicateNode}
                      onMoveNode={onMoveNode}
                      onInsertSibling={onInsertSibling}
                      onCutNode={onCutNode}
                      onPasteSibling={onPasteSibling}
                      onAddChild={onAddChild}
                    />
                  ))}
                  {mode === "edit" && isEditingThis && node.kind !== "step" && (
                    <AlgoAddPalette
                      nextNumber={`${stepNumber}.${(node.children?.length ?? 0) + 1}.`}
                      onAdd={(kind, selectionMode) =>
                        onAddChild(node.id, "children", kind, undefined, selectionMode)
                      }
                    />
                  )}
                </div>
              )}

            {node.kind === "selection" && node.selectionMode !== "switch" && (
              <>
                <BranchContainer
                  label="Then"
                  hideLabel
                  badgeClass="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  nodes={node.thenBranch ?? []}
                  parentId={node.id}
                  branchKey="thenBranch"
                  stepPrefix={stepNumber}
                  mode={mode}
                  collapsedIds={collapsedIds}
                  editingId={editingId}
                  hasClipboard={hasClipboard}
                  onToggleCollapse={onToggleCollapse}
                  onToggleEdit={onToggleEdit}
                  onUpdateNode={onUpdateNode}
                  onDeleteNode={onDeleteNode}
                  onDuplicateNode={onDuplicateNode}
                  onMoveNode={onMoveNode}
                  onInsertSibling={onInsertSibling}
                  onCutNode={onCutNode}
                  onPasteSibling={onPasteSibling}
                  onAddChild={onAddChild}
                />
                {(node.elseIfBranches ?? []).map((branch, bIdx) => (
                  <BranchContainer
                    key={branch.id}
                    label={`Else If: ${branch.condition}`}
                    badgeClass="border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    nodes={branch.children}
                    parentId={node.id}
                    branchKey="children"
                    caseId={branch.id}
                    stepPrefix={`${stepNumber}.elseif${bIdx + 1}`}
                    mode={mode}
                    collapsedIds={collapsedIds}
                    editingId={editingId}
                    hasClipboard={hasClipboard}
                    onToggleCollapse={onToggleCollapse}
                    onToggleEdit={onToggleEdit}
                    onUpdateNode={onUpdateNode}
                    onDeleteNode={onDeleteNode}
                    onDuplicateNode={onDuplicateNode}
                    onMoveNode={onMoveNode}
                    onInsertSibling={onInsertSibling}
                    onCutNode={onCutNode}
                    onPasteSibling={onPasteSibling}
                    onAddChild={onAddChild}
                  />
                ))}
                {((node.elseBranch?.length ?? 0) > 0 || node.elseBranch !== undefined) && (
                  <BranchContainer
                    label="Else"
                    badgeClass="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    nodes={node.elseBranch ?? []}
                    parentId={node.id}
                    branchKey="elseBranch"
                    stepPrefix={`${stepNumber}.else`}
                    mode={mode}
                    collapsedIds={collapsedIds}
                    editingId={editingId}
                    hasClipboard={hasClipboard}
                    onToggleCollapse={onToggleCollapse}
                    onToggleEdit={onToggleEdit}
                    onUpdateNode={onUpdateNode}
                    onDeleteNode={onDeleteNode}
                    onDuplicateNode={onDuplicateNode}
                    onMoveNode={onMoveNode}
                    onInsertSibling={onInsertSibling}
                    onCutNode={onCutNode}
                    onPasteSibling={onPasteSibling}
                    onAddChild={onAddChild}
                  />
                )}
                {mode === "edit" && isEditingThis && (
                  <div className="mt-2 flex items-center gap-2 border-s-2 border-border/70 ps-4 ms-2 text-xs">
                    <span className="font-mono font-semibold text-muted-foreground">
                      {stepNumber}.{(node.elseIfBranches?.length ?? 0) + 2}.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateNode(node.id, {
                          ...node,
                          elseIfBranches: [
                            ...(node.elseIfBranches ?? []),
                            {
                              id: generateAlgoId("elseif"),
                              condition: "condition",
                              children: [],
                            },
                          ],
                        })
                      }
                      className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-1 font-medium text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
                    >
                      Else If
                    </button>
                    {node.elseBranch === undefined && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNode(node.id, {
                            ...node,
                            elseBranch: [],
                          })
                        }
                        className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
                      >
                        Else
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {node.kind === "selection" && node.selectionMode === "switch" && (
              <>
                {(node.cases ?? []).map((c, cIdx) => (
                  <BranchContainer
                    key={c.id}
                    label={`Case: ${c.label}`}
                    badgeClass="border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    nodes={c.children}
                    parentId={node.id}
                    branchKey="children"
                    caseId={c.id}
                    stepPrefix={`${stepNumber}.${cIdx + 1}`}
                    mode={mode}
                    collapsedIds={collapsedIds}
                    editingId={editingId}
                    hasClipboard={hasClipboard}
                    onToggleCollapse={onToggleCollapse}
                    onToggleEdit={onToggleEdit}
                    onUpdateNode={onUpdateNode}
                    onDeleteNode={onDeleteNode}
                    onDuplicateNode={onDuplicateNode}
                    onMoveNode={onMoveNode}
                    onInsertSibling={onInsertSibling}
                    onCutNode={onCutNode}
                    onPasteSibling={onPasteSibling}
                    onAddChild={onAddChild}
                  />
                ))}
              </>
            )}

            {node.kind === "try_catch_finally" && (
              <>
                <BranchContainer
                  label="Try"
                  badgeClass="border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  nodes={node.tryBlock ?? []}
                  parentId={node.id}
                  branchKey="tryBlock"
                  stepPrefix={`${stepNumber}.try`}
                  mode={mode}
                  collapsedIds={collapsedIds}
                  editingId={editingId}
                  hasClipboard={hasClipboard}
                  onToggleCollapse={onToggleCollapse}
                  onToggleEdit={onToggleEdit}
                  onUpdateNode={onUpdateNode}
                  onDeleteNode={onDeleteNode}
                  onDuplicateNode={onDuplicateNode}
                  onMoveNode={onMoveNode}
                  onInsertSibling={onInsertSibling}
                  onCutNode={onCutNode}
                  onPasteSibling={onPasteSibling}
                  onAddChild={onAddChild}
                />
                <BranchContainer
                  label={`Catch (${node.catchVar || "err"})`}
                  badgeClass="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  nodes={node.catchBlock ?? []}
                  parentId={node.id}
                  branchKey="catchBlock"
                  stepPrefix={`${stepNumber}.catch`}
                  mode={mode}
                  collapsedIds={collapsedIds}
                  editingId={editingId}
                  hasClipboard={hasClipboard}
                  onToggleCollapse={onToggleCollapse}
                  onToggleEdit={onToggleEdit}
                  onUpdateNode={onUpdateNode}
                  onDeleteNode={onDeleteNode}
                  onDuplicateNode={onDuplicateNode}
                  onMoveNode={onMoveNode}
                  onInsertSibling={onInsertSibling}
                  onCutNode={onCutNode}
                  onPasteSibling={onPasteSibling}
                  onAddChild={onAddChild}
                />
                <BranchContainer
                  label="Finally"
                  badgeClass="border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300"
                  nodes={node.finallyBlock ?? []}
                  parentId={node.id}
                  branchKey="finallyBlock"
                  stepPrefix={`${stepNumber}.finally`}
                  mode={mode}
                  collapsedIds={collapsedIds}
                  editingId={editingId}
                  hasClipboard={hasClipboard}
                  onToggleCollapse={onToggleCollapse}
                  onToggleEdit={onToggleEdit}
                  onUpdateNode={onUpdateNode}
                  onDeleteNode={onDeleteNode}
                  onDuplicateNode={onDuplicateNode}
                  onMoveNode={onMoveNode}
                  onInsertSibling={onInsertSibling}
                  onCutNode={onCutNode}
                  onPasteSibling={onPasteSibling}
                  onAddChild={onAddChild}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
