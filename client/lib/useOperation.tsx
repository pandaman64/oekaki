import { Operation, compareOp, compareOpImpl } from './operation'
import { useReducer, Dispatch } from 'react'

/*
class CausalTree {
    // An array of operations, where the elements are ordered by the pre-order traversal of the tree
    // where the most recent child is traversed first
    weave: Operation[] = [];

    // Operations ordered by timestamp, issued by each user
    yarns: Map<string, Operation[]> = new Map();

    // Lamport timestamp
    ts: number = 1;

    add(op: Operation) {
        // insert the operation at the last of the corresponding user's yarn
        // the operation must be the latest one issued by the user
        let yarn = this.yarns.get(op.user_id)
        if (yarn !== undefined) {
            if (yarn[yarn.length - 1].ts >= op.ts) {
                console.error("invalid operation: last = ", yarn[yarn.length - 1], "current = ", op)
            }
            yarn.push(op)
        } else {
            this.yarns.set(op.user_id, [op])
        }

        // insert the operation into the weave while maintaining the traversal order
        // we find the first element such that its parent's timestamp is sooner than the target,
        // and insert the target just before the found operation
        // TODO: this is a naive O(n^2) implementation. figure out a smarter O(n) one

        // first, find the parent.
        const parentIndex = this.weave.findIndex(v => v.user_id === op.parent_user_id && v.ts === op.parent_ts)
        if (parentIndex == -1) {
            console.error('parent not found: {}', op)
            return
        }
        // next, find the element that will be the next element after insertion
        const nextIndex = this.weave.findIndex((v, idx) => {
            if (idx <= parentIndex) {
                return false
            } else {
                return v.parent_ts < op.ts
            }
        })

        // update timestamp
        this.ts = Math.max(this.ts, op.ts)
    }
}
*/

type OpCache = {
  // An array of operations, where the elements are ordered by the pre-order traversal of the tree
  // where the most recent child is traversed first
  weave: Operation[]

  ts: number

  // Operations ordered by timestamp, issued by each user
  // yarns: Map<string, Operation[]>;
}

// given a weave and index of the root of the subtree,
// return the index past the end of the subtree
function calculateEndPos(weave: Operation[], index: number): number {
  const root = weave[index]
  // find the first element whose parent is sooner than the root
  // if such an element exists, its index is the desired one
  const end = weave.findIndex((v, i) => i > index && v.parent_ts < root.ts)
  // if not found, return the end of the array
  if (end == -1) {
    return weave.length
  } else {
    return end
  }
}

// I don't know consice way to copy elements without creating a new array
function pushRange<T>(to: T[], from: T[], start: number, end: number) {
  for (let i = start; i < end; i++) {
    to.push(from[i])
  }
}

export function merge(left: OpCache, right: OpCache): OpCache {
  const merged = []
  let leftIndex = 0
  let rightIndex = 0

  while (leftIndex < left.weave.length || rightIndex < right.weave.length) {
    if (leftIndex == left.weave.length) {
      merged.push(right.weave[rightIndex])
      rightIndex++
    } else if (rightIndex == right.weave.length) {
      merged.push(left.weave[leftIndex])
      leftIndex++
    } else {
      // insert greater subtree
      switch (compareOp(left.weave[leftIndex], right.weave[rightIndex])) {
        case 'equal':
          merged.push(left.weave[leftIndex])
          leftIndex++
          rightIndex++
          break

        // right subtree is greater
        case 'less':
          {
            const nextRightIndex = calculateEndPos(right.weave, rightIndex)
            pushRange(merged, right.weave, rightIndex, nextRightIndex)
            rightIndex = nextRightIndex
          }
          break
        // left subtree is greater
        case 'greater':
          {
            const nextLeftIndex = calculateEndPos(left.weave, leftIndex)
            pushRange(merged, left.weave, leftIndex, nextLeftIndex)
            leftIndex = nextLeftIndex
          }
          break
      }
    }
  }

  const left_ts = left.weave.reduce((accum, op) => Math.max(accum, op.ts), 1)
  const right_ts = right.weave.reduce((accum, op) => Math.max(accum, op.ts), 1)

  return {
    weave: merged,
    ts: Math.max(left_ts, right_ts) + 1,
  }
}

export function addOp(cache: OpCache, op: Operation): OpCache {
  if (op.ts <= cache.ts) {
    console.error('timestamp is not greater than cache', op)
    return cache
  }
  const parentIndex = cache.weave.findIndex(
    (v) => compareOpImpl(v.user_id, v.ts, op.parent_user_id, op.parent_ts) === 'equal'
  )
  if (parentIndex == -1) {
    console.error('parent not found', op)
    return cache
  }
  const ret = {
    weave: cache.weave.slice(),
    ts: op.ts,
  }
  let insertIndex = ret.weave.findIndex((v, i) => i > parentIndex && v.parent_ts < op.ts)
  if (insertIndex == -1) {
    insertIndex = ret.weave.length
  }
  ret.weave.splice(insertIndex, 0, op)

  return ret
}

type Command =
  | {
      type: 'merge'
      cache: OpCache
    }
  | {
      type: 'add'
      op: Operation
    }

export default function useOperation(): [OpCache, Dispatch<Command>] {
  function reducer(state: OpCache, command: Command) {
    switch (command.type) {
      case 'merge':
        return merge(state, command.cache)
      case 'add':
        return addOp(state, command.op)
    }
  }
  const [opCache, dispatcher] = useReducer(reducer, {
    weave: [
      {
        opcode: 'root',
        payload: {},

        user_id: '8aae574e-50b7-4978-86f5-a2ba7cf3b12e',
        ts: 1,
        parent_user_id: '8aae574e-50b7-4978-86f5-a2ba7cf3b12e',
        parent_ts: 1,
      },
    ],
    ts: 2,
  })

  return [opCache, dispatcher]
}
