import { useMemo } from 'react'
import { Operation, Path, Position } from './operation'
import { OpCache } from './useOperation'

export type RenderPath = {
  path: Position[]
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
    }))
  }, [opCache])

  return paths
}
