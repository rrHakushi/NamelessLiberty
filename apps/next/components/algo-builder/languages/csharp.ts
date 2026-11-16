import type { AlgoLanguageConfig } from "./types"

export const csharpConfig: AlgoLanguageConfig = {
  id: "csharp",
  label: "C#",
  aliases: ["cs", "c#", "csharp"],
  keywords: new Set([
    "abstract", "as", "async", "await", "base", "break", "case", "catch", "checked",
    "class", "const", "continue", "default", "delegate", "do", "else", "enum",
    "event", "explicit", "extern", "finally", "fixed", "for", "foreach", "goto",
    "if", "implicit", "in", "interface", "internal", "is", "lock", "namespace",
    "new", "operator", "out", "override", "params", "private", "protected", "public",
    "readonly", "record", "ref", "return", "sealed", "sizeof", "stackalloc", "static",
    "struct", "switch", "this", "throw", "try", "typeof", "unchecked", "unsafe",
    "using", "var", "virtual", "volatile", "while",
  ]),
  types: new Set([
    "bool", "byte", "char", "decimal", "double", "dynamic", "float", "int", "long",
    "object", "sbyte", "short", "string", "uint", "ulong", "ushort", "void",
    "Task", "List", "Dictionary", "IEnumerable", "Exception",
  ]),
  builtins: new Set(["true", "false", "null", "Console", "Math", "nameof"]),
  lineComment: "//",
  blockComment: ["/*", "*/"],
}
