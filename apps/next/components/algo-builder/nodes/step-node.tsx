"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import type { AlgoNodeFieldsProps } from "./types"

export function StepNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Title</label>
        <Input
          value={node.title ?? ""}
          onChange={(e) => onChange({ ...node, title: e.target.value })}
          placeholder="Step title..."
          className="h-9 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">
          Description (wrap identifiers in `backticks` for inline badges)
        </label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => onChange({ ...node, description: e.target.value })}
          placeholder="Describe what this step performs..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
