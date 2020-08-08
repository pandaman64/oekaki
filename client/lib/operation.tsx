import { Position } from './position'

export interface OpInterface {
  opcode: string
  payload: unknown

  user_id: string
  ts: number
  parent_user_id: string
  parent_ts: number
}

export function operationKey(op: OpInterface): string {
  return `${op.ts}@${op.user_id}`
}

type OpOrder = 'less' | 'equal' | 'greater'

export function compareOpImpl(
  left_user_id: string,
  left_ts: number,
  right_user_id: string,
  right_ts: number
): OpOrder {
  if (left_ts < right_ts) {
    return 'less'
  } else if (left_ts > right_ts) {
    return 'greater'
  } else if (left_user_id < right_user_id) {
    return 'less'
  } else if (left_user_id > right_user_id) {
    return 'greater'
  } else {
    return 'equal'
  }
}

export function compareOp(left: OpInterface, right: OpInterface): OpOrder {
  return compareOpImpl(left.user_id, left.ts, right.user_id, right.ts)
}

export function isIdentical(left: OpInterface, right: OpInterface): boolean {
  // (user_id, ts) must identify an operation
  return left.user_id === right.user_id && left.ts === right.ts
}

export type Root = OpInterface & {
  opcode: 'root'
  payload: unknown
}

export type Path = OpInterface & {
  opcode: 'path'
  payload: Position[]
}

export type Operation = Root | Path
