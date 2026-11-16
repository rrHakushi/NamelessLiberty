"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useUser } from "@/context/user-context"
import { IRISFlags, hasPermission } from "@NamelessLiberty/permissions"
import { Button } from "@workspace/ui/components/button"
import { IconPencil } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import type { IrisChild, IrisNode, IrisPageSchema } from "./types"
import { resolveComponent, VOID_HTML_TAGS } from "./registry"
import { resolveProps } from "./resolve-props"
import { IrisErrorBoundary } from "./error-boundary"

const PageBuilder = dynamic(
  () => import("@/components/page-builder").then((mod) => mod.PageBuilder),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 animate-pulse items-center justify-center p-12 text-sm text-muted-foreground">
        Loading IrisPage Builder in current layout...
      </div>
    ),
  }
)

export interface IrisPageProps {
  /** The JSON schema or stringified JSON defining the documentation page */
  schema?: IrisPageSchema | string
  /** Container class name */
  className?: string
  /** Explicit override for whether the user can edit this page */
  canEdit?: boolean
  /** Whether to show the edit button in the footer when authorized (default: true) */
  showEditButton?: boolean
  /** Custom handler when Edit Page button is clicked */
  onEdit?: () => void
  /** Custom href for Edit button navigation */
  editHref?: string
  /** Callback when schema is saved in in-place editor. Returning false keeps the editor open. */
  onSaveSchema?: (
    updatedSchema: IrisPageSchema
  ) => void | boolean | Promise<void | boolean>
  /** Optional async guard awaited before opening the in-place editor */
  beforeEdit?: () => Promise<boolean> | boolean
  /** Callback invoked when exiting the in-place editor without saving */
  onCancelEdit?: () => void
  /** Disables the Edit Document button (e.g. while locked by another editor) */
  editDisabled?: boolean
  /** Helper caption shown beside disabled edit button */
  editDisabledReason?: string
  /** Optional extra actions rendered inline in the document footer */
  footerExtra?: React.ReactNode
}

