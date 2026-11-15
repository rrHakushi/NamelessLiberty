"use client"

import * as React from "react"
import { IconAlertTriangle, IconCheck, IconCode } from "@tabler/icons-react"
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@workspace/ui/components/code-block"
import { Badge } from "@workspace/ui/components/badge"
import {
  ALGO_LANGUAGE_CONFIGS,
  checkAlgoSyntax,
  getAlgoLanguageConfig,
  highlightAlgoLine,
  type AlgoLanguageId,
  type AlgoTokenKind,
} from "./languages"

const TOKEN_CLASSES: Record<AlgoTokenKind, string> = {
  keyword: "text-violet-600 dark:text-violet-400 font-medium",
  type: "text-cyan-700 dark:text-cyan-300",
  builtin: "text-amber-600 dark:text-amber-300",
  string: "text-emerald-700 dark:text-emerald-300",
  number: "text-orange-600 dark:text-orange-300",
  comment: "text-muted-foreground italic",
  operator: "text-sky-600 dark:text-sky-400",
  punctuation: "text-muted-foreground",
  plain: "text-foreground",
}

function HighlightedLines({ code, language }: { code: string; language?: string }) {
  const lines = (code || "").split("\n")
  return (
    <>
      {lines.map((line, lIdx) => {
        const tokens = highlightAlgoLine(line, language)
        return (
          <CodeBlockLine key={lIdx}>
            {tokens.length === 0
              ? ""
              : tokens.map((tok, tIdx) => (
                  <span key={tIdx} className={TOKEN_CLASSES[tok.kind]}>
                    {tok.value}
                  </span>
                ))}
          </CodeBlockLine>
        )
      })}
    </>
  )
}

export interface AlgoCodeViewProps {
  code: string
  language?: string
  title?: string
  showDiagnostics?: boolean
  size?: "default" | "sm"
}

export function AlgoCodeView({
  code,
  language = "typescript",
  title,
  showDiagnostics = false,
  size = "sm",
}: AlgoCodeViewProps) {
  const cfg = getAlgoLanguageConfig(language)
  const diagnostics = React.useMemo(
    () => (showDiagnostics ? checkAlgoSyntax(code, cfg.id) : []),
    [code, cfg.id, showDiagnostics]
  )
  const hasError = diagnostics.some((d) => d.severity === "error")

  return (
    <CodeBlock size={size} variant={hasError ? "destructive" : "default"}>
      {title && (
        <CodeBlockHeader>
          <CodeBlockTitle>
            <IconCode className="size-3.5" />
            <span>{title}</span>
          </CodeBlockTitle>
        </CodeBlockHeader>
      )}
      <CodeBlockActions>
        <CodeBlockCopyButton value={code} />
      </CodeBlockActions>
      <CodeBlockContent lineNumbers>
        <HighlightedLines code={code} language={cfg.id} />
      </CodeBlockContent>
      {diagnostics.length > 0 && (
        <CodeBlockFooter className="flex-col items-start gap-1 text-xs">
          {diagnostics.map((d, idx) => (
            <div key={idx} className="flex items-center gap-1.5 font-mono">
              <IconAlertTriangle className="size-3.5 shrink-0" />
              <span>
                L{d.line}:{d.column} — {d.message}
              </span>
            </div>
          ))}
        </CodeBlockFooter>
      )}
    </CodeBlock>
  )
}

export interface AlgoCodeInputProps {
  label?: string
  value: string
  language?: string
  placeholder?: string
  minRows?: number
  onChange: (value: string) => void
  onLanguageChange?: (language: AlgoLanguageId) => void
}

export function AlgoCodeInput({
  label = "Code",
  value,
  language = "typescript",
  placeholder = "// Enter code...",
  minRows = 3,
  onChange,
  onLanguageChange,
}: AlgoCodeInputProps) {
  const cfg = getAlgoLanguageConfig(language)
  const diagnostics = React.useMemo(
    () => checkAlgoSyntax(value, cfg.id),
    [value, cfg.id]
  )
  const hasError = diagnostics.some((d) => d.severity === "error")
  const hasWarning = diagnostics.some((d) => d.severity === "warning")

  const lineCount = Math.max(minRows, (value || "").split("\n").length)
  const minHeightPx = lineCount * 20 + 20

  return (
    <CodeBlock size="sm" variant={hasError ? "destructive" : "default"}>
      <CodeBlockHeader className="justify-between">
        <CodeBlockTitle className="flex items-center gap-2">
          <IconCode className="size-3.5 shrink-0" />
          <span>{label}</span>
          {value.trim() && (
            <Badge
              variant="outline"
              className={
                hasError
                  ? "border-destructive/50 bg-destructive/10 text-destructive font-mono text-[10px]"
                  : hasWarning
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono text-[10px]"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]"
              }
            >
              {hasError || hasWarning ? (
                <>
                  <IconAlertTriangle className="me-1 size-3" />
                  {diagnostics.length} {diagnostics.length === 1 ? "issue" : "issues"}
                </>
              ) : (
                <>
                  <IconCheck className="me-1 size-3" />
                  Syntax OK
                </>
              )}
            </Badge>
          )}
        </CodeBlockTitle>

        <CodeBlockActions>
          {onLanguageChange && (
            <select
              value={cfg.id}
              onChange={(e) => onLanguageChange(e.target.value as AlgoLanguageId)}
              aria-label="Code language"
              className="h-6 rounded-md border border-border bg-background px-1.5 font-mono text-[11px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ALGO_LANGUAGE_CONFIGS.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          )}
          <CodeBlockCopyButton value={value} />
        </CodeBlockActions>
      </CodeBlockHeader>

      <div className="relative w-full overflow-hidden" style={{ minHeight: `${minHeightPx}px` }}>
        <CodeBlockContent
          lineNumbers
          wrap
          className="pointer-events-none select-none overflow-hidden px-3 pt-2 pb-3 text-xs leading-5 opacity-95 group-data-[size=sm]/code-block:group-has-data-[slot=code-block-header]/code-block:pt-2"
        >
          <HighlightedLines code={value || " "} language={cfg.id} />
        </CodeBlockContent>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="absolute inset-0 h-full w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent pt-2 pb-3 pe-3 ps-12 font-mono text-xs leading-5 text-transparent caret-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {diagnostics.length > 0 && (
        <CodeBlockFooter className="flex-col items-start gap-1 border-t border-border/50 pt-2 text-[11px]">
          {diagnostics.map((d, idx) => (
            <div
              key={idx}
              className={
                d.severity === "error"
                  ? "flex items-center gap-1.5 font-mono text-destructive"
                  : "flex items-center gap-1.5 font-mono text-amber-600 dark:text-amber-300"
              }
            >
              <IconAlertTriangle className="size-3 shrink-0" />
              <span>
                L{d.line}:{d.column} — {d.message}
              </span>
            </div>
          ))}
        </CodeBlockFooter>
      )}
    </CodeBlock>
  )
}
