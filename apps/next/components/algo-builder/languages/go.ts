import type { AlgoLanguageConfig } from "./types"

export const goConfig: AlgoLanguageConfig = {
  id: "go",
  label: "Go",
  aliases: ["golang"],
  keywords: new Set([
    "break", "case", "chan", "const", "continue", "default", "defer", "else",
    "fallthrough", "for", "func", "go", "goto", "if", "import", "interface",
    "map", "package", "range", "return", "select", "struct", "switch", "type", "var",
  ]),
  types: new Set([
    "any", "bool", "byte", "comparable", "error", "float32", "float64",
    "int", "int8", "int16", "int32", "int64", "rune", "string",
    "uint", "uint8", "uint16", "uint32", "uint64", "uintptr",
  ]),
  builtins: new Set([
    "true", "false", "nil", "iota", "append", "cap", "close", "copy", "delete",
    "len", "make", "new", "panic", "recover", "fmt",
  ]),
  lineComment: "//",
  blockComment: ["/*", "*/"],
  supportsBacktickString: true,
}
