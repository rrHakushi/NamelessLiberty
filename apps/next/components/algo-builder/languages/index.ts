import { checkAlgoSyntaxWithConfig, tokenizeAlgoLine } from "./engine"
import { csharpConfig } from "./csharp"
import { dartConfig } from "./dart"
import { goConfig } from "./go"
import { javaConfig } from "./java"
import { jsonConfig } from "./json"
import { pythonConfig } from "./python"
import { rustConfig } from "./rust"
import { typescriptConfig } from "./typescript"
import type { AlgoLanguageConfig, AlgoLanguageId, AlgoToken, SyntaxDiagnostic } from "./types"

export const ALGO_LANGUAGE_CONFIGS: AlgoLanguageConfig[] = [
  typescriptConfig,
  javaConfig,
  pythonConfig,
  goConfig,
  dartConfig,
  rustConfig,
  csharpConfig,
  jsonConfig,
]

export function getAlgoLanguageConfig(lang?: string): AlgoLanguageConfig {
  const normalized = (lang ?? "typescript").trim().toLowerCase()
  return (
    ALGO_LANGUAGE_CONFIGS.find(
      (cfg) => cfg.id === normalized || cfg.aliases.includes(normalized)
    ) ?? typescriptConfig
  )
}

export function highlightAlgoLine(line: string, lang?: string): AlgoToken[] {
  return tokenizeAlgoLine(line, getAlgoLanguageConfig(lang))
}

export function checkAlgoSyntax(code: string, lang?: string): SyntaxDiagnostic[] {
  return checkAlgoSyntaxWithConfig(code, getAlgoLanguageConfig(lang))
}

export type { AlgoLanguageConfig, AlgoLanguageId, AlgoToken, AlgoTokenKind, SyntaxDiagnostic } from "./types"
