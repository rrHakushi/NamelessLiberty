import type { AlgoBranchKey, AlgoNode } from "./types"
import { generateAlgoId } from "./types"

export function cloneWithNewIds(node: AlgoNode): AlgoNode {
  return {
    ...node,
    id: generateAlgoId(node.kind),
    children: node.children?.map(cloneWithNewIds),
    thenBranch: node.thenBranch?.map(cloneWithNewIds),
    elseIfBranches: node.elseIfBranches?.map((b) => ({
      ...b,
      id: generateAlgoId("elseif"),
      children: b.children.map(cloneWithNewIds),
    })),
    elseBranch: node.elseBranch?.map(cloneWithNewIds),
    tryBlock: node.tryBlock?.map(cloneWithNewIds),
    catchBlock: node.catchBlock?.map(cloneWithNewIds),
    finallyBlock: node.finallyBlock?.map(cloneWithNewIds),
    cases: node.cases?.map((c) => ({
      ...c,
      id: generateAlgoId("case"),
      children: c.children.map(cloneWithNewIds),
    })),
  }
}

function mapChildBranches(node: AlgoNode, fn: (list: AlgoNode[]) => AlgoNode[]): AlgoNode {
  return {
    ...node,
    ...(node.children ? { children: fn(node.children) } : {}),
    ...(node.thenBranch ? { thenBranch: fn(node.thenBranch) } : {}),
    ...(node.elseIfBranches
      ? {
          elseIfBranches: node.elseIfBranches.map((b) => ({
            ...b,
            children: fn(b.children),
          })),
        }
      : {}),
    ...(node.elseBranch ? { elseBranch: fn(node.elseBranch) } : {}),
    ...(node.tryBlock ? { tryBlock: fn(node.tryBlock) } : {}),
    ...(node.catchBlock ? { catchBlock: fn(node.catchBlock) } : {}),
    ...(node.finallyBlock ? { finallyBlock: fn(node.finallyBlock) } : {}),
    ...(node.cases
      ? {
          cases: node.cases.map((c) => ({
            ...c,
            children: fn(c.children),
          })),
        }
      : {}),
  }
}

export function updateNodeInTree(
  nodes: AlgoNode[],
  targetId: string,
  updater: (node: AlgoNode) => AlgoNode
): AlgoNode[] {
  return nodes.map((node) => {
    const updated = node.id === targetId ? updater(node) : node
    return mapChildBranches(updated, (list) => updateNodeInTree(list, targetId, updater))
  })
}

export function deleteNodeFromTree(nodes: AlgoNode[], targetId: string): AlgoNode[] {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => mapChildBranches(node, (list) => deleteNodeFromTree(list, targetId)))
}

export function duplicateNodeInTree(nodes: AlgoNode[], targetId: string): AlgoNode[] {
  const result: AlgoNode[] = []
  for (const node of nodes) {
    const mapped = mapChildBranches(node, (list) => duplicateNodeInTree(list, targetId))
    result.push(mapped)
    if (node.id === targetId) {
      result.push(cloneWithNewIds(mapped))
    }
  }
  return result
}

export function moveNodeInTree(
  nodes: AlgoNode[],
  targetId: string,
  direction: "up" | "down"
): AlgoNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx !== -1) {
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= nodes.length) return nodes
    const copy = [...nodes]
    const current = copy[idx]!
    const target = copy[swapIdx]!
    copy[idx] = target
    copy[swapIdx] = current
    return copy
  }
  return nodes.map((node) => mapChildBranches(node, (list) => moveNodeInTree(list, targetId, direction)))
}

export function insertChildInTree(
  nodes: AlgoNode[],
  parentId: string,
  branchKey: AlgoBranchKey,
  newNode: AlgoNode,
  caseId?: string
): AlgoNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      if (caseId && node.cases) {
        return {
          ...node,
          cases: node.cases.map((c) =>
            c.id === caseId ? { ...c, children: [...c.children, newNode] } : c
          ),
        }
      }
      if (caseId && node.elseIfBranches) {
        const hasElseIf = node.elseIfBranches.some((b) => b.id === caseId)
        if (hasElseIf) {
          return {
            ...node,
            elseIfBranches: node.elseIfBranches.map((b) =>
              b.id === caseId ? { ...b, children: [...b.children, newNode] } : b
            ),
          }
        }
      }
      const existing = node[branchKey] ?? []
      return {
        ...node,
        [branchKey]: [...existing, newNode],
      }
    }
    return mapChildBranches(node, (list) =>
      insertChildInTree(list, parentId, branchKey, newNode, caseId)
    )
  })
}

export function insertSiblingInTree(
  nodes: AlgoNode[],
  targetId: string,
  position: "before" | "after",
  newNode: AlgoNode
): AlgoNode[] {
  const idx = nodes.findIndex((n) => n.id === targetId)
  if (idx !== -1) {
    const copy = [...nodes]
    copy.splice(position === "before" ? idx : idx + 1, 0, newNode)
    return copy
  }
  return nodes.map((node) =>
    mapChildBranches(node, (list) => insertSiblingInTree(list, targetId, position, newNode))
  )
}

export function findNodeInTree(nodes: AlgoNode[], targetId: string): AlgoNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node
    const pools: AlgoNode[][] = [
      node.children ?? [],
      node.thenBranch ?? [],
      node.elseBranch ?? [],
      node.tryBlock ?? [],
      node.catchBlock ?? [],
      node.finallyBlock ?? [],
      ...(node.elseIfBranches?.map((b) => b.children) ?? []),
      ...(node.cases?.map((c) => c.children) ?? []),
    ]
    for (const pool of pools) {
      const found = findNodeInTree(pool, targetId)
      if (found) return found
    }
  }
  return null
}

export function collectAllNodeIds(nodes: AlgoNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children) ids.push(...collectAllNodeIds(node.children))
    if (node.thenBranch) ids.push(...collectAllNodeIds(node.thenBranch))
    if (node.elseIfBranches) {
      for (const b of node.elseIfBranches) {
        ids.push(...collectAllNodeIds(b.children))
      }
    }
    if (node.elseBranch) ids.push(...collectAllNodeIds(node.elseBranch))
    if (node.tryBlock) ids.push(...collectAllNodeIds(node.tryBlock))
    if (node.catchBlock) ids.push(...collectAllNodeIds(node.catchBlock))
    if (node.finallyBlock) ids.push(...collectAllNodeIds(node.finallyBlock))
    if (node.cases) {
      for (const c of node.cases) {
        ids.push(...collectAllNodeIds(c.children))
      }
    }
  }
  return ids
}
