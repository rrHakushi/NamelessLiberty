import type { AlgoLanguageConfig } from "./types"

export const javaConfig: AlgoLanguageConfig = {
  id: "java",
  label: "Java",
  aliases: ["java"],
  keywords: new Set([
    "abstract", "assert", "break", "case", "catch", "class", "continue", "default",
    "do", "else", "enum", "extends", "final", "finally", "for", "if", "implements",
    "import", "instanceof", "interface", "new", "package", "private", "protected",
    "public", "record", "return", "sealed", "static", "super", "switch", "synchronized",
    "this", "throw", "throws", "try", "var", "while",
  ]),
  types: new Set([
    "boolean", "byte", "char", "double", "float", "int", "long", "short", "void",
    "String", "Integer", "Long", "Boolean", "List", "Map", "Set", "Optional", "Object",
  ]),
  builtins: new Set(["true", "false", "null", "System", "Math", "Arrays", "Collections"]),
  lineComment: "//",
  blockComment: ["/*", "*/"],
}
