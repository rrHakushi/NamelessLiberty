"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlgoCodeInput } from "../algo-code-input"
import type { AlgoNode } from "../types"
import type { AlgoNodeFieldsProps } from "./types"

export function IterationNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<AlgoNode>) => onChange({ ...node, ...fields })
  const isForEach = node.loopType === "for_each" || !node.loopType

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Loop Type</label>
          <select
            value={node.loopType ?? "for_each"}
            onChange={(e) => patch({ loopType: e.target.value as AlgoNode["loopType"] })}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
          >
            <option value="for_each">For Each</option>
            <option value="for">For</option>
            <option value="while">While</option>
            <option value="do_while">Do While</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">Title</label>
          <Input
            value={node.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Iterate items..."
            className="h-9 text-xs"
          />
        </div>
      </div>

      {isForEach ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Iterator Var</label>
            <Input
              value={node.iterator ?? ""}
              onChange={(e) => patch({ iterator: e.target.value })}
              placeholder="author"
              className="h-9 font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-muted-foreground">Collection</label>
            <Input
              value={node.collection ?? ""}
              onChange={(e) => patch({ collection: e.target.value })}
              placeholder="dtoIn.authorOidList"
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>
      ) : (
        <AlgoCodeInput
          label="Loop Condition"
          value={node.condition ?? ""}
          language={node.payloadLanguage ?? "typescript"}
          placeholder="i < items.length"
          minRows={2}
          onChange={(condition) => patch({ condition })}
          onLanguageChange={(payloadLanguage) => patch({ payloadLanguage })}
        />
      )}

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Describe loop behavior..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