export function IrisPage({
  schema: rawSchema,
  className,
  canEdit: propsCanEdit,
  showEditButton = true,
  onEdit,
  editHref,
  onSaveSchema,
  beforeEdit,
  onCancelEdit,
  editDisabled = false,
  editDisabledReason,
  footerExtra,
}: IrisPageProps) {
  // 1. Parse JSON Schema if passed as a string
  const schema: IrisPageSchema = React.useMemo(() => {
    if (typeof rawSchema === "string") {
      try {
        return JSON.parse(rawSchema)
      } catch (err) {
        console.error("[IrisPage] Invalid JSON schema provided:", err)
        return {
          title: "JSON Error",
          root: {
            type: "Alert",
            props: { variant: "destructive" },
            children: [
              { type: "AlertTitle", children: "Invalid JSON Schema" },
              {
                type: "AlertDescription",
                children:
                  err instanceof Error
                    ? err.message
                    : "Syntax error in JSON string",
              },
            ],
          },
        }
      }
    }
    return rawSchema || { root: { type: "div", children: [] } }
  }, [rawSchema])

  // Reactive in-place schema state
  const [activeSchema, setActiveSchema] = React.useState<IrisPageSchema>(schema)
  const [isEditing, setIsEditing] = React.useState(false)
  const [isAcquiringEdit, setIsAcquiringEdit] = React.useState(false)
  const isEditingRef = React.useRef(isEditing)
  isEditingRef.current = isEditing

  React.useEffect(() => {
    if (!isEditingRef.current) {
      setActiveSchema(schema)
    }
  }, [schema])

  const { user } = useUser()

  // Determine if active user has permission to edit this page
  const canEditPage = React.useMemo(() => {
    if (propsCanEdit !== undefined) return propsCanEdit
    if (!user) return false
    if (user.role === "ADMIN" || user.isAdmin === true) return true
    if (Array.isArray(user.permissions)) {
      return hasPermission(user.permissions, IRISFlags.ADMINISTRATOR)
    }
    return false
  }, [propsCanEdit, user])

  // Recursive pure AST Node Renderer
  const renderNode = React.useCallback(
    (node: IrisChild | null | undefined, index?: number): React.ReactNode => {
      if (node == null) return null

      // Direct text / number primitive
      if (typeof node === "string" || typeof node === "number") {
        return node
      }

      const key = node.key != null ? node.key : index

      // Resolve Component Type
      const Component = resolveComponent(node.type)
      if (!Component) {
        console.warn(`[IrisPage] Unrecognized component type: <${node.type}>`)
        return (
          <div
            key={key}
            className="my-1 rounded-md border border-dashed border-destructive/50 bg-destructive/5 p-2 text-xs text-destructive"
          >
            Unknown component: &lt;{node.type}&gt;
          </div>
        )
      }

      // Resolve Slots and Props
      const resolvedProps = resolveProps(node.props, (slotNode: any) =>
        Array.isArray(slotNode)
          ? slotNode.map((s, idx) => renderNode(s, idx))
          : renderNode(slotNode)
      )

      const isVoidElement =
        typeof Component === "string" &&
        VOID_HTML_TAGS.has(Component.toLowerCase())

      if (isVoidElement) {
        return <Component key={key} {...resolvedProps} />
      }

      // Resolve Children or Text (empty text does not shadow child nodes)
      let renderedChildren: React.ReactNode = null
      if (node.text !== undefined && node.text !== "") {
        renderedChildren = node.text
      } else if (node.children !== undefined && node.children !== null) {
        if (Array.isArray(node.children)) {
          renderedChildren = node.children.map((child, idx) =>
            renderNode(child, idx)
          )
        } else {
          renderedChildren = renderNode(node.children)
        }
      } else if (node.text !== undefined) {
        renderedChildren = node.text
      }

      return (
        <Component key={key} {...resolvedProps}>
          {renderedChildren}
        </Component>
      )
    },
    []
  )

  const schemaResetKey = React.useMemo(() => {
    try {
      return JSON.stringify(activeSchema)
    } catch {
      return undefined
    }
  }, [activeSchema])

  // 1. In-Place Visual Builder Mode
  if (isEditing) {
    return (
      <div
        data-iris-editing="true"
        className="flex h-full min-h-[540px] w-full flex-1 flex-col overflow-hidden"
      >
        <PageBuilder
          initialSchema={activeSchema}
          embedded={true}
          onExit={() => {
            setIsEditing(false)
            onCancelEdit?.()
          }}
          onSave={async (updated) => {
            if (onSaveSchema) {
              try {
                const result = await onSaveSchema(updated)
                if (result === false) return false
              } catch (err) {
                console.error("[IrisPage] Failed to save schema:", err)
                return false
              }
            }
            setActiveSchema(updated)
            setIsEditing(false)
            return true
          }}
        />
      </div>
    )
  }

  // 2. Pure AST Component Tree Mode with footer at bottom
  return (
    <IrisErrorBoundary
      fallbackNodeName={activeSchema.root?.type || "Page"}
      resetKey={schemaResetKey}
    >
      <div
        className={cn("relative flex min-h-full w-full flex-col", className)}
      >
        {/* Main Content Area */}
        <div className="w-full flex-1">
          {activeSchema.root ? renderNode(activeSchema.root) : null}
        </div>

        {/* Footer always at the bottom of the page */}
        {((showEditButton && canEditPage) || footerExtra) && (
          <footer className="mt-auto flex w-full shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/40 px-4 pt-10 pb-8 md:px-8">
            <div className="text-xs text-muted-foreground">
              {activeSchema.title && (
                <span className="font-semibold text-foreground/80">
                  {activeSchema.title}
                </span>
              )}
              {activeSchema.description && (
                <span className="hidden opacity-70 sm:inline">
                  {" "}
                  — {activeSchema.description}
                </span>
              )}
            </div>

            <div className="ms-auto flex items-center gap-2">
              {footerExtra}
              {showEditButton && canEditPage && (
                <span title={editDisabled ? editDisabledReason : undefined}>
                  <Button
                    size="xs"
                    variant="outline"
                    isDisabled={editDisabled || isAcquiringEdit}
                    aria-label={editDisabled ? editDisabledReason : undefined}
                    className="gap-1.5 text-xs text-muted-foreground shadow-xs hover:text-foreground"
                  onPress={async () => {
                    if (onEdit) {
                      onEdit()
                      return
                    }
                    if (editHref) {
                      window.location.href = editHref
                      return
                    }
                    if (beforeEdit) {
                      setIsAcquiringEdit(true)
                      try {
                        const allowed = await beforeEdit()
                        if (!allowed) return
                      } finally {
                        setIsAcquiringEdit(false)
                      }
                    }
                    setIsEditing(true)
                  }}
                >
                  <IconPencil className="size-3.5" />
                  <span>
                    {editDisabled && editDisabledReason
                      ? editDisabledReason
                      : "Edit Document"}
                  </span>
                </Button>
                </span>
              )}
            </div>
          </footer>
        )}
      </div>
    </IrisErrorBoundary>
  )
}
