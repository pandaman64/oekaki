export type weaveTraversalResult<T> = {
  endPos: number
  result?: T
}

export function ok<T>(result: T, endPos: number): weaveTraversalResult<T> {
  return {
    endPos,
    result,
  }
}

export function err<T>(endPos: number): weaveTraversalResult<T> {
  return {
    endPos,
  }
}

export type colorResult = {
  latestColor: string
  latestUserId: string
  latestTs: number
}
