"use client"

import * as React from "react"
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowsMaximize,
  IconBoxPadding,
  IconCheck,
  IconCode,
  IconCopy,
  IconDeviceDesktop,
  IconDeviceFloppy,
  IconDeviceMobile,
  IconDeviceTablet,
  IconDownload,
  IconEye,
  IconLayoutDashboard,
  IconLayoutSidebarRight,
  IconLoader2,
  IconPlus,
  IconTemplate,
  IconUpload,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  IrisPage,
  type IrisNode,
  type IrisPageSchema,
} from "@/components/iris-page"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import type { BuilderMode, NodePath, ViewportMode } from "./types"
import { BUILDER_TEMPLATES } from "./templates"
import { Canvas } from "./canvas"
import { PropertiesPanel } from "./properties-panel"
import { NodePropertiesModal } from "./node-properties-modal"
import { type InspectorTab } from "./node-inspector"
import { ComponentPickerModal } from "./component-picker-modal"
import {
  createSectionPreset,
  deleteNodeByPath,
  duplicateNodeByPath,
  getNodeByPath,
  getNodeParentPath,
  insertChildNode,
  insertNodeAdjacent,
  moveNodeByPath,
  type SectionPresetType,
  updateNodeByPath,
  updateNodeTextSafely,
} from "./ast-utils"

const DRAFT_STORAGE_KEY = "iris_page_builder_draft"

export interface PageBuilderProps {
  initialSchema?: IrisPageSchema
  onExit?: () => void
  onSave?: (schema: IrisPageSchema) => void | boolean | Promise<void | boolean>
  embedded?: boolean
}

function getSafeRoot(schema: IrisPageSchema): IrisNode {
  return schema.root || { type: "div", children: [] }
}

function clampValidPath(root: IrisNode, path: NodePath): NodePath {
  let candidate = [...path]
  while (candidate.length > 0 && !getNodeByPath(root, candidate)) {
    candidate = candidate.slice(0, -1)
  }
  return candidate
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  )
}

