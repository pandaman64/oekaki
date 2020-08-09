import { Operation } from './operation'
import { calculateEndPos, isEndPos } from './useOperation'
import { RenderPath } from './renderPath'
import { weaveTraversalResult, ColorResult, ok, err, ShowResult, Vote } from './result'

function doColor(weave: Operation[], index: number): weaveTraversalResult<ColorResult> {
  const rootIndex = index
  const root = weave[rootIndex]
  switch (root.opcode) {
    case 'color': {
      // Last-Writer-Win
      // assuming that children is ordered from latest to oldest,
      // we can skip after the first valid color subtree
      let childrenResult: ColorResult | undefined = undefined
      index++
      while (index < weave.length && !isEndPos(weave, rootIndex, index)) {
        if (childrenResult === undefined) {
          const { endPos, result } = doColor(weave, index)
          index = endPos
          childrenResult = result
        } else {
          index = calculateEndPos(weave, index)
        }
      }
      if (childrenResult === undefined) {
        return ok(
          {
            latestColor: root.payload,
            latestUserId: root.user_id,
            latestTs: root.ts,
          },
          index
        )
      } else {
        return ok(childrenResult, index)
      }
    }
    default:
      console.error('not a color', root)
      return err(calculateEndPos(weave, index))
  }
}

// a bit impure (modifying latestVotes)
function doShow(
  weave: Operation[],
  index: number,
  latestVotes: Map<string, Vote>
): weaveTraversalResult<ShowResult> {
  const rootIndex = index
  const root = weave[rootIndex]
  switch (root.opcode) {
    case 'show': {
      // choose majority. show by default
      // we choose latest votes for each user
      // an adversary can impersonate other voters :)
      const current = latestVotes.get(root.user_id)
      if (current === undefined || current.ts < root.ts) {
        latestVotes.set(root.user_id, {
          ts: root.ts,
          vote: root.payload,
        })
      }
      index++
      while (index < weave.length && !isEndPos(weave, rootIndex, index)) {
        const { endPos, result } = doShow(weave, index, latestVotes)
        index = endPos
        if (result !== undefined) {
          result.latestVotes.forEach((vote, userId) => {
            const current = latestVotes.get(userId)
            if (current === undefined || current.ts < vote.ts) {
              latestVotes.set(userId, vote)
            }
          })
        }
      }
      return ok(
        {
          latestVotes,
        },
        index
      )
    }
    default:
      console.error('not a delete', root)
      return err(calculateEndPos(weave, index))
  }
}

function doPath(weave: Operation[], index: number): weaveTraversalResult<RenderPath> {
  const rootIndex = index
  const root = weave[rootIndex]
  switch (root.opcode) {
    case 'path': {
      // a path has zero or more color/delete children
      // as color is LWW, we only check first subtree
      let color: ColorResult | undefined = undefined
      let latestVotes = new Map<string, Vote>()

      index++
      while (index < weave.length && !isEndPos(weave, rootIndex, index)) {
        switch (weave[index].opcode) {
          case 'color':
            {
              if (color === undefined) {
                const { endPos, result } = doColor(weave, index)
                index = endPos
                color = result
              } else {
                index = calculateEndPos(weave, index)
              }
            }
            break
          case 'show':
            {
              const { endPos, result } = doShow(weave, index, latestVotes)
              index = endPos
              if (result !== undefined) {
                latestVotes = result.latestVotes
              }
            }
            break
          default:
            console.warn('unexpected operation below path', weave[index])
            index = calculateEndPos(weave, index)
        }
      }
      return ok(
        {
          path: root.payload,
          user_id: root.user_id,
          ts: root.ts,
          color,
          show: {
            latestVotes,
          },
        },
        index
      )
    }

    default:
      console.error('not a path', root)
      return err(calculateEndPos(weave, index))
  }
}

function doRoot(weave: Operation[], index: number): weaveTraversalResult<RenderPath[]> {
  const rootIndex = index
  const root = weave[index]
  switch (root.opcode) {
    case 'root': {
      // aggregate paths
      const paths: RenderPath[] = []
      index++
      while (index < weave.length && !isEndPos(weave, rootIndex, index)) {
        const { endPos, result } = doPath(weave, index)
        index = endPos
        if (result !== undefined) {
          paths.push(result)
        }
      }
      return ok(paths, index)
    }

    default:
      console.error('not a root', weave[index])
      return err(calculateEndPos(weave, index))
  }
}

export default function weaveTraversal(weave: Operation[]): RenderPath[] {
  const { result } = doRoot(weave, 0)
  if (result !== undefined) {
    return result
  } else {
    return []
  }
}
