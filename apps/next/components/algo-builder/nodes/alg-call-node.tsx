"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlgoCodeInput } from "../algo-code-input"
import type { AlgoNodeFieldsProps } from "./types"

export function AlgCallNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<typeof node>) => onChange({ ...node, ...fields })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Title</label>
          <Input
            value={node.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Call service..."
            className="h-9 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Assign Result To</label>
          <Input
            value={node.assignTo ?? ""}
            onChange={(e) => patch({ assignTo: e.target.value })}
            placeholder="entity"
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Target Algorithm / URI</label>
          <Input
            value={node.targetAlg ?? ""}
            onChange={(e) => patch({ targetAlg: e.target.value })}
            placeholder="libraryDao.getByAwid"
            className="h-9 font-mono text-xs"
          />
        </div>
      </div>

      <AlgoCodeInput
        label="Input / Arguments"
        value={node.callArgs ?? ""}
        language={node.payloadLanguage ?? "typescript"}
        placeholder="dtoIn.awid"
        minRows={2}
        onChange={(callArgs) => patch({ callArgs })}
        onLanguageChange={(payloadLanguage) => patch({ payloadLanguage })}
      />

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Describe what this call does..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
