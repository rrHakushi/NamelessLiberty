"use client"

import * as React from "react"
import {
  IconAdjustments,
  IconAlertTriangle,
  IconCheck,
  IconCode,
  IconCopy,
  IconFileDescription,
  IconLayersLinked,
  IconPalette,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import {
  ALL_TABLER_ICON_NAMES,
  COMPONENT_REGISTRY,
  DynamicIcon,
  HTML_TAGS,
  VOID_HTML_TAGS,
  resolveComponent,
  resolveTablerIcon,
  type IrisNode,
  type IrisPageSchema,
} from "@/components/iris-page"
import type { NodePath } from "./types"
import {
  getNodeBreadcrumbs,
  getNodeByPath,
  getNodeEditableText,
  hasElementChildren,
  updateNodeTextSafely,
} from "./ast-utils"

export type InspectorTab = "content" | "styling" | "props" | "page"

export interface NodeInspectorContentProps {
  schema: IrisPageSchema
  selectedPath: NodePath
  activeTab?: InspectorTab
  onTabChange?: (tab: InspectorTab) => void
  onSelectPath?: (path: NodePath) => void
  onUpdateNode: (path: NodePath, updater: (node: IrisNode) => IrisNode) => void
  onUpdateMeta?: (updater: (schema: IrisPageSchema) => IrisPageSchema) => void
  onDeleteNode: (path: NodePath) => void
  onDuplicateNode?: (path: NodePath) => void
  onClose?: () => void
  compact?: boolean
}

const CALLOUT_VARIANTS = ["info", "tip", "warning", "danger", "destructive", "note"]
const ALERT_VARIANTS = ["default", "destructive"]
const BADGE_VARIANTS = ["default", "secondary", "outline", "destructive", "ghost", "link"]
const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"]
const BUTTON_SIZES = ["xs", "sm", "default", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]
const GENERIC_VARIANTS = ["default", "secondary", "outline", "ghost", "destructive"]
const GENERIC_SIZES = ["xs", "sm", "default", "lg"]
const AVATAR_SIZES = ["sm", "default", "lg"]

const QUICK_TAILWIND_CLASSES = [
  { label: "Flex Row", value: "flex flex-wrap items-center gap-2" },
  { label: "2-Col Grid", value: "grid grid-cols-1 md:grid-cols-2 gap-4" },
  { label: "3-Col Grid", value: "grid grid-cols-1 md:grid-cols-3 gap-4" },
  { label: "Card Surface", value: "rounded-2xl border border-border/60 bg-card p-5" },
  { label: "Space Y", value: "space-y-4" },
  { label: "Center Text", value: "text-center" },
  { label: "Max Width", value: "max-w-4xl mx-auto" },
  { label: "Full Width", value: "w-full" },
]

const COMPONENT_TYPE_SUGGESTIONS = Array.from(
  new Set([
    ...Object.keys(COMPONENT_REGISTRY),
    "div",
    "section",
    "article",
    "main",
    "aside",
    "h1",
    "h2",
    "h3",
    "h4",
    "p",
    "span",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "hr",
    "img",
    "video",
    "iframe",
    "details",
    "summary",
    "Icon",
  ])
)

function hasClassTokenGroup(className: string, tokenGroup: string): boolean {
  const tokens = new Set(className.split(/\s+/).filter(Boolean))
  const groupTokens = tokenGroup.split(/\s+/).filter(Boolean)
  return groupTokens.length > 0 && groupTokens.every((t) => tokens.has(t))
}

function toggleClassTokenGroup(className: string, tokenGroup: string): string {
  const existing = className.split(/\s+/).filter(Boolean)
  const groupTokens = tokenGroup.split(/\s+/).filter(Boolean)
  const existingSet = new Set(existing)
  const allPresent = groupTokens.every((t) => existingSet.has(t))

  if (allPresent) {
    const removeSet = new Set(groupTokens)
    return existing.filter((t) => !removeSet.has(t)).join(" ")
  }

  const next = [...existing]
  for (const token of groupTokens) {
    if (!existingSet.has(token)) {
      next.push(token)
      existingSet.add(token)
    }
  }
  return next.join(" ")
}

function SearchableIconSelector({
  value,
  onSelect,
  label,
}: {
  value: string
  onSelect: (iconName: string | undefined) => void
  label: string
}) {
  const [query, setQuery] = React.useState("")
  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^icon/, "")
    if (!q) {
      return ALL_TABLER_ICON_NAMES.slice(0, 24)
    }
    return ALL_TABLER_ICON_NAMES.filter((name) =>
      name.toLowerCase().includes(q)
    ).slice(0, 24)
  }, [query])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-muted-foreground">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
          {value ? (
            <DynamicIcon name={value} className="size-4 text-primary" />
          ) : (
            <IconSearch className="size-3.5 text-muted-foreground" />
          )}
        </div>
        <Input
          value={value}
          onChange={(e) => onSelect(e.target.value || undefined)}
          placeholder="e.g. IconSparkles"
          className="h-8 font-mono text-xs"
        />
      </div>

      <div className="relative">
        <IconSearch className="pointer-events-none absolute start-2.5 top-2 size-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter Tabler icons..."
          className="h-7 bg-background/70 ps-7 text-[11px]"
        />
      </div>

      <div className="grid grid-cols-6 gap-1">
        {matches.map((iconName) => {
          const isSelected = value === iconName
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelect(isSelected ? undefined : iconName)}
              title={iconName}
              className={`flex aspect-square items-center justify-center rounded-lg border transition-colors ${
                isSelected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/50 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <DynamicIcon name={iconName} className="size-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function NodeInspectorContent({
  schema,
  selectedPath,
  activeTab: controlledTab,
  onTabChange,
  onSelectPath,
  onUpdateNode,
  onUpdateMeta,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  compact = false,
}: NodeInspectorContentProps) {
  const [internalTab, setInternalTab] = React.useState<InspectorTab>("content")
  const activeTab = controlledTab ?? internalTab
  const setActiveTab = React.useCallback(
    (tab: InspectorTab) => {
      setInternalTab(tab)
      onTabChange?.(tab)
    },
    [onTabChange]
  )

  const rootNode = schema.root || { type: "div", children: [] }
  const selectedNode = React.useMemo(
    () => getNodeByPath(rootNode, selectedPath),
    [rootNode, selectedPath]
  )
  const breadcrumbs = React.useMemo(
    () => getNodeBreadcrumbs(rootNode, selectedPath),
    [rootNode, selectedPath]
  )

  const isRoot = selectedPath.length === 0
  const pathKey = selectedPath.join(".")

  // Controlled Raw Props JSON state (avoids stale defaultValue bugs)
  const serializedNodeProps = React.useMemo(
    () => JSON.stringify(selectedNode?.props || {}, null, 2),
    [selectedNode?.props]
  )
  const [propsDraft, setPropsDraft] = React.useState(serializedNodeProps)
  const [propsJsonError, setPropsJsonError] = React.useState<string | null>(null)
  const lastCommittedPropsRef = React.useRef<string>(serializedNodeProps)
  const lastPathKeyRef = React.useRef<string>(pathKey)

  React.useEffect(() => {
    if (
      pathKey !== lastPathKeyRef.current ||
      serializedNodeProps !== lastCommittedPropsRef.current
    ) {
      setPropsDraft(serializedNodeProps)
      setPropsJsonError(null)
      lastCommittedPropsRef.current = serializedNodeProps
      lastPathKeyRef.current = pathKey
    }
  }, [serializedNodeProps, pathKey])

  // Also reset draft to fresh external props when switching tabs into Props
  React.useEffect(() => {
    if (activeTab === "props") {
      setPropsDraft(serializedNodeProps)
      setPropsJsonError(null)
      lastCommittedPropsRef.current = serializedNodeProps
    }
  }, [activeTab, pathKey, serializedNodeProps])

  const setProp = React.useCallback(
    (key: string, value: unknown) => {
      onUpdateNode(selectedPath, (node) => {
        const nextProps = { ...(node.props || {}) }
        if (value === undefined || value === "") {
          delete nextProps[key]
        } else {
          nextProps[key] = value
        }
        return {
          ...node,
          props: Object.keys(nextProps).length > 0 ? nextProps : undefined,
        }
      })
    },
    [onUpdateNode, selectedPath]
  )

  const handleRawPropsChange = (nextValue: string) => {
    setPropsDraft(nextValue)
    try {
      const parsed = JSON.parse(nextValue)
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setPropsJsonError("Props must be a JSON object ({ ... }).")
        return
      }
      setPropsJsonError(null)
      const normalized = JSON.stringify(parsed, null, 2)
      lastCommittedPropsRef.current = normalized
      onUpdateNode(selectedPath, (node) => ({
        ...node,
        props: Object.keys(parsed).length > 0 ? parsed : undefined,
      }))
    } catch (err) {
      setPropsJsonError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }

  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <IconAdjustments className="mb-2 size-7 stroke-[1.5] opacity-60" />
        <p className="text-xs font-semibold text-foreground">
          No Element Selected
        </p>
        <p className="mt-1 text-[11px]">
          Click any element on the canvas to inspect and configure it.
        </p>
      </div>
    )
  }

  const props = (selectedNode.props || {}) as Record<string, any>
  const nodeType = selectedNode.type || ""
  const lowerType = nodeType.toLowerCase()
  const isVoidElement = VOID_HTML_TAGS.has(lowerType)
  const hasChildrenObjects = hasElementChildren(selectedNode)
  const currentText = getNodeEditableText(selectedNode)
  const isRecognizedType = Boolean(resolveComponent(nodeType.trim()))
  const isTablerDirectNode =
    nodeType !== "Icon" &&
    !HTML_TAGS.has(lowerType) &&
    !COMPONENT_REGISTRY[nodeType] &&
    Boolean(resolveTablerIcon(nodeType))

  const variantOptions =
    nodeType === "Callout"
      ? CALLOUT_VARIANTS
      : nodeType === "Alert"
        ? ALERT_VARIANTS
        : nodeType === "Badge"
          ? BADGE_VARIANTS
          : nodeType === "Button"
            ? BUTTON_VARIANTS
            : GENERIC_VARIANTS

  const sizeOptions =
    nodeType === "Button"
      ? BUTTON_SIZES
      : nodeType === "Avatar"
        ? AVATAR_SIZES
        : GENERIC_SIZES

  const supportsVariant =
    nodeType === "Callout" ||
    nodeType === "Alert" ||
    nodeType === "Badge" ||
    nodeType === "Button" ||
    props.variant !== undefined

  const supportsSize =
    nodeType === "Button" ||
    nodeType === "Avatar" ||
    nodeType === "Badge" ||
    props.size !== undefined

  const paddingClass = compact ? "p-3.5" : "p-6"
  const headerPadding = compact ? "px-3.5 py-2.5" : "px-6 py-4"

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Header */}
      <div
        className={`flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/20 ${headerPadding}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IconAdjustments className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-mono text-xs font-bold text-foreground">
                &lt;{nodeType || "Node"}&gt;
              </span>
              <Badge
                variant="outline"
                className="shrink-0 px-1.5 py-0 font-mono text-[9px]"
              >
                {isRoot ? "Root" : `[${selectedPath.join(",")}]`}
              </Badge>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path.join("-") || "root"}>
                  {i > 0 && <span>/</span>}
                  {onSelectPath ? (
                    <button
                      type="button"
                      onClick={() => onSelectPath(crumb.path)}
                      className="rounded px-1 hover:bg-muted hover:text-foreground"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isRoot && onDuplicateNode && (
            <Button
              size="icon-xs"
              variant="ghost"
              onPress={() => onDuplicateNode(selectedPath)}
              aria-label="Duplicate node"
            >
              <IconCopy className="size-3.5" />
            </Button>
          )}
          {!isRoot && (
            <Button
              size="icon-xs"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onPress={() => onDeleteNode(selectedPath)}
              aria-label="Delete node"
            >
              <IconTrash className="size-3.5" />
            </Button>
          )}
          {onClose && (
            <Button
              size="icon-xs"
              variant="ghost"
              onPress={onClose}
              aria-label="Close inspector"
            >
              <IconX className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className={`flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 bg-muted/10 ${
          compact ? "px-2" : "px-6"
        }`}
      >
        {(
          [
            { id: "content", label: "Content", icon: IconLayersLinked },
            { id: "styling", label: "Style", icon: IconPalette },
            { id: "props", label: "Props JSON", icon: IconCode },
            ...(onUpdateMeta
              ? [{ id: "page" as const, label: "Page", icon: IconFileDescription }]
              : []),
          ] as const
        ).map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Scrollable Body */}
      <div className={`min-h-0 flex-1 space-y-5 overflow-y-auto ${paddingClass}`}>
        {activeTab === "content" && (
          <div className="space-y-4">
            {/* Component Type & Key */}
            <div className={compact ? "space-y-3" : "grid grid-cols-2 gap-4"}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Component Type
                </label>
                <Input
                  list="iris-component-type-suggestions"
                  value={selectedNode.type}
                  onChange={(e) => {
                    const newType = e.target.value
                    onUpdateNode(selectedPath, (node) => ({
                      ...node,
                      type: newType,
                    }))
                  }}
                  placeholder="e.g. Card, Callout, h1, p, CodeBlock"
                  className="h-8 font-mono text-xs"
                />
                <datalist id="iris-component-type-suggestions">
                  {COMPONENT_TYPE_SUGGESTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
                {nodeType.trim() !== "" && !isRecognizedType && (
                  <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <IconAlertTriangle className="size-3.5 shrink-0" />
                    <span>Unrecognized component name — check spelling.</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Node Key (Optional)
                </label>
                <Input
                  value={
                    selectedNode.key !== undefined ? String(selectedNode.key) : ""
                  }
                  onChange={(e) => {
                    const keyVal = e.target.value
                    onUpdateNode(selectedPath, (node) => ({
                      ...node,
                      key: keyVal || undefined,
                    }))
                  }}
                  placeholder="e.g. hero-heading"
                  className="h-8 font-mono text-xs"
                />
              </div>
            </div>

            {/* Void / Text / CodeBlock Editor */}
            {isVoidElement ? (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-[11px] text-muted-foreground">
                <code>&lt;{lowerType}&gt;</code> is an HTML void element and cannot
                contain inner text or child elements. Configure its attributes below.
              </div>
            ) : nodeType === "CodeBlock" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Filename
                    </label>
                    <Input
                      value={String(props.filename || "")}
                      onChange={(e) => setProp("filename", e.target.value)}
                      placeholder="example.ts"
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Language
                    </label>
                    <Input
                      value={String(props.language || "")}
                      onChange={(e) => setProp("language", e.target.value)}
                      placeholder="typescript"
                      className="h-8 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Code Snippet
                  </label>
                  <Textarea
                    value={
                      props.code !== undefined
                        ? String(props.code)
                        : currentText
                    }
                    onChange={(e) => {
                      const codeVal = e.target.value
                      onUpdateNode(selectedPath, (node) => {
                        const nextProps = { ...(node.props || {}), code: codeVal }
                        const clone: IrisNode = { ...node, props: nextProps }
                        if (typeof clone.children === "string") {
                          delete clone.children
                        }
                        delete clone.text
                        return clone
                      })
                    }}
                    placeholder="Paste or edit code..."
                    className="h-36 field-sizing-fixed font-mono text-xs leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>
            ) : hasChildrenObjects ? (
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    Container Node
                  </span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {Array.isArray(selectedNode.children)
                      ? `${selectedNode.children.length} children`
                      : "1 child"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This node renders nested child components. Select a child on
                  the canvas to edit its text.
                </p>
                {selectedNode.text !== undefined && selectedNode.text !== "" && (
                  <div className="space-y-1.5 border-t border-border/50 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        Legacy `text` prop overrides children
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNode(selectedPath, (node) => {
                            const clone = { ...node }
                            delete clone.text
                            return clone
                          })
                        }
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Clear text override
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Text Content
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Rendered inside &lt;{nodeType || "Node"}&gt;
                  </span>
                </div>
                <Textarea
                  value={currentText}
                  onChange={(e) => {
                    const nextText = e.target.value
                    onUpdateNode(selectedPath, (node) =>
                      updateNodeTextSafely(node, nextText)
                    )
                  }}
                  placeholder="Enter text content..."
                  className="h-24 field-sizing-fixed text-xs leading-relaxed"
                />
              </div>
            )}

            {/* Component-Specific Config */}
            {nodeType === "Callout" && (
              <div className="space-y-3 border-t border-border/50 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Callout Variant
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {CALLOUT_VARIANTS.map((v) => (
                      <Button
                        key={v}
                        size="xs"
                        variant={
                          (props.variant || "info") === v ? "default" : "outline"
                        }
                        onPress={() => setProp("variant", v)}
                        className="text-[11px]"
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Callout Title
                  </label>
                  <Input
                    value={String(props.title || "")}
                    onChange={(e) => setProp("title", e.target.value)}
                    placeholder="e.g. Pro Tip, Warning, Note"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            {nodeType === "Icon" && (
              <div className="border-t border-border/50 pt-3">
                <SearchableIconSelector
                  label="Icon Name (props.name)"
                  value={String(props.name || "")}
                  onSelect={(val) => setProp("name", val)}
                />
              </div>
            )}

            {isTablerDirectNode && (
              <div className="border-t border-border/50 pt-3">
                <SearchableIconSelector
                  label="Icon Component (node.type)"
                  value={nodeType}
                  onSelect={(val) => {
                    if (!val) return
                    onUpdateNode(selectedPath, (node) => ({
                      ...node,
                      type: val,
                    }))
                  }}
                />
              </div>
            )}

            {(lowerType === "a" ||
              lowerType === "img" ||
              lowerType === "video" ||
              lowerType === "iframe") && (
              <div className="space-y-3 border-t border-border/50 pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {lowerType === "a" ? "Link URL (href)" : "Media URL (src)"}
                  </label>
                  <Input
                    value={String(
                      lowerType === "a" ? props.href || "" : props.src || ""
                    )}
                    onChange={(e) =>
                      setProp(lowerType === "a" ? "href" : "src", e.target.value)
                    }
                    placeholder="https://..."
                    className="h-8 font-mono text-xs"
                  />
                </div>

                {lowerType === "a" && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={props.target === "_blank"}
                      onChange={(e) => {
                        const checked = e.target.checked
                        onUpdateNode(selectedPath, (node) => {
                          const nextProps = { ...(node.props || {}) }
                          if (checked) {
                            nextProps.target = "_blank"
                            nextProps.rel = "noopener noreferrer"
                          } else {
                            delete nextProps.target
                            delete nextProps.rel
                          }
                          return { ...node, props: nextProps }
                        })
                      }}
                      className="rounded border-border"
                    />
                    <span>Open link in new tab (`_blank`)</span>
                  </label>
                )}

                {lowerType === "img" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Alt Description (alt)
                    </label>
                    <Input
                      value={String(props.alt || "")}
                      onChange={(e) => setProp("alt", e.target.value)}
                      placeholder="Describe the image..."
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {lowerType === "iframe" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Frame Title (Accessible Label)
                    </label>
                    <Input
                      value={String(props.title || "")}
                      onChange={(e) => setProp("title", e.target.value)}
                      placeholder="Embedded preview"
                      className="h-8 text-xs"
                    />
                  </div>
                )}

                {lowerType === "video" && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(props.controls)}
                      onChange={(e) =>
                        setProp("controls", e.target.checked ? true : undefined)
                      }
                      className="rounded border-border"
                    />
                    <span>Show playback controls</span>
                  </label>
                )}
              </div>
            )}

            {(nodeType === "Input" ||
              nodeType === "Textarea" ||
              lowerType === "input" ||
              lowerType === "textarea") && (
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Placeholder Text
                </label>
                <Input
                  value={String(props.placeholder || "")}
                  onChange={(e) => setProp("placeholder", e.target.value)}
                  placeholder="Enter placeholder..."
                  className="h-8 text-xs"
                />
              </div>
            )}

            {nodeType === "Progress" && (
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Progress Value
                  </label>
                  <span className="font-mono text-xs text-foreground">
                    {Number(props.value ?? 0)}%
                  </span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={props.value ?? 0}
                  onChange={(e) => {
                    const num = Number(e.target.value)
                    setProp(
                      "value",
                      Number.isFinite(num)
                        ? Math.max(0, Math.min(100, num))
                        : 0
                    )
                  }}
                  className="h-8 font-mono text-xs"
                />
              </div>
            )}

            {nodeType === "Tabs" && (
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Default Selected Tab ID (`defaultSelectedKey`)
                </label>
                <Input
                  value={String(props.defaultSelectedKey || "")}
                  onChange={(e) => setProp("defaultSelectedKey", e.target.value)}
                  placeholder="e.g. overview"
                  className="h-8 font-mono text-xs"
                />
              </div>
            )}

            {(nodeType === "TabsTrigger" ||
              nodeType === "TabsContent" ||
              nodeType === "AccordionItem") && (
              <div className="space-y-1.5 border-t border-border/50 pt-3">
                <label className="text-xs font-semibold text-muted-foreground">
                  Tab / Item ID (`id`)
                </label>
                <Input
                  value={String(props.id || "")}
                  onChange={(e) => setProp("id", e.target.value)}
                  placeholder="e.g. overview"
                  className="h-8 font-mono text-xs"
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "styling" && (
          <div className="space-y-5">
            {(supportsVariant || supportsSize) && (
              <div className="space-y-4">
                {supportsVariant && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Variant
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {variantOptions.map((opt) => (
                        <Button
                          key={opt}
                          size="xs"
                          variant={props.variant === opt ? "default" : "outline"}
                          onPress={() =>
                            setProp(
                              "variant",
                              props.variant === opt ? undefined : opt
                            )
                          }
                          className="text-[11px]"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {supportsSize && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Size
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {sizeOptions.map((opt) => (
                        <Button
                          key={opt}
                          size="xs"
                          variant={props.size === opt ? "default" : "outline"}
                          onPress={() =>
                            setProp("size", props.size === opt ? undefined : opt)
                          }
                          className="text-[11px] uppercase"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
              </div>
            )}

            {/* Tailwind ClassName */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">
                  CSS Classes (Tailwind)
                </label>
                {props.className && (
                  <button
                    type="button"
                    onClick={() => setProp("className", undefined)}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear classes
                  </button>
                )}
              </div>
              <Textarea
                value={String(props.className || "")}
                onChange={(e) => setProp("className", e.target.value)}
                placeholder="e.g. p-6 rounded-2xl border bg-card space-y-4"
                className="h-20 field-sizing-fixed font-mono text-xs leading-relaxed"
                spellCheck={false}
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  Quick Layout & Surface Utilities
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_TAILWIND_CLASSES.map((preset) => {
                    const current = String(props.className || "")
                    const active = hasClassTokenGroup(current, preset.value)
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setProp(
                            "className",
                            toggleClassTokenGroup(current, preset.value)
                          )
                        }
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border/60 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <Separator />

            {/* Searchable Icon Prop */}
            <SearchableIconSelector
              label="Icon Property (`props.icon`)"
              value={String(props.icon || "")}
              onSelect={(val) => setProp("icon", val)}
            />
          </div>
        )}

        {activeTab === "props" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-muted-foreground">
                Raw Node Props (JSON Object)
              </label>
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(propsDraft)
                    setPropsDraft(JSON.stringify(parsed, null, 2))
                    setPropsJsonError(null)
                  } catch {
                    // Wait until valid JSON before formatting
                  }
                }}
                className="font-mono text-[10px] text-primary hover:underline"
              >
                Format
              </button>
            </div>

            {propsJsonError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                {propsJsonError}
              </div>
            )}

            <Textarea
              value={propsDraft}
              onChange={(e) => handleRawPropsChange(e.target.value)}
              className="h-64 field-sizing-fixed font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}

        {activeTab === "page" && onUpdateMeta && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Document Title
              </label>
              <Input
                value={schema.title || ""}
                onChange={(e) => {
                  const val = e.target.value
                  onUpdateMeta((prev) => ({
                    ...prev,
                    title: val || undefined,
                  }))
                }}
                placeholder="Page title displayed in footer & metadata"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Description
              </label>
              <Textarea
                value={schema.description || ""}
                onChange={(e) => {
                  const val = e.target.value
                  onUpdateMeta((prev) => ({
                    ...prev,
                    description: val || undefined,
                  }))
                }}
                placeholder="Concise summary of this documentation page..."
                className="h-24 field-sizing-fixed text-xs leading-relaxed"
              />
            </div>

            <SearchableIconSelector
              label="Page Icon"
              value={schema.icon || ""}
              onSelect={(val) =>
                onUpdateMeta((prev) => ({
                  ...prev,
                  icon: val,
                }))
              }
            />
          </div>
        )}
      </div>

      {/* Footer */}
      {!compact && onClose && (
        <div className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-3.5">
          <span className="text-xs text-muted-foreground">
            Changes apply immediately to the document tree.
          </span>
          <Button size="sm" variant="default" onPress={onClose}>
            <IconCheck className="me-1 size-3.5" />
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
