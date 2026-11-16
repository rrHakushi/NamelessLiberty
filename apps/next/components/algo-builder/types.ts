export type AlgoNodeKind =
  | "step"
  | "sequence"
  | "selection"
  | "iteration"
  | "warning"
  | "error"
  | "try_catch_finally"
  | "var_def"
  | "alg_call"
  | "return"

export type AlgoBranchKey =
  | "children"
  | "thenBranch"
  | "elseBranch"
  | "tryBlock"
  | "catchBlock"
  | "finallyBlock"

export interface AlgoSwitchCase {
  id: string
  label: string
  children: AlgoNode[]
}

export interface AlgoElseIfBranch {
  id: string
  condition: string
  children: AlgoNode[]
}

export interface AlgoVarItem {
  id: string
  mutable?: boolean
  name: string
  type?: string
  value?: string
  language?: string
}

export interface AlgoNode {
  id: string
  kind: AlgoNodeKind
  title?: string
  description?: string

  // Selection / Iteration / Error / Warning condition
  condition?: string

  // Selection
  selectionMode?: "if_else" | "switch"
  thenBranch?: AlgoNode[]
  elseIfBranches?: AlgoElseIfBranch[]
  elseBranch?: AlgoNode[]
  cases?: AlgoSwitchCase[]

  // Iteration
  loopType?: "for_each" | "for" | "while" | "do_while"
  iterator?: string
  collection?: string

  // Variable Definition
  variables?: AlgoVarItem[]
  varName?: string
  varType?: string
  varValue?: string
  varMutable?: boolean

  // Algorithm Call
  targetAlg?: string
  callArgs?: string
  assignTo?: string
  isAsync?: boolean

  // Error / Warning
  code?: string
  httpStatus?: number
  message?: string

  // Try / Catch / Finally
  catchVar?: string
  tryBlock?: AlgoNode[]
  catchBlock?: AlgoNode[]
  finallyBlock?: AlgoNode[]

  // Return
  returnValue?: string
  returnType?: string

  // Optional JSON / Code Payload
  payload?: string
  payloadLanguage?: string

  // Generic children (step, sequence, iteration)
  children?: AlgoNode[]
}

export interface AlgoDocument {
  id?: string
  title?: string
  description?: string
  steps: AlgoNode[]
}

export interface AlgoKindMeta {
  kind: AlgoNodeKind
  label: string
  shortLabel: string
  description: string
  iconName: string
  badgeClass: string
  isContainer: boolean
}

export const ALGO_KIND_META: Record<AlgoNodeKind, AlgoKindMeta> = {
  step: {
    kind: "step",
    label: "Step",
    shortLabel: "Step",
    description: "Atomic action or operation",
    iconName: "IconPoint",
    badgeClass: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    isContainer: false,
  },
  sequence: {
    kind: "sequence",
    label: "Sequence",
    shortLabel: "Sequence",
    description: "Ordered group of nested steps",
    iconName: "IconListNumbers",
    badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-800 dark:text-zinc-200",
    isContainer: true,
  },
  selection: {
    kind: "selection",
    label: "Selection (If / Switch)",
    shortLabel: "Selection",
    description: "Conditional branching (If/Else or Switch/Case)",
    iconName: "IconGitBranch",
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300",
    isContainer: true,
  },
  iteration: {
    kind: "iteration",
    label: "Iteration (Loop)",
    shortLabel: "Iteration",
    description: "For-each, for, while, or do-while loop",
    iconName: "IconRepeat",
    badgeClass: "border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300",
    isContainer: true,
  },
  warning: {
    kind: "warning",
    label: "Warning",
    shortLabel: "Warning",
    description: "Non-fatal warning condition and payload",
    iconName: "IconAlertTriangle",
    badgeClass: "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    isContainer: false,
  },
  error: {
    kind: "error",
    label: "Error",
    shortLabel: "Error",
    description: "Fatal error throw with code, status, and payload",
    iconName: "IconAlertCircle",
    badgeClass: "border-rose-500/50 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    isContainer: false,
  },
  try_catch_finally: {
    kind: "try_catch_finally",
    label: "Try / Catch / Finally",
    shortLabel: "Try/Catch",
    description: "Exception handling block with catch & finally",
    iconName: "IconShieldCheck",
    badgeClass: "border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-300",
    isContainer: true,
  },
  var_def: {
    kind: "var_def",
    label: "Variable Definition",
    shortLabel: "Var Def",
    description: "Declare and initialize a variable",
    iconName: "IconVariable",
    badgeClass: "border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    isContainer: false,
  },
  alg_call: {
    kind: "alg_call",
    label: "Algorithm Call",
    shortLabel: "Alg Call",
    description: "Invoke another algorithm, DAO, or service method",
    iconName: "IconFunction",
    badgeClass: "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    isContainer: false,
  },
  return: {
    kind: "return",
    label: "Return",
    shortLabel: "Return",
    description: "Return result or HTTP response",
    iconName: "IconCornerDownLeft",
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    isContainer: false,
  },
}

export const ALL_ALGO_KINDS: AlgoNodeKind[] = [
  "step",
  "sequence",
  "selection",
  "iteration",
  "var_def",
  "alg_call",
  "try_catch_finally",
  "warning",
  "error",
  "return",
]

export function generateAlgoId(prefix = "algo"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function createDefaultAlgoNode(kind: AlgoNodeKind): AlgoNode {
  const id = generateAlgoId(kind)
  switch (kind) {
    case "step":
      return { id, kind, title: "Perform operation", description: "" }
    case "sequence":
      return { id, kind, title: "New sequence", description: "", children: [] }
    case "selection":
      return {
        id,
        kind,
        title: "Check condition",
        selectionMode: "if_else",
        condition: "dtoIn != null",
        thenBranch: [],
        elseBranch: [],
      }
    case "iteration":
      return {
        id,
        kind,
        title: "Iterate items",
        loopType: "for_each",
        iterator: "item",
        collection: "dtoIn.items",
        children: [],
      }
    case "warning":
      return {
        id,
        kind,
        condition: "Some optional items were not found",
        code: "partialItemsMissing",
        message: "One or more items do not exist.",
        payload: '{\n  "missingIds": []\n}',
        payloadLanguage: "json",
      }
    case "error":
      return {
        id,
        kind,
        condition: "Resource is not found",
        code: "resourceDoesNotExist",
        httpStatus: 404,
        message: "Requested resource does not exist.",
        payload: '{\n  "id": "$.id"\n}',
        payloadLanguage: "json",
      }
    case "try_catch_finally":
      return {
        id,
        kind,
        title: "Execute protected block",
        catchVar: "err",
        tryBlock: [],
        catchBlock: [],
        finallyBlock: [],
      }
    case "var_def":
      return {
        id,
        kind,
        varMutable: false,
        varName: "result",
        varType: "Record<string, unknown>",
        varValue: "{}",
        description: "",
      }
    case "alg_call":
      return {
        id,
        kind,
        isAsync: true,
        assignTo: "entity",
        targetAlg: "entityDao.getById",
        callArgs: "dtoIn.id",
        description: "",
      }
    case "return":
      return {
        id,
        kind,
        title: "Return response",
        returnValue: "{ success: true, data: entity }",
        returnType: "ResponseDto",
      }
  }
}
