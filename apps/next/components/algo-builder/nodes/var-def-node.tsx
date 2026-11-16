"use client"

import * as React from "react"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlgoCodeInput } from "../algo-code-input"
import type { AlgoNode } from "../types"
import type { AlgoNodeFieldsProps } from "./types"

export function formatVarDefCode(node: AlgoNode): string {
  if (node.payload !== undefined) {
    return node.payload
  }
  if (node.variables && node.variables.length > 0) {
    return node.variables
      .map((v) => {
        const kw = v.mutable ? "let" : "const"
        const typePart = v.type ? `: ${v.type}` : ""
        const valPart = v.value !== undefined && v.value !== "" ? ` = ${v.value}` : ""
        return `${kw} ${v.name || "variable"}${typePart}${valPart}`
      })
      .join("\n")
  }
  if (
    node.varName !== undefined ||
    node.varType !== undefined ||
    node.varValue !== undefined ||
    node.varMutable !== undefined
  ) {
    const kw = node.varMutable ? "let" : "const"
    const typePart = node.varType ? `: ${node.varType}` : ""
    const valPart =
      node.varValue !== undefined && node.varValue !== "" ? ` = ${node.varValue}` : ""
    return `${kw} ${node.varName || "variable"}${typePart}${valPart}`
  }
  return ""
}

export function VarDefNodeFields({ node, onChange }: AlgoNodeFieldsProps) {
  const codeValue = formatVarDefCode(node)

  const handleCodeChange = (payload: string) => {
    onChange({
      ...node,
      payload,
      payloadLanguage: node.payloadLanguage ?? "typescript",
      variables: undefined,
      varName: undefined,
      varType: undefined,
      varValue: undefined,
      varMutable: undefined,
    })
  }

  return (
    <div className="space-y-3">
      <AlgoCodeInput
        label="Variables"
        value={codeValue}
        language={node.payloadLanguage ?? "typescript"}
        placeholder={"const url = new URL(urlStr)\nconst hostname = url.hostname"}
        minRows={2}
        onChange={handleCodeChange}
        onLanguageChange={(payloadLanguage) => onChange({ ...node, payloadLanguage })}
      />

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Description</label>
        <Textarea
          value={node.description ?? ""}
          onChange={(e) => onChange({ ...node, description: e.target.value })}
          placeholder="Describe these variables..."
          rows={2}
          className="text-xs"
        />
      </div>
    </div>
  )
}
