"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import type { AlgoNodeFieldsProps } from "./types"

export function ErrorNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<typeof node>) => onChange({ ...node, ...fields })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">Error Code</label>
          <Input
            value={node.code ?? ""}
            onChange={(e) => patch({ code: e.target.value })}
            placeholder="libraryDoesNotExist"
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">HTTP Status</label>
          <Input
            type="number"
            value={node.httpStatus ?? ""}
            onChange={(e) =>
              patch({ httpStatus: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="404"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Message</label>
        <Input
          value={node.message ?? ""}
          onChange={(e) => patch({ message: e.target.value })}
          placeholder="UuObject library does not exist."
          className="h-9 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Additional error context..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
