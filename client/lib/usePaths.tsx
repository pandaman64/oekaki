import { useMemo } from 'react'
import { Position } from './position'
import { Operation, Path } from './operation'
import { OpCache } from './useOperation'

export type RenderPath = {
  path: Position[]
  user_id: string
  ts: number
}

export default function usePaths(opCache: OpCache): RenderPath[] {
  const paths = useMemo(() => {
    function pred(op: Operation): op is Path {
      if (op.opcode === 'path') {
        return true
      } else {
        return false
      }
    }
    return opCache.weave.filter(pred).map((path) => ({
      path: path.payload,
      user_id: path.user_id,
      ts: path.ts,
    }))
  }, [opCache])

  return paths
}