export function PageBuilder({
  initialSchema,
  onExit,
  onSave,
  embedded = false,
}: PageBuilderProps = {}) {
  // 1. Schema & History State
  const [schema, setSchema] = React.useState<IrisPageSchema>(() => {
    if (initialSchema) return initialSchema
    if (typeof window !== "undefined") {
      try {
        const editSession = sessionStorage.getItem("iris_page_builder_edit")
        if (editSession) {
          sessionStorage.removeItem("iris_page_builder_edit")
          return JSON.parse(editSession)
        }
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (saved) return JSON.parse(saved)
      } catch {
        // ignore storage read errors
      }
    }
    return BUILDER_TEMPLATES[0]!.schema
  })

  const schemaRef = React.useRef(schema)
  schemaRef.current = schema

  // Undo / Redo history stacks
  const [past, setPast] = React.useState<IrisPageSchema[]>([])
  const [future, setFuture] = React.useState<IrisPageSchema[]>([])
  const historyMetaRef = React.useRef<{
    coalesceKey?: string
    timestamp: number
  }>({ timestamp: 0 })

  // Track saved snapshot for dirty indicator & unsaved exit prompt
  const [lastSavedJson, setLastSavedJson] = React.useState(() => {
    try {
      return JSON.stringify(schema)
    } catch {
      return ""
    }
  })

  // Selection & UI Mode State
  const [selectedPath, setSelectedPath] = React.useState<NodePath>([])
  const [mode, setMode] = React.useState<BuilderMode>("visual")
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop")
  const [wireframeMode, setWireframeMode] = React.useState<boolean>(true)
  const [isInspectorOpen, setIsInspectorOpen] = React.useState<boolean>(true)
  const [inspectorTab, setInspectorTab] =
    React.useState<InspectorTab>("content")
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] =
    React.useState(false)

  const [pickerTarget, setPickerTarget] = React.useState<{
    path: NodePath
    position: "inside" | "above" | "below"
  } | null>(null)

  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
  const [importJsonText, setImportJsonText] = React.useState("")
  const [importError, setImportError] = React.useState<string | null>(null)
  const [isExitConfirmOpen, setIsExitConfirmOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const [codeJsonText, setCodeJsonText] = React.useState(() =>
    JSON.stringify(schema, null, 2)
  )
  const [codeError, setCodeError] = React.useState<string | null>(null)
  const lastCommittedCodeRef = React.useRef<string>(
    JSON.stringify(schema, null, 2)
  )
  const prevModeRef = React.useRef<BuilderMode>(mode)

  const isDirty = React.useMemo(() => {
    try {
      return JSON.stringify(schema) !== lastSavedJson
    } catch {
      return true
    }
  }, [schema, lastSavedJson])

  // Auto-save standalone draft to localStorage
  React.useEffect(() => {
    if (initialSchema) return
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(schema))
    } catch {
      // ignore storage write errors
    }
  }, [schema, initialSchema])

  // Sync code JSON text only when entering Code mode or when schema changes outside the code editor
  React.useEffect(() => {
    const formatted = JSON.stringify(schema, null, 2)
    const enteredCodeMode =
      mode === "code" && prevModeRef.current !== "code"
    const changedExternally =
      mode === "code" && formatted !== lastCommittedCodeRef.current

    if (enteredCodeMode || changedExternally) {
      setCodeJsonText(formatted)
      setCodeError(null)
      lastCommittedCodeRef.current = formatted
    }

    if (prevModeRef.current === "code" && mode !== "code" && codeError) {
      toast.warning(
        "JSON Code contained syntax errors; last valid schema was preserved."
      )
      setCodeError(null)
    }

    prevModeRef.current = mode
  }, [mode, schema, codeError])

  /**
   * Commit a new schema with strict-mode-safe undo/redo history and optional typing coalescing.
   */
  const commitSchema = React.useCallback(
    (
      nextSchema: IrisPageSchema | ((prev: IrisPageSchema) => IrisPageSchema),
      options?: { nextSelectedPath?: NodePath; coalesceKey?: string }
    ) => {
      const current = schemaRef.current
      const resolved =
        typeof nextSchema === "function" ? nextSchema(current) : nextSchema
      if (resolved === current) {
        if (options?.nextSelectedPath !== undefined) {
          setSelectedPath(options.nextSelectedPath)
        }
        return
      }

      const now = Date.now()
      const shouldCoalesce =
        Boolean(options?.coalesceKey) &&
        options?.coalesceKey === historyMetaRef.current.coalesceKey &&
        now - historyMetaRef.current.timestamp < 900

      schemaRef.current = resolved
      setSchema(resolved)
      if (!shouldCoalesce) {
        setPast((p) => [...p.slice(-29), current])
      }
      setFuture([])
      historyMetaRef.current = {
        coalesceKey: options?.coalesceKey,
        timestamp: now,
      }

      if (options?.nextSelectedPath !== undefined) {
        setSelectedPath(options.nextSelectedPath)
      }
    },
    []
  )

  const handleUndo = React.useCallback(() => {
    if (past.length === 0) return
    const previous = past[past.length - 1]
    if (!previous) return

    const current = schemaRef.current
    schemaRef.current = previous
    setPast((p) => p.slice(0, -1))
    setFuture((f) => [current, ...f.slice(0, 29)])
    setSchema(previous)
    historyMetaRef.current = { timestamp: 0 }
    setSelectedPath((prevPath) => clampValidPath(getSafeRoot(previous), prevPath))
    toast.info("Undone")
  }, [past])

  const handleRedo = React.useCallback(() => {
    if (future.length === 0) return
    const next = future[0]
    if (!next) return

    const current = schemaRef.current
    schemaRef.current = next
    setFuture((f) => f.slice(1))
    setPast((p) => [...p.slice(-29), current])
    setSchema(next)
    historyMetaRef.current = { timestamp: 0 }
    setSelectedPath((prevPath) => clampValidPath(getSafeRoot(next), prevPath))
    toast.info("Redone")
  }, [future])

  const handleInsertChild = React.useCallback(
    (parentPath: NodePath, newNode?: IrisNode) => {
      if (!newNode) {
        setPickerTarget({ path: parentPath, position: "inside" })
        return
      }
      const current = schemaRef.current
      const { newRoot, newPath } = insertChildNode(
        getSafeRoot(current),
        parentPath,
        newNode
      )
      commitSchema({ ...current, root: newRoot }, { nextSelectedPath: newPath })
      toast.success(`Added <${newNode.type}>`)
    },
    [commitSchema]
  )

  const handleInsertAdjacent = React.useCallback(
    (targetPath: NodePath, position: "above" | "below", newNode?: IrisNode) => {
      if (!newNode) {
        setPickerTarget({ path: targetPath, position })
        return
      }
      const current = schemaRef.current
      const { newRoot, newPath } = insertNodeAdjacent(
        getSafeRoot(current),
        targetPath,
        position,
        newNode
      )
      commitSchema({ ...current, root: newRoot }, { nextSelectedPath: newPath })
      toast.success(`Inserted <${newNode.type}> ${position}`)
    },
    [commitSchema]
  )

  const handleAddSection = React.useCallback(
    (type: SectionPresetType = "3-col") => {
      const sectionNode = createSectionPreset(type)
      const current = schemaRef.current
      const { newRoot, newPath } = insertChildNode(
        getSafeRoot(current),
        [],
        sectionNode
      )
      commitSchema({ ...current, root: newRoot }, { nextSelectedPath: newPath })
      toast.success(`Added ${type} section`)
    },
    [commitSchema]
  )

  const handleSelectPickerComponent = React.useCallback(
    (newNode: IrisNode) => {
      if (!pickerTarget) return
      if (pickerTarget.position === "inside") {
        handleInsertChild(pickerTarget.path, newNode)
      } else {
        handleInsertAdjacent(pickerTarget.path, pickerTarget.position, newNode)
      }
      setPickerTarget(null)
    },
    [pickerTarget, handleInsertChild, handleInsertAdjacent]
  )

  const handleUpdateNode = React.useCallback(
    (path: NodePath, updater: (node: IrisNode) => IrisNode) => {
      commitSchema(
        (prev) => ({
          ...prev,
          root: updateNodeByPath(getSafeRoot(prev), path, updater),
        }),
        { coalesceKey: `node:${path.join(".")}` }
      )
    },
    [commitSchema]
  )

  const handleUpdateNodeText = React.useCallback(
    (path: NodePath, nextText: string) => {
      handleUpdateNode(path, (node) => updateNodeTextSafely(node, nextText))
    },
    [handleUpdateNode]
  )

  const handleUpdateMeta = React.useCallback(
    (updater: (prev: IrisPageSchema) => IrisPageSchema) => {
      commitSchema(updater, { coalesceKey: "meta" })
    },
    [commitSchema]
  )

  const handleDeleteNode = React.useCallback(
    (path: NodePath) => {
      if (path.length === 0) return
      const current = schemaRef.current
      const { newRoot, newPath } = deleteNodeByPath(getSafeRoot(current), path)
      commitSchema({ ...current, root: newRoot }, { nextSelectedPath: newPath })
      toast.info("Node removed")
    },
    [commitSchema]
  )

  const handleDuplicateNode = React.useCallback(
    (path: NodePath) => {
      if (path.length === 0) return
      const current = schemaRef.current
      const { newRoot, newPath } = duplicateNodeByPath(
        getSafeRoot(current),
        path
      )
      commitSchema({ ...current, root: newRoot }, { nextSelectedPath: newPath })
      toast.success("Node duplicated")
    },
    [commitSchema]
  )

  const handleMoveNode = React.useCallback(
    (path: NodePath, direction: "up" | "down") => {
      const current = schemaRef.current
      const { newRoot, newPath } = moveNodeByPath(
        getSafeRoot(current),
        path,
        direction
      )
      commitSchema({ ...current, root: newRoot }, { nextSelectedPath: newPath })
    },
    [commitSchema]
  )

  const isRootFullWidth = React.useMemo(() => {
    const cls = String(schema.root?.props?.className || "")
    return !cls.includes("max-w-") && !cls.includes("mx-auto")
  }, [schema.root])

  const handleToggleFullWidth = React.useCallback(() => {
    const current = schemaRef.current
    const currentCls = String(current.root?.props?.className || "")
    const isClamped =
      currentCls.includes("max-w-") || currentCls.includes("mx-auto")
    let newCls = currentCls
    if (isClamped) {
      newCls = currentCls
        .replace(/\bmax-w-\S+\b/g, "")
        .replace(/\bmx-auto\b/g, "")
        .replace(/\s+/g, " ")
        .trim()
      if (!newCls.includes("w-full")) newCls = `w-full ${newCls}`.trim()
      toast.success("Document stretched to full width")
    } else {
      newCls = `max-w-7xl mx-auto ${newCls}`.replace(/\s+/g, " ").trim()
      toast.info("Document constrained to max-w-7xl")
    }
    commitSchema({
      ...current,
      root: {
        ...getSafeRoot(current),
        props: { ...(current.root?.props || {}), className: newCls },
      },
    })
  }, [commitSchema])

  const handleLoadTemplate = (templateId: string) => {
    const tpl = BUILDER_TEMPLATES.find((t) => t.id === templateId)
    if (!tpl) return
    const freshSchema = JSON.parse(JSON.stringify(tpl.schema)) as IrisPageSchema
    commitSchema(freshSchema, { nextSelectedPath: [] })
    toast.success(`Loaded "${tpl.name}" template`)
  }

  const handleCopyJson = async () => {
    try {
      const json = JSON.stringify(schema, null, 2)
      await navigator.clipboard.writeText(json)
      toast.success("Document schema copied to clipboard")
    } catch {
      toast.error("Unable to access clipboard")
    }
  }

  const handleDownloadJson = () => {
    const json = JSON.stringify(schema, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${(schema.title || "document").toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded document schema JSON")
  }

  const handleApplyImport = () => {
    try {
      const parsed = JSON.parse(importJsonText)
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !parsed.root ||
        typeof parsed.root !== "object" ||
        typeof parsed.root.type !== "string"
      ) {
        throw new Error(
          "Schema must be a JSON object with a valid 'root' node containing a 'type'."
        )
      }
      commitSchema(parsed as IrisPageSchema, { nextSelectedPath: [] })
      setIsImportModalOpen(false)
      setImportJsonText("")
      setImportError(null)
      toast.success("Document schema imported")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid JSON syntax"
      setImportError(message)
      toast.error(`Import failed: ${message}`)
    }
  }

  const handleCodeJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setCodeJsonText(text)
    try {
      const parsed = JSON.parse(text)
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !parsed.root ||
        typeof parsed.root !== "object" ||
        typeof parsed.root.type !== "string"
      ) {
        setCodeError(
          "Schema must be an object containing a valid 'root' node with a string 'type'."
        )
        return
      }
      setCodeError(null)
      lastCommittedCodeRef.current = JSON.stringify(parsed, null, 2)
      commitSchema(parsed as IrisPageSchema, { coalesceKey: "code-editor" })
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }

  const handleSave = React.useCallback(async () => {
    if (!onSave || isSaving) return false
    if (mode === "code" && codeError) {
      toast.error("Fix JSON syntax errors before saving")
      return false
    }
    setIsSaving(true)
    try {
      const result = await onSave(schemaRef.current)
      if (result === false) {
        return false
      }
      setLastSavedJson(JSON.stringify(schemaRef.current))
      toast.success("Document saved successfully")
      return true
    } catch (err) {
      console.error("[PageBuilder] Save failed:", err)
      toast.error("Failed to save document")
      return false
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving, mode, codeError])

  const handleRequestExit = React.useCallback(() => {
    if (!onExit) return
    if (onSave && isDirty) {
      setIsExitConfirmOpen(true)
    } else {
      onExit()
    }
  }, [onExit, onSave, isDirty])

  const handleOpenProperties = React.useCallback((path: NodePath) => {
    setSelectedPath(path)
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsInspectorOpen(true)
    } else {
      setIsMobilePropertiesOpen(true)
    }
  }, [])

  // Keyboard Shortcuts (Undo, Redo, Save, Duplicate, Delete, Parent Escape)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        pickerTarget ||
        isImportModalOpen ||
        isExitConfirmOpen ||
        isMobilePropertiesOpen
      ) {
        return
      }

      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === "s") {
        if (onSave) {
          e.preventDefault()
          void handleSave()
        }
        return
      }

      if (mode !== "visual" || isEditableElement(e.target)) return

      if (isMod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        return
      }

      if (isMod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        handleRedo()
        return
      }

      if (isMod && e.key.toLowerCase() === "d" && selectedPath.length > 0) {
        e.preventDefault()
        handleDuplicateNode(selectedPath)
        return
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedPath.length > 0
      ) {
        e.preventDefault()
        handleDeleteNode(selectedPath)
        return
      }

      if (e.key === "Escape" && selectedPath.length > 0) {
        e.preventDefault()
        setSelectedPath(getNodeParentPath(selectedPath))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    mode,
    selectedPath,
    pickerTarget,
    isImportModalOpen,
    isExitConfirmOpen,
    isMobilePropertiesOpen,
    onSave,
    handleSave,
    handleUndo,
    handleRedo,
    handleDuplicateNode,
    handleDeleteNode,
  ])

  // Escape & backdrop helpers for Import & Exit modals
  React.useEffect(() => {
    if (!isImportModalOpen && !isExitConfirmOpen) return
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        if (isExitConfirmOpen) setIsExitConfirmOpen(false)
        else if (isImportModalOpen) setIsImportModalOpen(false)
      }
    }
    window.addEventListener("keydown", onEsc, { capture: true })
    return () => window.removeEventListener("keydown", onEsc, { capture: true })
  }, [isImportModalOpen, isExitConfirmOpen])

  const pickerPositionLabel = React.useMemo(() => {
    if (!pickerTarget) return undefined
    const targetNode = getNodeByPath(getSafeRoot(schema), pickerTarget.path)
    const targetName = targetNode?.type ? `<${targetNode.type}>` : "<Root>"
    if (pickerTarget.position === "inside") return `Inside ${targetName}`
    if (pickerTarget.position === "above") return `Above ${targetName}`
    return `Below ${targetName}`
  }, [pickerTarget, schema])

  return (
    <div
      className={`flex w-full flex-col overflow-hidden bg-background text-foreground ${
        embedded
          ? "relative h-full min-h-[540px] max-h-[calc(100svh-1rem)] flex-1 rounded-[min(var(--radius-4xl),24px)] border border-border/60 shadow-lg"
          : "h-svh"
      }`}
    >
      {/* 1. Studio Top Bar */}
      <header className="z-30 flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/85 px-3 py-1.5 backdrop-blur-md sm:px-4">
        {/* Left: Mode & Viewport Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setMode("visual")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                mode === "visual"
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconLayoutDashboard className="size-3.5" />
              <span>Builder</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                mode === "preview"
                  ? "bg-background font-semibold text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconEye className="size-3.5" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("code")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                mode === "code"
                  ? "bg-background font-semibold text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconCode className="size-3.5" />
              <span>JSON</span>
            </button>
          </div>

          {/* Viewport Switcher applies to BOTH Visual Builder & Preview */}
          {(mode === "visual" || mode === "preview") && (
            <div className="hidden items-center rounded-xl border border-border/60 bg-muted/40 p-0.5 sm:flex">
              <span title="Desktop viewport" className="inline-flex">
                <Button
                  size="icon-xs"
                  variant={viewport === "desktop" ? "default" : "ghost"}
                  onPress={() => setViewport("desktop")}
                  aria-label="Desktop viewport"
                >
                  <IconDeviceDesktop className="size-3.5" />
                </Button>
              </span>
              <span title="Tablet viewport" className="inline-flex">
                <Button
                  size="icon-xs"
                  variant={viewport === "tablet" ? "default" : "ghost"}
                  onPress={() => setViewport("tablet")}
                  aria-label="Tablet viewport"
                >
                  <IconDeviceTablet className="size-3.5" />
                </Button>
              </span>
              <span title="Mobile viewport" className="inline-flex">
                <Button
                  size="icon-xs"
                  variant={viewport === "mobile" ? "default" : "ghost"}
                  onPress={() => setViewport("mobile")}
                  aria-label="Mobile viewport"
                >
                  <IconDeviceMobile className="size-3.5" />
                </Button>
              </span>
            </div>
          )}

          {mode === "visual" && (
            <div className="flex items-center gap-1.5">
              <Button
                size="xs"
                variant={wireframeMode ? "default" : "outline"}
                onPress={() => setWireframeMode(!wireframeMode)}
                className="gap-1 text-xs"
                aria-label="Toggle Wireframes"
              >
                <IconBoxPadding className="size-3.5" />
                <span className="hidden md:inline">Wireframes</span>
              </Button>

              <Button
                size="xs"
                variant={isRootFullWidth ? "default" : "outline"}
                onPress={handleToggleFullWidth}
                className="gap-1 text-xs"
                aria-label="Toggle Full Width"
              >
                <IconArrowsMaximize className="size-3.5" />
                <span className="hidden xl:inline">
                  {isRootFullWidth ? "Full Width" : "Boxed Width"}
                </span>
              </Button>

              <Button
                size="xs"
                variant="outline"
                onPress={() => {
                  setPickerTarget({
                    path: selectedPath.length > 0 ? selectedPath : [],
                    position: "inside",
                  })
                }}
                className="gap-1 border-primary/30 text-xs text-primary hover:border-primary hover:bg-primary/10"
              >
                <IconPlus className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Add Component</span>
              </Button>
            </div>
          )}
        </div>

        {/* Right: History, Templates, Inspector, Import/Export & Save */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span title="Undo (Ctrl+Z)" className="inline-flex">
            <Button
              size="icon-xs"
              variant="ghost"
              isDisabled={past.length === 0}
              onPress={handleUndo}
              aria-label="Undo"
            >
              <IconArrowBackUp className="size-3.5" />
            </Button>
          </span>

          <span title="Redo (Ctrl+Shift+Z)" className="inline-flex">
            <Button
              size="icon-xs"
              variant="ghost"
              isDisabled={future.length === 0}
              onPress={handleRedo}
              aria-label="Redo"
            >
              <IconArrowForwardUp className="size-3.5" />
            </Button>
          </span>

          <div className="mx-0.5 h-4 w-px bg-border/60" />

          {/* Templates Dropdown (React Aria Menu) */}
          <DropdownMenuTrigger>
            <Button size="xs" variant="outline" className="gap-1 text-xs">
              <IconTemplate className="size-3.5" />
              <span className="hidden md:inline">Templates</span>
            </Button>
            <DropdownMenu
              className="w-64"
              placement="bottom end"
              onAction={(key) => handleLoadTemplate(String(key))}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Document Templates</DropdownMenuLabel>
                {BUILDER_TEMPLATES.map((tpl) => (
                  <DropdownMenuItem
                    key={tpl.id}
                    id={tpl.id}
                    textValue={tpl.name}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {tpl.name}
                    </span>
                    <span className="line-clamp-1 text-[11px] text-muted-foreground">
                      {tpl.description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenu>
          </DropdownMenuTrigger>

          {/* Toggle Docked Right Inspector */}
          {mode === "visual" && (
            <Button
              size="xs"
              variant={isInspectorOpen ? "secondary" : "outline"}
              onPress={() => {
                if (typeof window !== "undefined" && window.innerWidth >= 1024) {
                  setIsInspectorOpen((prev) => !prev)
                } else {
                  setIsMobilePropertiesOpen(true)
                }
              }}
              aria-label="Toggle Inspector Panel"
              className="gap-1 text-xs"
            >
              <IconLayoutSidebarRight className="size-3.5" />
              <span className="hidden xl:inline">Inspector</span>
            </Button>
          )}

          <span title="Import JSON" className="inline-flex">
            <Button
              size="xs"
              variant="outline"
              onPress={() => {
                setImportError(null)
                setIsImportModalOpen(true)
              }}
              aria-label="Import Schema JSON"
            >
              <IconUpload className="size-3.5" />
            </Button>
          </span>

          <span title="Copy JSON" className="inline-flex">
            <Button
              size="xs"
              variant="outline"
              onPress={() => void handleCopyJson()}
              aria-label="Copy JSON to Clipboard"
            >
              <IconCopy className="size-3.5" />
            </Button>
          </span>

          <Button
            size="xs"
            variant="outline"
            onPress={handleDownloadJson}
            aria-label="Download Schema JSON"
            className="gap-1"
          >
            <IconDownload className="size-3.5" />
            <span className="hidden xl:inline">Export</span>
          </Button>

          {onSave && (
            <>
              {isDirty && (
                <Badge
                  variant="secondary"
                  className="hidden h-5 px-1.5 text-[10px] font-medium text-amber-600 sm:inline-flex dark:text-amber-400"
                >
                  Unsaved
                </Badge>
              )}
              <Button
                size="xs"
                variant="default"
                isDisabled={isSaving}
                onPress={() => void handleSave()}
                className="gap-1 bg-primary font-semibold text-primary-foreground"
              >
                {isSaving ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : (
                  <IconDeviceFloppy className="size-3.5" />
                )}
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </Button>
            </>
          )}

          {onExit && (
            <Button
              size="xs"
              variant="outline"
              onPress={handleRequestExit}
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3.5" />
              <span>Exit</span>
            </Button>
          )}
        </div>
      </header>

      {/* 2. Workspace Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {mode === "visual" && (
          <>
            <Canvas
              root={getSafeRoot(schema)}
              selectedPath={selectedPath}
              viewport={viewport}
              wireframeMode={wireframeMode}
              onSelectPath={setSelectedPath}
              onMoveNode={handleMoveNode}
              onDuplicateNode={handleDuplicateNode}
              onDeleteNode={handleDeleteNode}
              onInsertChild={handleInsertChild}
              onInsertAdjacent={handleInsertAdjacent}
              onOpenProperties={handleOpenProperties}
              onOpenPicker={(path, position) => {
                setPickerTarget({ path, position })
              }}
              onUpdateNodeText={handleUpdateNodeText}
              onAddSection={(type) => {
                if (type) handleAddSection(type)
                else setPickerTarget({ path: [], position: "inside" })
              }}
              onToggleRootWidth={handleToggleFullWidth}
            />

            {/* Docked Right-Side Live Inspector (Desktop lg+) */}
            {isInspectorOpen && (
              <div className="hidden h-full min-h-0 lg:flex">
                <PropertiesPanel
                  schema={schema}
                  selectedPath={selectedPath}
                  activeTab={inspectorTab}
                  onTabChange={setInspectorTab}
                  onSelectPath={setSelectedPath}
                  onUpdateNode={handleUpdateNode}
                  onUpdateMeta={handleUpdateMeta}
                  onDeleteNode={handleDeleteNode}
                  onDuplicateNode={handleDuplicateNode}
                  onClose={() => setIsInspectorOpen(false)}
                />
              </div>
            )}

            {/* Modal Inspector fallback for viewports below lg */}
            <NodePropertiesModal
              isOpen={isMobilePropertiesOpen}
              schema={schema}
              selectedPath={selectedPath}
              onClose={() => setIsMobilePropertiesOpen(false)}
              onSelectPath={setSelectedPath}
              onUpdateNode={handleUpdateNode}
              onUpdateMeta={handleUpdateMeta}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
            />

            <ComponentPickerModal
              isOpen={pickerTarget !== null}
              positionLabel={pickerPositionLabel}
              onClose={() => setPickerTarget(null)}
              onSelectComponent={handleSelectPickerComponent}
            />
          </>
        )}

        {/* Mode B: Live Interactive Preview */}
        {mode === "preview" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted/20 p-4 md:p-6 lg:p-8">
            <div
              className={`flex-1 transition-all duration-200 ${
                viewport === "mobile"
                  ? "mx-auto w-full max-w-sm"
                  : viewport === "tablet"
                    ? "mx-auto w-full max-w-2xl"
                    : "w-full"
              }`}
            >
              <div className="flex min-h-full flex-col rounded-[min(var(--radius-4xl),24px)] border border-border/60 bg-card p-6 shadow-sm">
                <IrisPage schema={schema} showEditButton={false} />
              </div>
            </div>
          </div>
        )}

        {/* Mode C: Raw JSON Code Editor */}
        {mode === "code" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20 p-4 md:p-6">
            <div className="flex min-h-0 w-full flex-1 flex-col space-y-3 rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {codeError ? (
                    <Badge
                      variant="destructive"
                      className="gap-1 font-mono text-[10px]"
                    >
                      <IconAlertTriangle className="size-3" />
                      <span>Syntax Error</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1 font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
                    >
                      <IconCheck className="size-3" />
                      <span>Valid JSON Schema</span>
                    </Badge>
                  )}
                </div>

                <Button
                  size="xs"
                  variant="outline"
                  isDisabled={Boolean(codeError)}
                  onPress={() => {
                    try {
                      const parsed = JSON.parse(codeJsonText)
                      const pretty = JSON.stringify(parsed, null, 2)
                      lastCommittedCodeRef.current = pretty
                      setCodeJsonText(pretty)
                    } catch {
                      // disabled while invalid
                    }
                  }}
                  className="text-xs"
                >
                  Format JSON
                </Button>
              </div>

              {codeError && (
                <div className="shrink-0 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                  {codeError}
                </div>
              )}

              <div className="min-h-0 w-full flex-1 overflow-hidden">
                <Textarea
                  value={codeJsonText}
                  onChange={handleCodeJsonChange}
                  className="h-full w-full field-sizing-fixed resize-none overflow-auto rounded-xl border border-input/60 bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre focus-visible:ring-primary"
                  spellCheck={false}
                  aria-label="Raw JSON Schema Editor"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Import JSON Modal */}
      {isImportModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsImportModalOpen(false)
          }}
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/50 p-4 backdrop-blur-xs duration-100 fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-xl flex-col space-y-4 rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-background p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="text-sm font-semibold">Import Document JSON</h3>
                <p className="text-xs text-muted-foreground">
                  Paste any valid IrisPage schema JSON to load into the builder.
                </p>
              </div>
              <Button
                size="icon-xs"
                variant="ghost"
                onPress={() => setIsImportModalOpen(false)}
                aria-label="Close"
              >
                <IconX className="size-4" />
              </Button>
            </div>

            {importError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {importError}
              </div>
            )}

            <Textarea
              value={importJsonText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setImportJsonText(e.target.value)
                if (importError) setImportError(null)
              }}
              placeholder='Paste JSON schema here... { "title": "My Document", "root": { ... } }'
              className="h-64 field-sizing-fixed rounded-xl font-mono text-xs"
              spellCheck={false}
              aria-label="Paste JSON Schema"
            />

            <div className="flex justify-end gap-2 border-t border-border/40 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setIsImportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" variant="default" onPress={handleApplyImport}>
                Import Schema
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Unsaved Changes Exit Confirmation Modal */}
      {isExitConfirmOpen && onExit && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExitConfirmOpen(false)
          }}
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/50 p-4 backdrop-blur-xs duration-100 fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-md flex-col space-y-4 rounded-[min(var(--radius-4xl),24px)] border border-border/80 bg-background p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <IconAlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Unsaved Changes
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  You have unsaved edits in this document. Save your changes
                  before exiting or discard them.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-3">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setIsExitConfirmOpen(false)}
              >
                Keep Editing
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onPress={() => {
                  setIsExitConfirmOpen(false)
                  onExit()
                }}
              >
                Discard & Exit
              </Button>
              {onSave && (
                <Button
                  size="sm"
                  variant="default"
                  isDisabled={isSaving}
                  onPress={async () => {
                    const saved = await handleSave()
                    if (saved) {
                      setIsExitConfirmOpen(false)
                      onExit()
                    }
                  }}
                >
                  Save & Exit
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
