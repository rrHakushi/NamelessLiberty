import type { AlgoLanguageConfig } from "./types"

export const dartConfig: AlgoLanguageConfig = {
  id: "dart",
  label: "Dart",
  aliases: ["dart"],
  keywords: new Set([
    "abstract", "as", "assert", "async", "await", "break", "case", "catch",
    "class", "const", "continue", "covariant", "default", "deferred", "do",
    "else", "enum", "export", "extends", "extension", "external", "factory",
    "final", "finally", "for", "get", "hide", "if", "implements", "import",
    "in", "interface", "is", "late", "library", "mixin", "new", "on", "operator",
    "part", "required", "rethrow", "return", "sealed", "set", "show", "static",
    "super", "switch", "sync", "this", "throw", "try", "typedef", "var", "while", "with", "yield",
  ]),
  types: new Set([
    "bool", "double", "dynamic", "int", "num", "Object", "String", "void",
    "Future", "Stream", "List", "Map", "Set", "Iterable", "Never",
  ]),
  builtins: new Set(["true", "false", "null", "print"]),
  lineComment: "//",
  blockComment: ["/*", "*/"],
}
