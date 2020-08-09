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

export type ColorResult = {
  latestColor: string
  latestUserId: string
  latestTs: number
}

export type Vote = {
  ts: number
  vote: boolean
}

export type ShowResult = {
  latestVotes: Map<string, Vote>
}

export function accumulateVotes(
  latestVotes: Map<string, Vote>
): {
  show: number
  noShow: number
} {
  const votes = latestVotes.values()
  let show = 0
  let noShow = 0
  if (votes !== undefined) {
    for (const vote of votes) {
      if (vote.vote) {
        show++
      } else {
        noShow++
      }
    }
  }
  return {
    show,
    noShow,
  }
}
