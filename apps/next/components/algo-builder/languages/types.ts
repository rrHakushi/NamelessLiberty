export type AlgoLanguageId =
  | "typescript"
  | "java"
  | "python"
  | "go"
  | "dart"
  | "rust"
  | "csharp"
  | "json"

export type AlgoTokenKind =
  | "keyword"
  | "type"
  | "builtin"
  | "string"
  | "number"
  | "comment"
  | "operator"
  | "punctuation"
  | "plain"

export interface AlgoToken {
  kind: AlgoTokenKind
  value: string
}

export interface SyntaxDiagnostic {
  line: number
  column: number
  severity: "error" | "warning"
  message: string
}

export interface AlgoLanguageConfig {
  id: AlgoLanguageId
  label: string
  aliases: string[]
  keywords: Set<string>
  types: Set<string>
  builtins: Set<string>
  lineComment: string
  blockComment?: [string, string]
  supportsBacktickString?: boolean
  usesIndentation?: boolean
  customCheck?: (code: string) => SyntaxDiagnostic[]
}
