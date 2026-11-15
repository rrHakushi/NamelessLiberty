/**
 * Shared types and pure tree utilities for Reliquary documentation books.
 */

export const RELIQUARY_MAX_SIDEBAR_DEPTH = 5
export const RELIQUARY_LOCK_TTL_MS = 2 * 60 * 1000

export const RELIQUARY_CATEGORIES = [
  "API_DOCS",
  "WIKI",
  "GUIDES",
  "TUTORIALS",
  "REFERENCE",
  "OTHER",
] as const

export type ReliquaryCategory = (typeof RELIQUARY_CATEGORIES)[number]

export const RELIQUARY_VISIBILITIES = [
  "PUBLIC",
  "UNLISTED",
  "PRIVATE",
] as const

export type ReliquaryVisibility = (typeof RELIQUARY_VISIBILITIES)[number]

export interface ReliquarySidebarNode {
  id: string
  label: string
  icon?: string | null
  pageId?: string | null
  children?: ReliquarySidebarNode[]
}

export interface SidebarValidationResult {
  valid: boolean
  reason?: string
  maxDepthFound: number
}

function getSubtreeDepth(node: ReliquarySidebarNode): number {
  if (!node.children || node.children.length === 0) return 1
  let maxChild = 0
  for (const child of node.children) {
    maxChild = Math.max(maxChild, getSubtreeDepth(child))
  }
  return 1 + maxChild
}

/**
 * Validates that a sidebar tree does not exceed maxDepth levels (1-indexed),
 * has valid node ids/labels, and contains no duplicate node ids or pageIds.
 */
export function validateSidebarTreeDepth(
  nodes: readonly ReliquarySidebarNode[],
  maxDepth = RELIQUARY_MAX_SIDEBAR_DEPTH
): SidebarValidationResult {
  const seenNodeIds = new Set<string>()
  const seenPageIds = new Set<string>()
  let maxDepthFound = 0

  function visit(items: readonly ReliquarySidebarNode[], depth: number): string | null {
    for (const node of items) {
      if (depth > maxDepthFound) maxDepthFound = depth
      if (depth > maxDepth) {
        return `Sidebar nesting exceeds maximum depth of ${maxDepth} levels`
      }
      if (!node.id || !node.id.trim()) {
        return "Sidebar node is missing a valid id"
      }
      if (!node.label || !node.label.trim()) {
        return `Sidebar node "${node.id}" is missing a label`
      }
      if (seenNodeIds.has(node.id)) {
        return `Duplicate sidebar node id "${node.id}"`
      }
      seenNodeIds.add(node.id)

      if (node.pageId) {
        if (seenPageIds.has(node.pageId)) {
          return `Page "${node.pageId}" is linked multiple times in sidebarConfig`
        }
        seenPageIds.add(node.pageId)
      }

      if (node.children && node.children.length > 0) {
        const err = visit(node.children, depth + 1)
        if (err) return err
      }
    }
    return null
  }

  const error = visit(nodes, 1)
  return error
    ? { valid: false, reason: error, maxDepthFound }
    : { valid: true, maxDepthFound }
}

/**
 * Returns a pre-order list of unique linked pageIds from a sidebar tree.
 */
export function extractPageIdsFromSidebarTree(
  nodes: readonly ReliquarySidebarNode[]
): string[] {
  const ordered: string[] = []
  const seen = new Set<string>()

  function walk(items: readonly ReliquarySidebarNode[]) {
    for (const node of items) {
      if (node.pageId && !seen.has(node.pageId)) {
        seen.add(node.pageId)
        ordered.push(node.pageId)
      }
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }

  walk(nodes)
  return ordered
}

function removeMatchingNodes(
  nodes: readonly ReliquarySidebarNode[],
  predicate: (node: ReliquarySidebarNode) => boolean
): { nodes: ReliquarySidebarNode[]; removed: boolean } {
  let removed = false
  const next: ReliquarySidebarNode[] = []

  for (const node of nodes) {
    const childResult = node.children?.length
      ? removeMatchingNodes(node.children, predicate)
      : { nodes: undefined, removed: false }

    if (childResult.removed) removed = true

    if (predicate(node)) {
      removed = true
      // Promote direct children up one level into the removed node's slot
      if (childResult.nodes && childResult.nodes.length > 0) {
        next.push(...childResult.nodes)
      }
      continue
    }

    next.push(
      childResult.nodes !== undefined
        ? { ...node, children: childResult.nodes }
        : { ...node }
    )
  }

  return { nodes: next, removed }
}

/**
 * Removes any node linked to targetPageId and promotes its children up one level.
 */
export function removePageFromSidebarTree(
  nodes: readonly ReliquarySidebarNode[],
  targetPageId: string
): { nodes: ReliquarySidebarNode[]; removed: boolean } {
  return removeMatchingNodes(nodes, (node) => node.pageId === targetPageId)
}

/**
 * Removes targetNodeId and promotes its children up one level.
 */
export function removeNodeFromSidebarTree(
  nodes: readonly ReliquarySidebarNode[],
  targetNodeId: string
): { nodes: ReliquarySidebarNode[]; removed: boolean } {
  return removeMatchingNodes(nodes, (node) => node.id === targetNodeId)
}

/**
 * Updates nodes matching predicate throughout the tree while preserving order.
 */
export function updateNodeInSidebarTree(
  nodes: readonly ReliquarySidebarNode[],
  predicate: (node: ReliquarySidebarNode) => boolean,
  updater: (node: ReliquarySidebarNode) => ReliquarySidebarNode
): { nodes: ReliquarySidebarNode[]; updated: boolean } {
  let updated = false
  const next = nodes.map((node) => {
    const base = predicate(node) ? updater(node) : node
    if (base !== node) updated = true

    if (base.children && base.children.length > 0) {
      const childRes = updateNodeInSidebarTree(base.children, predicate, updater)
      if (childRes.updated) {
        updated = true
        return { ...base, children: childRes.nodes }
      }
    }
    return base
  })

  return { nodes: next, updated }
}

/**
 * Inserts a new node at root (when parentNodeId is omitted) or under parentNodeId,
 * enforcing that the resulting tree does not exceed maxDepth.
 */
export function appendPageToSidebarTree(
  nodes: readonly ReliquarySidebarNode[],
  newNode: ReliquarySidebarNode,
  parentNodeId?: string | null,
  maxDepth = RELIQUARY_MAX_SIDEBAR_DEPTH
): { nodes: ReliquarySidebarNode[]; added: boolean; reason?: string } {
  const newNodeDepth = getSubtreeDepth(newNode)

  if (!parentNodeId) {
    if (newNodeDepth > maxDepth) {
      return {
        nodes: [...nodes],
        added: false,
        reason: `Sidebar nesting exceeds maximum depth of ${maxDepth} levels`,
      }
    }
    return { nodes: [...nodes, newNode], added: true }
  }

  let added = false
  let reason: string | undefined

  function visit(items: readonly ReliquarySidebarNode[], depth: number): ReliquarySidebarNode[] {
    return items.map((node) => {
      if (node.id === parentNodeId) {
        if (depth + newNodeDepth > maxDepth) {
          reason = `Cannot nest deeper than ${maxDepth} levels`
          return node
        }
        added = true
        return {
          ...node,
          children: [...(node.children ?? []), newNode],
        }
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: visit(node.children, depth + 1),
        }
      }
      return node
    })
  }

  const next = visit(nodes, 1)
  if (!added && !reason) {
    reason = `Parent node "${parentNodeId}" was not found`
  }
  return { nodes: next, added, reason }
}
