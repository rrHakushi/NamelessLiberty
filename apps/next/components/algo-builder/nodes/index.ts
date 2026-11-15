import type * as React from "react"
import type { AlgoNodeKind } from "../types"
import { AlgCallNodeFields } from "./alg-call-node"
import { ErrorNodeFields } from "./error-node"
import { IterationNodeFields } from "./iteration-node"
import { ReturnNodeFields } from "./return-node"
import { SelectionNodeFields } from "./selection-node"
import { SequenceNodeFields } from "./sequence-node"
import { StepNodeFields } from "./step-node"
import { TryCatchFinallyNodeFields } from "./try-catch-finally-node"
import { VarDefNodeFields } from "./var-def-node"
import { WarningNodeFields } from "./warning-node"
import type { AlgoNodeFieldsProps } from "./types"

export const ALGO_NODE_FIELD_COMPONENTS: Record<
  AlgoNodeKind,
  React.ComponentType<AlgoNodeFieldsProps>
> = {
  step: StepNodeFields,
  sequence: SequenceNodeFields,
  selection: SelectionNodeFields,
  iteration: IterationNodeFields,
  warning: WarningNodeFields,
  error: ErrorNodeFields,
  try_catch_finally: TryCatchFinallyNodeFields,
  var_def: VarDefNodeFields,
  alg_call: AlgCallNodeFields,
  return: ReturnNodeFields,
}

export {
  AlgCallNodeFields,
  ErrorNodeFields,
  IterationNodeFields,
  ReturnNodeFields,
  SelectionNodeFields,
  SequenceNodeFields,
  StepNodeFields,
  TryCatchFinallyNodeFields,
  VarDefNodeFields,
  WarningNodeFields,
  type AlgoNodeFieldsProps,
}
