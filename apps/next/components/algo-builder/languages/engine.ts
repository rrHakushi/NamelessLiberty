import type { AlgoLanguageConfig, AlgoToken, SyntaxDiagnostic } from "./types"

export function tokenizeAlgoLine(line: string, config: AlgoLanguageConfig): AlgoToken[] {
  const tokens: AlgoToken[] = []
  let i = 0

  while (i < line.length) {
    // Line comment
    if (config.lineComment && line.startsWith(config.lineComment, i)) {
      tokens.push({ kind: "comment", value: line.slice(i) })
      break
    }

    // Block comment inline
    if (config.blockComment && line.startsWith(config.blockComment[0], i)) {
      const endIdx = line.indexOf(config.blockComment[1], i + config.blockComment[0].length)
      const end = endIdx === -1 ? line.length : endIdx + config.blockComment[1].length
      tokens.push({ kind: "comment", value: line.slice(i, end) })
      i = end
      continue
    }

    // Template literals with ${...} interpolation
    const ch = line[i]!
    if (ch === "`" && config.supportsBacktickString) {
      let j = i + 1
      let segStart = i
      while (j < line.length) {
        if (line[j] === "\\" && j + 1 < line.length) {
          j += 2
          continue
        }
        if (line[j] === "$" && line[j + 1] === "{") {
          if (j > segStart) {
            tokens.push({ kind: "string", value: line.slice(segStart, j) })
          }
          tokens.push({ kind: "punctuation", value: "${" })
          let k = j + 2
          let depth = 1
          while (k < line.length && depth > 0) {
            const c = line[k]!
            if (c === '"' || c === "'" || c === "`") {
              const q = c
              k++
              while (k < line.length) {
                if (line[k] === "\\" && k + 1 < line.length) {
                  k += 2
                  continue
                }
                if (line[k] === q) {
                  k++
                  break
                }
                k++
              }
              continue
            }
            if (c === "{") depth++
            else if (c === "}") {
              depth--
              if (depth === 0) break
            }
            k++
          }
          const inner = line.slice(j + 2, k)
          if (inner) {
            tokens.push(...tokenizeAlgoLine(inner, config))
          }
          if (k < line.length && line[k] === "}") {
            tokens.push({ kind: "punctuation", value: "}" })
            j = k + 1
            segStart = j
            continue
          }
          j = k
          segStart = j
          break
        }
        if (line[j] === "`") {
          j++
          tokens.push({ kind: "string", value: line.slice(segStart, j) })
          segStart = j
          break
        }
        j++
      }
      if (segStart < j) {
        tokens.push({ kind: "string", value: line.slice(segStart, j) })
      }
      i = j
      continue
    }

    // Strings: ", '
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < line.length) {
        if (line[j] === "\\" && j + 1 < line.length) {
          j += 2
          continue
        }
        if (line[j] === ch) {
          j++
          break
        }
        j++
      }
      tokens.push({ kind: "string", value: line.slice(i, j) })
      i = j
      continue
    }

    // Numbers
    if (/[0-9]/.test(ch)) {
      const match = line.slice(i).match(/^(?:0x[0-9a-fA-F_]+|0b[01_]+|[0-9][0-9_]*(?:\.[0-9_]+)?)/)
      if (match) {
        tokens.push({ kind: "number", value: match[0] })
        i += match[0].length
        continue
      }
    }

    // Identifiers / Keywords / Types / Builtins
    if (/[A-Za-z_$]/.test(ch)) {
      const match = line.slice(i).match(/^[A-Za-z_$][A-Za-z0-9_$]*/)
      if (match) {
        const word = match[0]
        const kind = config.keywords.has(word)
          ? "keyword"
          : config.types.has(word)
            ? "type"
            : config.builtins.has(word)
              ? "builtin"
              : "plain"
        tokens.push({ kind, value: word })
        i += word.length
        continue
      }
    }

    // Operators
    if (/[=+\-*/%<>!&|^~?:]/.test(ch)) {
      const match = line.slice(i).match(/^(?:===|!==|==|!=|<=|>=|=>|->|&&|\|\||\?\?|\+\+|--|[=+\-*/%<>!&|^~?:])/)
      if (match) {
        tokens.push({ kind: "operator", value: match[0] })
        i += match[0].length
        continue
      }
    }

    // Punctuation
    if (/[()[\]{}.,;]/.test(ch)) {
      tokens.push({ kind: "punctuation", value: ch })
      i++
      continue
    }

    // Whitespace / other
    const ws = line.slice(i).match(/^\s+/)
    if (ws) {
      tokens.push({ kind: "plain", value: ws[0] })
      i += ws[0].length
    } else {
      tokens.push({ kind: "plain", value: ch })
      i++
    }
  }

  return tokens
}

