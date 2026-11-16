"use client"

import * as React from "react"
import {
  IconAdjustments,
  IconArrowDown,
  IconArrowUp,
  IconArrowsMaximize,
  IconChevronRight,
  IconCornerLeftUp,
  IconCopy,
  IconPlus,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconTrash,
} from "@tabler/icons-react"

import {
  IrisErrorBoundary,
  VOID_HTML_TAGS,
  resolveComponent,
  resolveProps,
  type IrisChild,
  type IrisNode,
} from "@/components/iris-page"
import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import type { NodePath, ViewportMode } from "./types"
import {
  getNodeBreadcrumbs,
  getNodeByPath,
  getNodeEditableText,
  getNodeParentPath,
  getSiblingInfo,
  hasElementChildren,
  type SectionPresetType,
} from "./ast-utils"

export interface CanvasProps {
  root: IrisNode
  selectedPath: NodePath
  viewport: ViewportMode
  wireframeMode?: boolean
  onSelectPath: (path: NodePath) => void
  onMoveNode: (path: NodePath, direction: "up" | "down") => void
  onDuplicateNode: (path: NodePath) => void
  onDeleteNode: (path: NodePath) => void
  onInsertChild: (parentPath: NodePath, newNode?: IrisNode) => void
  onInsertAdjacent?: (
    targetPath: NodePath,
    position: "above" | "below",
    newNode?: IrisNode
  ) => void
  onOpenProperties?: (path: NodePath) => void
  onOpenPicker?: (
    targetPath: NodePath,
    position: "inside" | "above" | "below"
  ) => void
  onUpdateNodeText?: (path: NodePath, nextText: string) => void
  onAddSection?: (type?: SectionPresetType) => void
  onToggleRootWidth?: () => void
}

const EMPTY_CONTAINER_TYPES = new Set([
  "div",
  "section",
  "main",
  "article",
  "aside",
  "header",
  "footer",
  "nav",
  "CardContent",
  "CardHeader",
  "CardFooter",
  "TabsContent",
  "AccordionContent",
  "ul",
  "ol",
])

const INLINE_TEXT_EDITABLE_TYPES = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "code",
  "blockquote",
  "li",
  "summary",
  "label",
  "Badge",
  "Button",
  "CardTitle",
  "CardDescription",
  "AlertTitle",
  "AlertDescription",
  "FieldLabel",
  "FieldDescription",
  "TableHead",
  "TableCell",
  "DocTableHead",
  "DocTableCell",
  "TabsTrigger",
  "AccordionTrigger",
])

const OVERLAY_INTERACTION_TYPES = new Set(["iframe", "video"])

const INTERACTIVE_PRESS_TYPES = new Set([
  "Button",
  "TabsTrigger",
  "AccordionTrigger",
  "Toggle",
  "Switch",
  "Checkbox",
])

function pathToKey(path: NodePath): string {
  return path.length === 0 ? "root" : path.join(".")
}

function getLayoutPlacementClasses(className?: string): string {
  if (!className) return ""
  const regex =
    /\b(?:(?:sm|md|lg|xl|2xl):)?(?:col-span-\S+|col-start-\S+|col-end-\S+|row-span-\S+|row-start-\S+|row-end-\S+|flex-1|flex-auto|flex-initial|flex-none|grow|grow-0|shrink|shrink-0|self-\S+|justify-self-\S+|w-full|w-auto|w-fit|min-w-\S+|max-w-\S+)\b/g
  const matches = className.match(regex)
  return matches ? matches.join(" ") : ""
}

