"use client"

import * as React from "react"
import type { IrisNode, IrisPageSchema } from "@/components/iris-page"
import type { NodePath } from "./types"
import { NodeInspectorContent, type InspectorTab } from "./node-inspector"

export interface PropertiesPanelProps {
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
}

export function PropertiesPanel({
  schema,
  selectedPath,
  activeTab,
  onTabChange,
  onSelectPath,
  onUpdateNode,
  onUpdateMeta,
  onDeleteNode,
  onDuplicateNode,
  onClose,
}: PropertiesPanelProps) {
  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-s border-border/60 bg-card/80 backdrop-blur-md xl:w-96">
      <NodeInspectorContent
        schema={schema}
        selectedPath={selectedPath}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onSelectPath={onSelectPath}
        onUpdateNode={onUpdateNode}
        onUpdateMeta={onUpdateMeta}
        onDeleteNode={onDeleteNode}
        onDuplicateNode={onDuplicateNode}
        onClose={onClose}
        compact
      />
    </aside>
  )
}
