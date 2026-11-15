"use client"

import * as React from "react"
import type { IrisNode, IrisPageSchema } from "@/components/iris-page"
import type { NodePath } from "./types"
import { NodeInspectorContent, type InspectorTab } from "./node-inspector"

export interface NodePropertiesModalProps {
  isOpen: boolean
  schema: IrisPageSchema
  selectedPath: NodePath
  onClose: () => void
  onSelectPath?: (path: NodePath) => void
  onUpdateNode: (path: NodePath, updater: (node: IrisNode) => IrisNode) => void
  onUpdateMeta?: (updater: (schema: IrisPageSchema) => IrisPageSchema) => void
  onDeleteNode: (path: NodePath) => void
  onDuplicateNode?: (path: NodePath) => void
}

export function NodePropertiesModal({
  isOpen,
  schema,
  selectedPath,
  onClose,
  onSelectPath,
  onUpdateNode,
  onUpdateMeta,
  onDeleteNode,
  onDuplicateNode,
}: NodePropertiesModalProps) {
  const [activeTab, setActiveTab] = React.useState<InspectorTab>("content")

  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-4 backdrop-blur-md duration-150 fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-[min(var(--radius-4xl),28px)] border border-border/80 bg-card shadow-2xl duration-150 zoom-in-95"
      >
        <NodeInspectorContent
          schema={schema}
          selectedPath={selectedPath}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSelectPath={onSelectPath}
          onUpdateNode={onUpdateNode}
          onUpdateMeta={onUpdateMeta}
          onDeleteNode={(path) => {
            onDeleteNode(path)
            onClose()
          }}
          onDuplicateNode={onDuplicateNode}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