export function Canvas({
  root,
  selectedPath,
  viewport,
  wireframeMode = true,
  onSelectPath,
  onMoveNode,
  onDuplicateNode,
  onDeleteNode,
  onInsertChild,
  onInsertAdjacent,
  onOpenProperties,
  onOpenPicker,
  onUpdateNodeText,
  onAddSection,
  onToggleRootWidth,
}: CanvasProps) {
  const viewportAreaRef = React.useRef<HTMLDivElement>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const [editingInlinePathKey, setEditingInlinePathKey] = React.useState<
    string | null
  >(null)
  const [inlineDraft, setInlineDraft] = React.useState("")
  const inlineInputRef = React.useRef<HTMLInputElement | null>(null)

  const [toolbarPos, setToolbarPos] = React.useState<{
    top: number
    left: number
    visible: boolean
  }>({ top: 0, left: 0, visible: false })

  const breadcrumbs = React.useMemo(() => {
    return getNodeBreadcrumbs(root, selectedPath)
  }, [root, selectedPath])

  const selectedNode = React.useMemo(() => {
    return getNodeByPath(root, selectedPath)
  }, [root, selectedPath])

  const siblingInfo = React.useMemo(() => {
    return getSiblingInfo(root, selectedPath)
  }, [root, selectedPath])

  const selectedPathKey = pathToKey(selectedPath)
  const isRootSelected = selectedPath.length === 0

  const isSelected = (path: NodePath) => {
    if (path.length !== selectedPath.length) return false
    return path.every((val, idx) => val === selectedPath[idx])
  }

  const startInlineEdit = (node: IrisNode, path: NodePath) => {
    if (!onUpdateNodeText) return
    setEditingInlinePathKey(pathToKey(path))
    setInlineDraft(getNodeEditableText(node))
    requestAnimationFrame(() => {
      inlineInputRef.current?.focus()
      inlineInputRef.current?.select()
    })
  }

  const commitInlineEdit = (path: NodePath) => {
    if (onUpdateNodeText && editingInlinePathKey === pathToKey(path)) {
      onUpdateNodeText(path, inlineDraft)
    }
    setEditingInlinePathKey(null)
  }

  const cancelInlineEdit = () => {
    setEditingInlinePathKey(null)
  }

  // Cancel inline editing if selection moves elsewhere
  React.useEffect(() => {
    if (editingInlinePathKey && editingInlinePathKey !== selectedPathKey) {
      setEditingInlinePathKey(null)
    }
  }, [editingInlinePathKey, selectedPathKey])

  // Track selected DOM element bounds and position floating overlay toolbar cleanly without clipping
  const updateToolbarPosition = React.useCallback(() => {
    const areaEl = viewportAreaRef.current
    const scrollEl = scrollContainerRef.current
    if (!areaEl || !scrollEl) return

    const targetEl = scrollEl.querySelector<HTMLElement>(
      `[data-iris-path="${selectedPathKey}"]`
    )
    if (!targetEl) {
      setToolbarPos((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }

    const areaRect = areaEl.getBoundingClientRect()
    const nodeRect = targetEl.getBoundingClientRect()

    if (nodeRect.bottom <= areaRect.top || nodeRect.top >= areaRect.bottom) {
      setToolbarPos((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      return
    }

    const toolbarWidth = toolbarRef.current?.offsetWidth || 300
    const toolbarHeight = toolbarRef.current?.offsetHeight || 34
    const spaceAbove = nodeRect.top - areaRect.top
    const spaceBelow = areaRect.bottom - nodeRect.bottom

    let top = spaceAbove - toolbarHeight - 8
    if (top < 8) {
      if (spaceBelow >= toolbarHeight + 12) {
        top = nodeRect.bottom - areaRect.top + 8
      } else {
        top = 8
      }
    }

    const maxLeft = Math.max(8, areaRect.width - toolbarWidth - 8)
    const rawLeft = nodeRect.left - areaRect.left
    const left = Math.max(8, Math.min(rawLeft, maxLeft))

    setToolbarPos({ top, left, visible: true })
  }, [selectedPathKey])

  React.useLayoutEffect(() => {
    let rafId: number | null = null
    const scheduleUpdate = () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateToolbarPosition)
    }

    scheduleUpdate()

    const scrollEl = scrollContainerRef.current
    const areaEl = viewportAreaRef.current
    const targetEl =
      scrollEl?.querySelector<HTMLElement>(
        `[data-iris-path="${selectedPathKey}"]`
      ) || null

    scrollEl?.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", scheduleUpdate)

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleUpdate)
        : null

    if (resizeObserver) {
      if (areaEl) resizeObserver.observe(areaEl)
      if (targetEl) resizeObserver.observe(targetEl)
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      scrollEl?.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", scheduleUpdate)
      resizeObserver?.disconnect()
    }
  }, [selectedPathKey, root, viewport, wireframeMode, updateToolbarPosition])

  const viewportWidthClass =
    viewport === "mobile"
      ? "max-w-sm mx-auto"
      : viewport === "tablet"
        ? "max-w-2xl mx-auto"
        : "w-full"

  // Read-only renderer for $slot props so clicking inside a slot selects the owning parent safely
  const renderSlotPreview = (
    slotNode: IrisChild | IrisChild[] | null | undefined
  ): React.ReactNode => {
    if (slotNode == null) return null
    if (typeof slotNode === "string" || typeof slotNode === "number") {
      return slotNode
    }
    if (Array.isArray(slotNode)) {
      return slotNode.map((item, idx) => (
        <React.Fragment key={idx}>{renderSlotPreview(item)}</React.Fragment>
      ))
    }

    const SlotComponent = resolveComponent(slotNode.type)
    if (!SlotComponent) {
      return (
        <span className="text-xs text-destructive">
          &lt;{slotNode.type}&gt;
        </span>
      )
    }

    const resolvedSlotProps = resolveProps(slotNode.props, (nested: any) =>
      renderSlotPreview(nested)
    )
    const isVoidSlot =
      typeof SlotComponent === "string" &&
      VOID_HTML_TAGS.has(SlotComponent.toLowerCase())

    if (isVoidSlot) {
      return React.createElement(SlotComponent, resolvedSlotProps)
    }

    const slotChildren =
      slotNode.text !== undefined && slotNode.text !== ""
        ? slotNode.text
        : slotNode.children != null
          ? renderSlotPreview(slotNode.children)
          : slotNode.text

    return React.createElement(SlotComponent, resolvedSlotProps, slotChildren)
  }

  /**
   * Recursive DOM-faithful node renderer for the visual edit canvas.
   * Attaches selection and wireframe outlines directly onto elements without
   * injecting layout-breaking `w-full` wrappers.
   */
  const renderEditableNode = (
    node: IrisChild | IrisChild[] | null | undefined,
    currentPath: NodePath
  ): React.ReactNode => {
    if (node == null) return null

    if (typeof node === "string" || typeof node === "number") {
      return String(node)
    }

    if (Array.isArray(node)) {
      return node.map((child, idx) => (
        <React.Fragment key={idx}>
          {renderEditableNode(child, [...currentPath, idx])}
        </React.Fragment>
      ))
    }

    const pathKey = pathToKey(currentPath)
    const selected = isSelected(currentPath)
    const isRoot = currentPath.length === 0
    const nodeType = node.type || "div"
    const lowerType = nodeType.toLowerCase()
    const isSection = lowerType === "section"
    const isContainer = EMPTY_CONTAINER_TYPES.has(nodeType) || EMPTY_CONTAINER_TYPES.has(lowerType)
    const isEditingThisInline = editingInlinePathKey === pathKey
    const canInlineEdit =
      Boolean(onUpdateNodeText) &&
      INLINE_TEXT_EDITABLE_TYPES.has(nodeType) &&
      !hasElementChildren(node)

    const Component = resolveComponent(nodeType)
    if (!Component) {
      return (
        <div
          key={pathKey}
          data-iris-path={pathKey}
          onClick={(e) => {
            e.stopPropagation()
            onSelectPath(currentPath)
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            onSelectPath(currentPath)
            onOpenProperties?.(currentPath)
          }}
          className={cn(
            "my-1 cursor-pointer rounded-xl border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive transition-all",
            selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          Unknown component: <code>&lt;{nodeType}&gt;</code>
        </div>
      )
    }

    const resolvedProps = resolveProps(node.props, (slotNode: any) =>
      renderSlotPreview(slotNode)
    )
    const isVoidElement =
      typeof Component === "string" && VOID_HTML_TAGS.has(Component.toLowerCase())

    const hasChildren =
      node.children !== undefined &&
      node.children !== null &&
      (Array.isArray(node.children)
        ? node.children.length > 0
        : node.children !== "")

    const isListContainer = lowerType === "ul" || lowerType === "ol"

    let renderedChildren: React.ReactNode = null
    if (!isVoidElement) {
      if (isEditingThisInline) {
        renderedChildren = (
          <input
            ref={inlineInputRef}
            type="text"
            value={inlineDraft}
            onChange={(e) => setInlineDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === "Enter") {
                e.preventDefault()
                commitInlineEdit(currentPath)
              } else if (e.key === "Escape") {
                e.preventDefault()
                cancelInlineEdit()
              }
            }}
            onBlur={() => commitInlineEdit(currentPath)}
            className="w-full min-w-[6rem] rounded bg-background/95 px-1.5 py-0.5 text-inherit font-inherit ring-2 ring-primary outline-none"
          />
        )
      } else if (node.text !== undefined && node.text !== "") {
        renderedChildren = node.text
      } else if (hasChildren) {
        renderedChildren = renderEditableNode(node.children, currentPath)
      } else if (node.text !== undefined && !isContainer) {
        renderedChildren = node.text
      } else if (isContainer) {
        const dropzone = (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onSelectPath(currentPath)
            }}
            className="@container group/slot flex min-h-20 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/70 bg-muted/15 p-2 transition-colors hover:border-primary/60 hover:bg-primary/5"
          >
            {wireframeMode && (
              <div className="mb-1 hidden max-w-full truncate text-center font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase select-none @[125px]:block">
                Empty {nodeType}
              </div>
            )}
            <span title="Add component inside" className="inline-flex max-w-full">
              <Button
                size="xs"
                variant="outline"
                onPress={() => {
                  onSelectPath(currentPath)
                  if (onOpenPicker) {
                    onOpenPicker(currentPath, "inside")
                  } else {
                    onInsertChild(currentPath)
                  }
                }}
                aria-label="Add component inside"
                className="max-w-full gap-1 bg-background/90 px-2 text-xs shadow-xs hover:border-primary hover:text-primary"
              >
                <IconPlus className="size-3.5 shrink-0 text-primary" />
                <span className="hidden truncate @[115px]:inline">Add block</span>
              </Button>
            </span>
          </div>
        )

        renderedChildren = isListContainer ? (
          <li className="list-none">{dropzone}</li>
        ) : (
          dropzone
        )
      }
    }

    const handleSelectClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      // Prevent accidental navigation inside anchors or button form submits
      if (lowerType === "a" || lowerType === "button" || lowerType === "submit") {
        e.preventDefault()
      }
      onSelectPath(currentPath)
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      onSelectPath(currentPath)
      if (canInlineEdit) {
        startInlineEdit(node, currentPath)
      } else {
        onOpenProperties?.(currentPath)
      }
    }

    const wireframeClass = wireframeMode
      ? isSection
        ? "outline-1 outline-dashed outline-border/80 bg-muted/5 rounded-2xl"
        : isContainer
          ? "outline-1 outline-dashed outline-border/60 rounded-lg"
          : ""
      : ""

    const selectionClass = selected
      ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-md"
      : "hover:ring-1 hover:ring-primary/40 hover:rounded-sm"

    // Minimal interaction-shield wrapper only for <iframe> and <video> so embeds can be clicked to select
    if (OVERLAY_INTERACTION_TYPES.has(lowerType)) {
      const placement = getLayoutPlacementClasses(
        typeof resolvedProps.className === "string"
          ? resolvedProps.className
          : undefined
      )
      return (
        <div
          key={pathKey}
          data-iris-path={pathKey}
          onClick={handleSelectClick}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "relative cursor-pointer transition-all",
            placement,
            !placement.includes("w-") && "w-full",
            selectionClass
          )}
        >
          {React.createElement(Component, {
            ...resolvedProps,
            onClick: undefined,
          })}
          <div className="absolute inset-0 z-10 cursor-pointer" />
        </div>
      )
    }

    const interactivePressProps = INTERACTIVE_PRESS_TYPES.has(nodeType)
      ? {
          onPress: () => {
            onSelectPath(currentPath)
          },
        }
      : {}

    const enhancedProps: Record<string, any> = {
      ...resolvedProps,
      ...interactivePressProps,
      key: pathKey,
      "data-iris-path": pathKey,
      onClick: handleSelectClick,
      onDoubleClick: handleDoubleClick,
      className: cn(
        resolvedProps.className,
        !isRoot && "cursor-pointer",
        wireframeClass,
        selectionClass,
        lowerType === "hr" && "py-1",
        resolvedProps.className?.includes("w-") || isSection || isContainer
          ? undefined
          : undefined
      ),
    }

    // For void elements like <img />, <hr />, <input />, preserve cursor/selection without passing children
    if (isVoidElement) {
      return React.createElement(Component, enhancedProps)
    }

    return React.createElement(Component, enhancedProps, renderedChildren)
  }

  const schemaResetKey = React.useMemo(() => {
    try {
      return JSON.stringify(root)
    } catch {
      return undefined
    }
  }, [root])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/20">
      {/* Top Breadcrumbs & Quick Actions Bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background/80 px-4 py-2 text-xs text-muted-foreground backdrop-blur-xs">
        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          <span className="me-1 shrink-0 font-semibold text-foreground">
            Tree:
          </span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path.join("-") || "root"}>
              {idx > 0 && (
                <IconChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              )}
              <button
                type="button"
                onClick={() => onSelectPath(crumb.path)}
                className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                  isSelected(crumb.path)
                    ? "bg-primary/10 font-bold text-primary"
                    : "hover:bg-muted hover:text-foreground"
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {selectedPath.length > 0 && (
            <>
              <span title="Select parent node (Esc)" className="inline-flex">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onPress={() => onSelectPath(getNodeParentPath(selectedPath))}
                  aria-label="Select Parent"
                >
                  <IconCornerLeftUp className="size-3.5" />
                </Button>
              </span>
              <Button
                size="icon-xs"
                variant="ghost"
                isDisabled={!siblingInfo.canMoveUp}
                onPress={() => onMoveNode(selectedPath, "up")}
                aria-label="Move Up"
              >
                <IconArrowUp className="size-3" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                isDisabled={!siblingInfo.canMoveDown}
                onPress={() => onMoveNode(selectedPath, "down")}
                aria-label="Move Down"
              >
                <IconArrowDown className="size-3" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onPress={() => onDuplicateNode(selectedPath)}
                aria-label="Duplicate"
              >
                <IconCopy className="size-3" />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onPress={() => onDeleteNode(selectedPath)}
                aria-label="Delete Node"
                className="text-destructive hover:bg-destructive/10"
              >
                <IconTrash className="size-3" />
              </Button>
              <div className="mx-1 h-3 w-px bg-border/60" />
            </>
          )}

          {onToggleRootWidth && isRootSelected && (
            <Button
              size="xs"
              variant="outline"
              onPress={onToggleRootWidth}
              className="h-6 gap-1 px-2 text-[11px]"
              aria-label="Toggle between full width and boxed container"
            >
              <IconArrowsMaximize className="size-3 text-primary" />
              <span className="hidden sm:inline">Width</span>
            </Button>
          )}

          {onOpenProperties && (
            <Button
              size="xs"
              variant="ghost"
              onPress={() => onOpenProperties(selectedPath)}
              className="shrink-0 gap-1 text-[11px] text-primary hover:bg-primary/10"
            >
              <IconAdjustments className="size-3.5" />
              <span className="hidden sm:inline">Inspector</span>
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Viewport Area + Non-Clipped Overlay Toolbar */}
      <div ref={viewportAreaRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          onClick={() => onSelectPath([])}
          className="h-full overflow-y-auto p-4 sm:p-6 md:p-8"
        >
          <div className={`transition-all duration-200 ${viewportWidthClass}`}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="min-h-[420px] rounded-[min(var(--radius-4xl),24px)] border border-border/60 bg-card p-6 pt-10 shadow-sm"
            >
              <IrisErrorBoundary
                fallbackNodeName={root?.type || "Canvas"}
                resetKey={schemaResetKey}
              >
                {renderEditableNode(root, [])}
              </IrisErrorBoundary>

              {/* Bottom Add Section Button */}
              <div className="mt-8 flex items-center justify-center py-4">
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => {
                    if (onOpenPicker) {
                      onOpenPicker([], "inside")
                    } else if (onAddSection) {
                      onAddSection("3-col")
                    }
                  }}
                  className="gap-2 rounded-2xl border-dashed border-border/80 px-5 py-2.5 text-xs font-semibold shadow-xs transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  <IconPlus className="size-4 text-primary" />
                  <span>Add section</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Non-clipped Floating Overlay Toolbar */}
        {toolbarPos.visible && selectedNode && (
          <div
            ref={toolbarRef}
            onClick={(e) => e.stopPropagation()}
            style={{ top: toolbarPos.top, left: toolbarPos.left }}
            className="pointer-events-auto absolute z-40 flex max-w-[calc(100%-16px)] items-center gap-0.5 overflow-x-auto rounded-xl border border-border/90 bg-background/95 px-2 py-1 whitespace-nowrap shadow-xl backdrop-blur-md"
          >
            <Badge
              variant="default"
              className="h-4 shrink-0 px-1.5 font-mono text-[10px] shadow-xs"
            >
              {isRootSelected ? `Root <${selectedNode.type}>` : `<${selectedNode.type}>`}
            </Badge>

            {isRootSelected ? (
              <>
                <div className="mx-0.5 h-3 w-px shrink-0 bg-border/60" />
                {onOpenProperties && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => onOpenProperties(selectedPath)}
                    aria-label="Inspect Root"
                    className="text-primary hover:bg-primary/10"
                  >
                    <IconAdjustments className="size-3.5" />
                  </Button>
                )}
                <span title="Add inside root" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => {
                      if (onOpenPicker) onOpenPicker([], "inside")
                      else onInsertChild([])
                    }}
                    aria-label="Add Child Inside Root"
                  >
                    <IconPlus className="size-3 text-primary" />
                  </Button>
                </span>
                {onToggleRootWidth && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onPress={onToggleRootWidth}
                    className="h-5 gap-1 px-1.5 text-[10px] font-medium"
                  >
                    <IconArrowsMaximize className="size-3 text-primary" />
                    <span>Stretch Width</span>
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="mx-0.5 h-3 w-px shrink-0 bg-border/60" />

                <span title="Select parent" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => onSelectPath(getNodeParentPath(selectedPath))}
                    aria-label="Select Parent"
                  >
                    <IconCornerLeftUp className="size-3.5" />
                  </Button>
                </span>

                {onOpenProperties && (
                  <span title="Inspect properties" className="inline-flex">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onPress={() => onOpenProperties(selectedPath)}
                      aria-label="Inspect Node"
                      className="text-primary hover:bg-primary/10"
                    >
                      <IconAdjustments className="size-3.5" />
                    </Button>
                  </span>
                )}

                <span title="Insert above" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => {
                      if (onOpenPicker) onOpenPicker(selectedPath, "above")
                      else onInsertAdjacent?.(selectedPath, "above")
                    }}
                    aria-label="Insert Above"
                  >
                    <IconRowInsertTop className="size-3.5" />
                  </Button>
                </span>

                <span title="Insert below" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => {
                      if (onOpenPicker) onOpenPicker(selectedPath, "below")
                      else onInsertAdjacent?.(selectedPath, "below")
                    }}
                    aria-label="Insert Below"
                  >
                    <IconRowInsertBottom className="size-3.5" />
                  </Button>
                </span>

                <div className="mx-0.5 h-3 w-px shrink-0 bg-border/60" />

                <span title="Move up" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    isDisabled={!siblingInfo.canMoveUp}
                    onPress={() => onMoveNode(selectedPath, "up")}
                    aria-label="Move Up"
                  >
                    <IconArrowUp className="size-3" />
                  </Button>
                </span>

                <span title="Move down" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    isDisabled={!siblingInfo.canMoveDown}
                    onPress={() => onMoveNode(selectedPath, "down")}
                    aria-label="Move Down"
                  >
                    <IconArrowDown className="size-3" />
                  </Button>
                </span>

                <span title="Duplicate" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => onDuplicateNode(selectedPath)}
                    aria-label="Duplicate"
                  >
                    <IconCopy className="size-3" />
                  </Button>
                </span>

                {!VOID_HTML_TAGS.has((selectedNode.type || "").toLowerCase()) && (
                  <span title="Add child inside" className="inline-flex">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onPress={() => {
                        if (onOpenPicker) onOpenPicker(selectedPath, "inside")
                        else onInsertChild(selectedPath)
                      }}
                      aria-label="Add Child Inside"
                    >
                      <IconPlus className="size-3 text-primary" />
                    </Button>
                  </span>
                )}

                <span title="Delete" className="inline-flex">
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onPress={() => onDeleteNode(selectedPath)}
                    aria-label="Delete Node"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <IconTrash className="size-3" />
                  </Button>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
