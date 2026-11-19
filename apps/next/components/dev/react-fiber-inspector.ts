"use client"

export type HookKind =
  | "useState"
  | "useReducer"
  | "useMemo"
  | "useCallback"
  | "useRef"
  | "useEffect"
  | "useLayoutEffect"
  | "useContext"
  | "unknown"

export interface InspectedHook {
  index: number
  kind: HookKind
  varName?: string
  preview: string
  rawValue: unknown
  deps?: unknown[] | null
  canTrigger: boolean
  triggerEffect?: () => void
}

export interface InspectedComponent {
  id: string
  name: string
  depth: number
  hooks: InspectedHook[]
  propsPreview: Record<string, unknown>
}

interface RawFiber {
  tag?: number
  type?: unknown
  elementType?: unknown
  stateNode?: unknown
  memoizedState?: unknown
  memoizedProps?: Record<string, unknown>
  return?: RawFiber | null
  child?: RawFiber | null
  sibling?: RawFiber | null
  _debugHookTypes?: string[]
  _debugSource?: { fileName?: string; lineNumber?: number }
}

const DEVTOOLS_COMPONENT_NAMES = new Set([
  "IrisDevTools",
  "NetworkPanel",
  "ConsolePanel",
  "StatePanel",
  "StoragePanel",
  "InspectorPanel",
  "SeoPanel",
  "JsonSection",
  "HookRow",
  "ComponentHookCard",
])

const NEXT_INTERNAL_NAMES = new Set([
  "OuterLayoutRouter",
  "InnerLayoutRouter",
  "RenderFromTemplateContext",
  "ScrollAndFocusHandler",
  "InnerScrollAndFocusHandler",
  "ErrorBoundary",
  "NotFoundBoundary",
  "LoadingBoundary",
  "SegmentViewNode",
  "HTTPAccessFallbackBoundary",
  "HTTPAccessFallbackErrorBoundary",
  "RedirectBoundary",
  "RedirectErrorBoundary",
  "ClientPageRoot",
  "ClientSegmentRoot",
  "MetadataOutlet",
  "AppRouter",
  "HotReload",
])

function isHiddenHostFiber(fiber: RawFiber): boolean {
  if (fiber.tag !== 5) return false
  const node = fiber.stateNode
  if (typeof HTMLElement !== "undefined" && node instanceof HTMLElement) {
    if (node.hidden || node.style.display === "none") return true
  }
  return false
}

function getComponentFunction(fiber: RawFiber): ((...args: unknown[]) => unknown) | null {
  const t = fiber.type ?? fiber.elementType
  if (typeof t === "function") return t as (...args: unknown[]) => unknown
  if (t && typeof t === "object") {
    const obj = t as {
      render?: (...args: unknown[]) => unknown
      type?: (...args: unknown[]) => unknown
    }
    if (typeof obj.render === "function") return obj.render
    if (typeof obj.type === "function") return obj.type
  }
  return null
}

interface ParsedSourceHook {
  varName?: string
  hookName: string
}

const BUILTIN_HOOK_NAMES = new Set([
  "useState",
  "useReducer",
  "useMemo",
  "useCallback",
  "useRef",
  "useEffect",
  "useLayoutEffect",
  "useContext",
])

function extractHookVariableNames(fiber: RawFiber): ParsedSourceHook[] {
  const fn = getComponentFunction(fiber)
  if (!fn) return []
  let src = ""
  try {
    src = Function.prototype.toString.call(fn)
  } catch {
    return []
  }

  const callPattern =
    /(?:(?:const|let|var)\s+(\[[^\]]+\]|\{[^}]+\}|[A-Za-z_$][\w$]*)\s*=\s*)?(?:\(\s*0\s*,\s*[\w$.]+\.)?(use[A-Z][\w$]*)\s*\)?\s*\(/g

  const parsed: ParsedSourceHook[] = []
  let match: RegExpExecArray | null
  while ((match = callPattern.exec(src)) !== null) {
    const rawLhs = match[1]?.trim()
    const hookName = match[2]
    if (!hookName || !BUILTIN_HOOK_NAMES.has(hookName)) continue

    let varName: string | undefined
    if (rawLhs) {
      if (rawLhs.startsWith("[")) {
        const first = rawLhs.slice(1, -1).split(",")[0]?.trim()
        if (first) varName = first
      } else {
        varName = rawLhs.replace(/\s+/g, " ")
      }
    }
    parsed.push({ varName, hookName })
  }

  return parsed
}

