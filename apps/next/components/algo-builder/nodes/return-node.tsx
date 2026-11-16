"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlgoCodeInput } from "../algo-code-input"
import type { AlgoNodeFieldsProps } from "./types"

export function ReturnNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<typeof node>) => onChange({ ...node, ...fields })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Title</label>
          <Input
            value={node.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Return response..."
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Return Type</label>
          <Input
            value={node.returnType ?? ""}
            onChange={(e) => patch({ returnType: e.target.value })}
            placeholder="DtoOut"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>

      <AlgoCodeInput
        label="Return Expression / Value"
        value={node.returnValue ?? ""}
        language={node.payloadLanguage ?? "typescript"}
        placeholder="{ success: true, data: entity }"
        minRows={2}
        onChange={(returnValue) => patch({ returnValue })}
        onLanguageChange={(payloadLanguage) => patch({ payloadLanguage })}
      />

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Describe returned payload..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