export function checkAlgoSyntaxWithConfig(
  code: string,
  config: AlgoLanguageConfig
): SyntaxDiagnostic[] {
  const diagnostics: SyntaxDiagnostic[] = []
  if (!code.trim()) return diagnostics

  if (config.id === "json") {
    try {
      JSON.parse(code)
    } catch (err) {
      diagnostics.push({
        line: 1,
        column: 1,
        severity: "error",
        message: err instanceof Error ? err.message : "Invalid JSON",
      })
    }
    return diagnostics
  }

  const stack: Array<{ ch: string; line: number; col: number }> = []
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" }
  const closingToOpen: Record<string, string> = { ")": "(", "]": "[", "}": "{" }

  let inBlockComment = false
  let blockStartLine = 1
  const lines = code.split("\n")

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx]!
    const lineNum = lIdx + 1
    let inString: string | null = null
    let stringStartCol = 1

    for (let c = 0; c < line.length; c++) {
      const ch = line[c]!
      const col = c + 1

      if (inBlockComment) {
        if (config.blockComment && line.startsWith(config.blockComment[1], c)) {
          inBlockComment = false
          c += config.blockComment[1].length - 1
        }
        continue
      }

      if (inString) {
        if (ch === "\\" && c + 1 < line.length) {
          c++
          continue
        }
        if (ch === inString) {
          inString = null
        }
        continue
      }

      if (config.lineComment && line.startsWith(config.lineComment, c)) {
        break
      }

      if (config.blockComment && line.startsWith(config.blockComment[0], c)) {
        inBlockComment = true
        blockStartLine = lineNum
        c += config.blockComment[0].length - 1
        continue
      }

      if (ch === '"' || ch === "'" || (ch === "`" && config.supportsBacktickString)) {
        inString = ch
        stringStartCol = col
        continue
      }

      if (pairs[ch]) {
        stack.push({ ch, line: lineNum, col })
      } else if (closingToOpen[ch]) {
        const expectedOpen = closingToOpen[ch]
        const top = stack[stack.length - 1]
        if (!top || top.ch !== expectedOpen) {
          diagnostics.push({
            line: lineNum,
            column: col,
            severity: "error",
            message: `Unexpected closing '${ch}'`,
          })
        } else {
          stack.pop()
        }
      }
    }

    if (inString && inString !== "`") {
      diagnostics.push({
        line: lineNum,
        column: stringStartCol,
        severity: "error",
        message: `Unterminated string literal (${inString})`,
      })
    }
  }

  if (inBlockComment) {
    diagnostics.push({
      line: blockStartLine,
      column: 1,
      severity: "error",
      message: "Unterminated block comment",
    })
  }

  for (const unclosed of stack) {
    diagnostics.push({
      line: unclosed.line,
      column: unclosed.col,
      severity: "error",
      message: `Unclosed '${unclosed.ch}' (expected '${pairs[unclosed.ch]}')`,
    })
  }

  if (config.customCheck) {
    diagnostics.push(...config.customCheck(code))
  }

  return diagnostics
}
