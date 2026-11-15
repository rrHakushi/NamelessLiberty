"use client"

import * as React from "react"
import { ALGO_NODE_FIELD_COMPONENTS } from "./nodes"
import type { AlgoNode } from "./types"

interface AlgoNodeEditorProps {
  node: AlgoNode
  onChange: (updated: AlgoNode) => void
}

export function AlgoNodeEditor({ node, onChange }: AlgoNodeEditorProps) {
  const FieldsComponent = ALGO_NODE_FIELD_COMPONENTS[node.kind]

  return (
    <div className="mt-3 rounded-xl border border-border/80 bg-muted/30 p-3 text-start">
      <FieldsComponent node={node} onChange={onChange} />
    </div>
  )
}
