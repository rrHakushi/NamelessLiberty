"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import type { AlgoNodeFieldsProps } from "./types"

export function SequenceNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Title</label>
        <Input
          value={node.title ?? ""}
          onChange={(e) => onChange({ ...node, title: e.target.value })}
          placeholder="Sequence title..."
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
          placeholder="Describe this sequence..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
