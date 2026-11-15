import type { AlgoLanguageConfig, SyntaxDiagnostic } from "./types"

export const pythonConfig: AlgoLanguageConfig = {
  id: "python",
  label: "Python",
  aliases: ["py", "python"],
  keywords: new Set([
    "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
    "del", "elif", "else", "except", "finally", "for", "from", "global", "if",
    "import", "in", "is", "lambda", "match", "case", "nonlocal", "not", "or",
    "pass", "raise", "return", "try", "while", "with", "yield",
  ]),
  types: new Set([
    "int", "float", "str", "bool", "list", "dict", "set", "tuple", "bytes",
    "Any", "Optional", "Union", "List", "Dict", "Set", "Tuple",
  ]),
  builtins: new Set([
    "True", "False", "None", "print", "len", "range", "enumerate", "isinstance", "Exception",
  ]),
  lineComment: "#",
  usesIndentation: true,
  customCheck(code: string): SyntaxDiagnostic[] {
    const diags: SyntaxDiagnostic[] = []
    const lines = code.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i]!.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      if (
        /^(?:def|class|if|elif|else|for|while|try|except|finally|with)\b/.test(trimmed) &&
        !trimmed.endsWith(":") &&
        !trimmed.endsWith("\\")
      ) {
        diags.push({
          line: i + 1,
          column: lines[i]!.length,
          severity: "warning",
          message: "Python block header typically ends with ':'",
        })
      }
    }
    return diags
  },
}
