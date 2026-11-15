import type { AlgoNode } from "../types"

export interface AlgoNodeFieldsProps {
  node: AlgoNode
  onChange: (updated: AlgoNode) => void
}
