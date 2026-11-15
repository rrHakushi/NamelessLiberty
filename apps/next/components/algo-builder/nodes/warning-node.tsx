"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlgoCodeInput } from "../algo-code-input"
import type { AlgoNodeFieldsProps } from "./types"

export function WarningNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<typeof node>) => onChange({ ...node, ...fields })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">Trigger Condition (If)</label>
          <Input
            value={node.condition ?? ""}
            onChange={(e) => patch({ condition: e.target.value })}
            placeholder="Some optional items were not found"
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Warning Code</label>
          <Input
            value={node.code ?? ""}
            onChange={(e) => patch({ code: e.target.value })}
            placeholder="partialItemsMissing"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Message</label>
        <Input
          value={node.message ?? ""}
          onChange={(e) => patch({ message: e.target.value })}
          placeholder="One or more items do not exist."
          className="h-9 text-xs"
        />
      </div>

      <AlgoCodeInput
        label="Warning Context / Payload"
        value={node.payload ?? ""}
        language={node.payloadLanguage ?? "json"}
        placeholder={'{\n  "missingIds": []\n}'}
        minRows={3}
        onChange={(payload) => patch({ payload })}
        onLanguageChange={(payloadLanguage) => patch({ payloadLanguage })}
      />

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Additional warning notes..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
