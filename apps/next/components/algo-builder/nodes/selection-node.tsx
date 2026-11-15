"use client"

import * as React from "react"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlgoCodeInput } from "../algo-code-input"
import { generateAlgoId } from "../types"
import type { AlgoNodeFieldsProps } from "./types"

export function SelectionNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const patch = (fields: Partial<typeof node>) => onChange({ ...node, ...fields })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-muted-foreground">Branch Mode</label>
          <select
            value={node.selectionMode ?? "if_else"}
            onChange={(e) => {
              const mode = e.target.value as "if_else" | "switch"
              patch({
                selectionMode: mode,
                cases:
                  mode === "switch" && (!node.cases || node.cases.length === 0)
                    ? [{ id: generateAlgoId("case"), label: "case A", children: [] }]
                    : node.cases,
              })
            }}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
          >
            <option value="if_else">If / Else</option>
            <option value="switch">Switch / Case</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-[11px] font-medium text-muted-foreground">Title</label>
          <Input
            value={node.title ?? ""}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Selection title..."
            className="h-9 text-xs"
          />
        </div>
      </div>

      <AlgoCodeInput
        label={node.selectionMode === "switch" ? "Switch Expression" : "If Condition"}
        value={node.condition ?? ""}
        language={node.payloadLanguage ?? "typescript"}
        placeholder="user.role === 'ADMIN'"
        minRows={2}
        onChange={(condition) => patch({ condition })}
        onLanguageChange={(payloadLanguage) => patch({ payloadLanguage })}
      />

      {node.selectionMode === "switch" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Switch Cases</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
              onClick={() =>
                patch({
                  cases: [
                    ...(node.cases ?? []),
                    {
                      id: generateAlgoId("case"),
                      label: `case ${(node.cases?.length ?? 0) + 1}`,
                      children: [],
                    },
                  ],
                })
              }
            >
              <IconPlus className="me-1 size-3.5" />
              Add Case
            </Button>
          </div>
          <div className="space-y-1.5">
            {(node.cases ?? []).map((c, idx) => (
              <div key={c.id} className="flex items-center gap-2">
                <Input
                  value={c.label}
                  onChange={(e) => {
                    const nextCases = [...(node.cases ?? [])]
                    nextCases[idx] = { ...c, label: e.target.value }
                    patch({ cases: nextCases })
                  }}
                  className="h-8 font-mono text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() =>
                    patch({ cases: (node.cases ?? []).filter((item) => item.id !== c.id) })
                  }
                >
                  <IconTrash className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Describe branching logic..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
