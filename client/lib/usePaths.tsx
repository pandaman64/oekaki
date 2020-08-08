import { useMemo } from 'react'
import { Operation, Path, Position } from './operation'
import { OpCache } from './useOperation'

export default function usePaths(opCache: OpCache): Position[][] {
  const opPaths = useMemo(() => {
    function pred(op: Operation): op is Path {
      if (op.opcode === 'path') {
        return true
      } else {
        return false
      }
    }
    return opCache.weave.filter(pred).map((op) => op.payload)
  }, [opCache])

  return opPaths
}
