import type { AlgoLanguageConfig } from "./types"

export const rustConfig: AlgoLanguageConfig = {
  id: "rust",
  label: "Rust",
  aliases: ["rs", "rust"],
  keywords: new Set([
    "as", "async", "await", "break", "const", "continue", "crate", "dyn",
    "else", "enum", "extern", "fn", "for", "if", "impl", "in", "let", "loop",
    "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self",
    "static", "struct", "super", "trait", "type", "unsafe", "use", "where", "while",
  ]),
  types: new Set([
    "bool", "char", "f32", "f64", "i8", "i16", "i32", "i64", "i128", "isize",
    "str", "String", "u8", "u16", "u32", "u64", "u128", "usize",
    "Option", "Result", "Vec", "Box", "HashMap", "HashSet",
  ]),
  builtins: new Set(["true", "false", "Some", "None", "Ok", "Err", "println", "panic"]),
  lineComment: "//",
  blockComment: ["/*", "*/"],
}