function getComponentName(fiber: RawFiber): string | null {
  const t = fiber.type ?? fiber.elementType
  if (typeof t === "function") {
    const fn = t as { displayName?: string; name?: string }
    return fn.displayName || fn.name || "Anonymous"
  }
  if (t && typeof t === "object") {
    const obj = t as {
      displayName?: string
      render?: { displayName?: string; name?: string }
      type?: { displayName?: string; name?: string }
    }
    if (obj.displayName) return obj.displayName
    if (obj.render) return obj.render.displayName || obj.render.name || "ForwardRef"
    if (obj.type) return obj.type.displayName || obj.type.name || "Memo"
  }
  return null
}

export function safeSerialize(value: unknown, maxDepth = 3): string {
  const seen = new WeakSet<object>()

  function format(val: unknown, depth: number): unknown {
    if (val === null) return null
    if (val === undefined) return "undefined"
    if (typeof val === "function") {
      return `[Function ${(val as { name?: string }).name || "anonymous"}]`
    }
    if (typeof val === "bigint") return `${val.toString()}n`
    if (typeof val === "symbol") return val.toString()
    if (typeof val !== "object") return val

    if (typeof Element !== "undefined" && val instanceof Element) {
      return `<${val.tagName.toLowerCase()}${val.id ? `#${val.id}` : ""}>`
    }

    if (seen.has(val)) return "[Circular]"
    if (depth >= maxDepth) {
      return Array.isArray(val) ? `[Array(${val.length})]` : "[Object]"
    }

    seen.add(val)

    if (Array.isArray(val)) {
      return val.slice(0, 20).map((item) => format(item, depth + 1))
    }

    if (val instanceof Map) {
      return Object.fromEntries(
        Array.from(val.entries())
          .slice(0, 20)
          .map(([k, v]) => [String(k), format(v, depth + 1)])
      )
    }

    if (val instanceof Set) {
      return Array.from(val.values())
        .slice(0, 20)
        .map((v) => format(v, depth + 1))
    }

    // React element check
    const maybeReactEl = val as { $$typeof?: unknown; type?: unknown }
    if (maybeReactEl.$$typeof) {
      const typeName =
        typeof maybeReactEl.type === "string"
          ? maybeReactEl.type
          : (maybeReactEl.type as { name?: string })?.name || "Component"
      return `<${typeName} />`
    }

    const out: Record<string, unknown> = {}
    const entries = Object.entries(val as Record<string, unknown>).slice(0, 25)
    for (const [k, v] of entries) {
      if (k.startsWith("__react")) continue
      out[k] = format(v, depth + 1)
    }
    return out
  }

  try {
    const normalized = format(value, 0)
    if (typeof normalized === "string") return normalized
    return JSON.stringify(normalized, null, 2)
  } catch {
    return String(value)
  }
}

