import type {
  CollaboratorRole,
  ReliquaryCategory,
  ReliquaryVisibility,
} from "@NamelessLiberty/db"
import type { ReliquarySidebarNode } from "@NamelessLiberty/shared"
import type { IrisPageSchema } from "@/components/iris-page/types"

export interface ReliquaryUserPreview {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export interface ReliquaryLockStatus {
  locked: boolean
  lockedBy: ReliquaryUserPreview | null
  lockedAt: string | null
  lockExpiresAt: string | null
  isOwnedByCurrentUser: boolean
}

export interface ReliquaryMatchedPage {
  id: string
  title: string
  icon: string | null
}

export interface ReliquaryDocSummary {
  id: string
  title: string
  description: string | null
  icon: string | null
  category: ReliquaryCategory
  tags: string[]
  visibility: ReliquaryVisibility
  creatorId: string
  creator: ReliquaryUserPreview
  pageCount: number
  isBookmarked: boolean
  userRole: string | null
  matchedPages?: ReliquaryMatchedPage[]
  createdAt: string
  updatedAt: string
}

export interface ReliquaryCollaboratorItem {
  id: string
  userId: string
  role: CollaboratorRole
  createdAt: string
  user: ReliquaryUserPreview
}

export interface ReliquaryDocDetail {
  id: string
  title: string
  description: string | null
  icon: string | null
  category: ReliquaryCategory
  tags: string[]
  visibility: ReliquaryVisibility
  creatorId: string
  creator: ReliquaryUserPreview
  sidebarConfig: ReliquarySidebarNode[]
  pageIds: string[]
  schema: IrisPageSchema
  lock: ReliquaryLockStatus
  isBookmarked: boolean
  canEdit: boolean
  canManage: boolean
  collaborators?: ReliquaryCollaboratorItem[]
  createdAt: string
  updatedAt: string
}

export interface ReliquaryPageDetail {
  id: string
  docId: string
  title: string
  icon: string | null
  schema: IrisPageSchema
  creatorId: string
  lastEditedBy: ReliquaryUserPreview | null
  lock: ReliquaryLockStatus
  canEdit: boolean
  canManage: boolean
  createdAt: string
  updatedAt: string
}

export interface ReliquaryRecentVisitItem {
  id: string
  docId: string
  pageId: string | null
  pageTitle: string | null
  visitedAt: string
  doc: ReliquaryDocSummary
}

export const RELIQUARY_ICON_OPTIONS = [
  "IconBook",
  "IconFileText",
  "IconCode",
  "IconTerminal2",
  "IconCompass",
  "IconRocket",
  "IconShieldLock",
  "IconDatabase",
  "IconFolder",
  "IconPuzzle",
  "IconSparkles",
  "IconSettings",
] as const

export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback
  const e = err as Record<string, any>
  if (typeof e.value?.detail === "string") return e.value.detail
  if (typeof e.value?.message === "string") return e.value.message
  if (typeof e.detail === "string") return e.detail
  if (typeof e.message === "string") return e.message
  return fallback
}

export function flattenSidebarNodeOptions(
  nodes: ReliquarySidebarNode[],
  maxSelectableDepth = 4,
  depth = 1,
  prefix = ""
): Array<{ id: string; label: string; depth: number }> {
  const result: Array<{ id: string; label: string; depth: number }> = []
  for (const node of nodes) {
    if (depth <= maxSelectableDepth) {
      const displayLabel = prefix ? `${prefix} / ${node.label}` : node.label
      result.push({ id: node.id, label: displayLabel, depth })
      if (node.children && node.children.length > 0 && depth < maxSelectableDepth) {
        result.push(
          ...flattenSidebarNodeOptions(
            node.children,
            maxSelectableDepth,
            depth + 1,
            displayLabel
          )
        )
      }
    }
  }
  return result
}
