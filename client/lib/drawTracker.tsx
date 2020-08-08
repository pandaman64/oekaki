import { useState, useReducer } from 'react'
import { Position } from '../lib/position'

export interface StartDraw {
  type: 'start'
  pos: Position
}

export interface Drawing {
  type: 'drawing'
  pos: Position
}

export interface EndDraw {
  type: 'end'
  pos: Position
}

// done with complete path
export interface Done {
  type: 'done'
}

export type CurrentPath = Position[]
export type Command = StartDraw | Drawing | EndDraw | Done

export function useDrawTracker(): [CurrentPath, Position[] | null, React.Dispatch<Command>] {
  const [completePath, setCompletePath] = useState<Position[] | null>(null)
  function update(state: CurrentPath, command: Command): CurrentPath {
    switch (command.type) {
      case 'start':
        return [command.pos]
      case 'drawing': {
        const ret = state.slice()
        ret.push(command.pos)
        return ret
      }
      case 'end': {
        const post_state = state.slice()
        if (post_state.length >= 1) {
          post_state.push(command.pos)
          setCompletePath(post_state)
        }
        return []
      }
      case 'done':
        setCompletePath(null)
        return state
    }
  }
  const [state, dispatcher] = useReducer(update, [])

  return [state, completePath, dispatcher]
}