function detectHookKind(
  hookNode: Record<string, unknown>,
  debugType?: string
): HookKind {
  if (debugType) {
    if (debugType === "useState") return "useState"
    if (debugType === "useReducer") return "useReducer"
    if (debugType === "useMemo") return "useMemo"
    if (debugType === "useCallback") return "useCallback"
    if (debugType === "useRef") return "useRef"
    if (debugType === "useEffect") return "useEffect"
    if (debugType === "useLayoutEffect") return "useLayoutEffect"
    if (debugType === "useContext") return "useContext"
  }

  const ms = hookNode.memoizedState
  if (hookNode.queue != null) return "useState"

  if (
    ms &&
    typeof ms === "object" &&
    !Array.isArray(ms) &&
    typeof (ms as { create?: unknown }).create === "function" &&
    "deps" in (ms as Record<string, unknown>)
  ) {
    // React Passive effect tag bit is 8, Layout is 4
    const tag = Number((ms as { tag?: number }).tag ?? 0)
    return (tag & 4) !== 0 ? "useLayoutEffect" : "useEffect"
  }

  if (
    Array.isArray(ms) &&
    ms.length === 2 &&
    (ms[1] === null || Array.isArray(ms[1]))
  ) {
    return typeof ms[0] === "function" ? "useCallback" : "useMemo"
  }

  if (
    ms &&
    typeof ms === "object" &&
    !Array.isArray(ms) &&
    "current" in (ms as Record<string, unknown>) &&
    Object.keys(ms as Record<string, unknown>).length === 1
  ) {
    return "useRef"
  }

  return "unknown"
}

function extractHooks(fiber: RawFiber): InspectedHook[] {
  const hooks: InspectedHook[] = []
  const debugTypes = Array.isArray(fiber._debugHookTypes)
    ? fiber._debugHookTypes
    : []
  const sourceHooks = extractHookVariableNames(fiber)
  const sourceUsed = new Set<number>()

  const pickVarName = (index: number, kind: HookKind): string | undefined => {
    // Fast path: 1-to-1 match with source hooks
    const direct = sourceHooks[index]
    if (direct && direct.hookName === kind && !sourceUsed.has(index)) {
      sourceUsed.add(index)
      return direct.varName
    }
    // Fallback: next unused source hook of the same kind
    for (let i = 0; i < sourceHooks.length; i++) {
      if (!sourceUsed.has(i) && sourceHooks[i]?.hookName === kind) {
        sourceUsed.add(i)
        return sourceHooks[i]?.varName
      }
    }
    return undefined
  }

  let node = fiber.memoizedState as Record<string, unknown> | null | undefined
  let index = 0

  while (node && typeof node === "object" && index < 100) {
    const kind = detectHookKind(node, debugTypes[index])
    const varName = pickVarName(index, kind)
    const ms = node.memoizedState

    if (kind === "useEffect" || kind === "useLayoutEffect") {
      const effect = ms as {
        create?: () => (() => void) | void
        destroy?: (() => void) | void
        deps?: unknown[] | null
      }
      hooks.push({
        index,
        kind,
        varName,
        preview: effect?.deps
          ? `deps: ${safeSerialize(effect.deps, 2)}`
          : "deps: (every render)",
        rawValue: effect?.deps ?? null,
        deps: effect?.deps,
        canTrigger: typeof effect?.create === "function",
        triggerEffect:
          typeof effect?.create === "function"
            ? () => {
                try {
                  if (typeof effect.destroy === "function") {
                    effect.destroy()
                  }
                  const nextDestroy = effect.create!()
                  if (typeof nextDestroy === "function") {
                    effect.destroy = nextDestroy
                  }
                } catch (err) {
                  console.error("[IRIS DevTools] Effect trigger failed:", err)
                }
              }
            : undefined,
      })
    } else if (kind === "useMemo" || kind === "useCallback") {
      const tuple = Array.isArray(ms) ? ms : [ms, null]
      hooks.push({
        index,
        kind,
        varName,
        preview: safeSerialize(tuple[0]),
        rawValue: tuple[0],
        deps: Array.isArray(tuple[1]) ? tuple[1] : null,
        canTrigger: false,
      })
    } else if (kind === "useRef") {
      const refVal = (ms as { current?: unknown })?.current
      hooks.push({
        index,
        kind,
        varName,
        preview: safeSerialize(refVal),
        rawValue: refVal,
        canTrigger: false,
      })
    } else {
      hooks.push({
        index,
        kind,
        varName,
        preview: safeSerialize(ms),
        rawValue: ms,
        canTrigger: false,
      })
    }

    node = node.next as Record<string, unknown> | null | undefined
    index++
  }

  return hooks
}

