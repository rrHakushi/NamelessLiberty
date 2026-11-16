"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import type { AlgoNodeFieldsProps } from "./types"

export function TryCatchFinallyNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<typeof node>) => onChange({ ...node, ...fields })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">Title</label>
          <Input
            value={node.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Execute protected block..."
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Catch Variable</label>
          <Input
            value={node.catchVar ?? "err"}
            onChange={(e) => patch({ catchVar: e.target.value })}
            placeholder="err"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Describe exception handling..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
