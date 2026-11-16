import type { AlgoLanguageConfig } from "./types"

export const typescriptConfig: AlgoLanguageConfig = {
  id: "typescript",
  label: "TypeScript / JS",
  aliases: ["ts", "tsx", "js", "jsx", "javascript"],
  keywords: new Set([
    "async", "await", "break", "case", "catch", "class", "const", "continue",
    "default", "delete", "do", "else", "enum", "export", "extends", "finally",
    "for", "from", "function", "if", "implements", "import", "in", "instanceof",
    "interface", "let", "new", "of", "private", "protected", "public", "readonly",
    "return", "static", "switch", "throw", "try", "type", "typeof", "var", "while",
  ]),
  types: new Set([
    "any", "bigint", "boolean", "never", "null", "number", "object", "Promise",
    "Record", "string", "symbol", "undefined", "unknown", "void", "Array", "Map", "Set",
  ]),
  builtins: new Set(["true", "false", "console", "JSON", "Math", "Error", "Object", "Date"]),
  lineComment: "//",
  blockComment: ["/*", "*/"],
  supportsBacktickString: true,
}