export function findReactRootFiber(): RawFiber | null {
  if (typeof document === "undefined") return null

  const candidates: Element[] = [
    document.body,
    document.documentElement,
    ...Array.from(document.body?.children ?? []),
  ]

  for (const el of candidates) {
    const rec = el as unknown as Record<string, unknown>
    for (const key of Object.keys(rec)) {
      if (key.startsWith("__reactContainer$")) {
        const container = rec[key] as
          | { stateNode?: { current?: RawFiber } }
          | RawFiber
        if (container && typeof container === "object" && "stateNode" in container) {
          const sn = (container as { stateNode?: { current?: RawFiber } }).stateNode
          if (sn?.current) return sn.current
        }
        return container as RawFiber
      }
      if (key.startsWith("__reactFiber$")) {
        let fiber = rec[key] as RawFiber | null
        while (fiber?.return) {
          fiber = fiber.return
        }
        return fiber
      }
    }
  }

  return null
}

function findActivePageFiber(root: RawFiber): RawFiber {
  let deepestPageBoundary = null as RawFiber | null
  let deepestDepth = -1

  function scan(fiber: RawFiber | null | undefined, depth: number) {
    if (!fiber) return
    if (isHiddenHostFiber(fiber)) {
      if (fiber.sibling) scan(fiber.sibling, depth)
      return
    }

    const name = getComponentName(fiber)
    if (name && DEVTOOLS_COMPONENT_NAMES.has(name)) {
      if (fiber.sibling) scan(fiber.sibling, depth)
      return
    }

    if (
      name === "ClientPageRoot" ||
      name === "InnerLayoutRouter"
    ) {
      if (depth >= deepestDepth) {
        deepestDepth = depth
        deepestPageBoundary = fiber
      }
    }

    if (fiber.child) scan(fiber.child, depth + 1)
    if (fiber.sibling) scan(fiber.sibling, depth)
  }

  scan(root, 0)
  return deepestPageBoundary?.child ?? root
}

export function collectReactComponents(): InspectedComponent[] {
  const root = findReactRootFiber()
  if (!root) return []

  const pageStart = findActivePageFiber(root)
  const results: InspectedComponent[] = []
  let counter = 0

  function walk(fiber: RawFiber | null | undefined, depth: number) {
    if (!fiber) return

    if (isHiddenHostFiber(fiber)) {
      if (fiber.sibling) walk(fiber.sibling, depth)
      return
    }

    const name = getComponentName(fiber)
    if (name && DEVTOOLS_COMPONENT_NAMES.has(name)) {
      // Skip DevTools subtree so we don't inspect ourselves
      if (fiber.sibling) walk(fiber.sibling, depth)
      return
    }

    // FunctionComponent (0), ForwardRef (11), SimpleMemoComponent (15), MemoComponent (14)
    if (
      name &&
      !NEXT_INTERNAL_NAMES.has(name) &&
      (fiber.tag === 0 ||
        fiber.tag === 11 ||
        fiber.tag === 14 ||
        fiber.tag === 15) &&
      fiber.memoizedState != null
    ) {
      const hooks = extractHooks(fiber)
      if (hooks.length > 0) {
        const safeProps: Record<string, unknown> = {}
        if (fiber.memoizedProps && typeof fiber.memoizedProps === "object") {
          for (const [k, v] of Object.entries(fiber.memoizedProps)) {
            if (k === "children") continue
            safeProps[k] = v
          }
        }

        results.push({
          id: `${name}-${counter++}`,
          name,
          depth,
          hooks,
          propsPreview: safeProps,
        })
      }
    }

    if (fiber.child) walk(fiber.child, name ? depth + 1 : depth)
    if (fiber.sibling) walk(fiber.sibling, depth)
  }

  walk(pageStart, 0)
  return results
}
