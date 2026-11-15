import type { AlgoLanguageConfig } from "./types"

export const jsonConfig: AlgoLanguageConfig = {
  id: "json",
  label: "JSON",
  aliases: ["json"],
  keywords: new Set(),
  types: new Set(),
  builtins: new Set(["true", "false", "null"]),
  lineComment: "",
}
