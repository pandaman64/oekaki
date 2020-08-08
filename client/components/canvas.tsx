import React, { useRef, useEffect, useState, useReducer, ReactElement, useMemo } from 'react'
import axios from 'axios'
import useSWR from 'swr'
import useOperation from '../lib/useOperation'
import { Operation, Path } from '../lib/operation'

type MouseEvent = React.MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>

type Position = {
  x: number
  y: number
}

function computeMousePosition(e: MouseEvent): Position {
  const origin = e.currentTarget.getBoundingClientRect()
  return {
    x: (e.clientX - origin.left) / origin.width,
    y: (e.clientY - origin.top) / origin.height,
  }
}

interface StartDraw {
  type: 'start'
  pos: Position
}

interface Drawing {
  type: 'drawing'
  pos: Position
}

interface EndDraw {
  type: 'end'
  pos: Position
}

// done with complete path
interface Done {
  type: 'done'
}

type CurrentPath = Position[]
type Command = StartDraw | Drawing | EndDraw | Done

function useDrawTracker(): [CurrentPath, Position[] | null, React.Dispatch<Command>] {
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

type OekakiCanvasProps = {
  room_id: number
  width: number
  height: number
  user_id: string
}

export default function OekakiCanvas({
  room_id,
  width,
  height,
  user_id,
}: OekakiCanvasProps): ReactElement {
  console.log('canvas id', user_id)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState<boolean>(false)

  const [opCache, opCommandDispatcher] = useOperation()
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
  const { data: weave } = useSWR<Operation[]>(
    Number.isNaN(room_id) ? null : `/api/rooms/${room_id}/operations`,
    (url: string) => axios.get(url).then((res) => res.data),
    {
      refreshInterval: 1000,
    }
  )
  useEffect(() => {
    if (weave !== undefined) {
      const ts = weave.reduce((accum, op) => Math.max(accum, op.ts), 1)
      opCommandDispatcher({
        type: 'merge',
        cache: {
          weave,
          ts,
        },
      })
    }
  }, [weave])

  const [currentPath, completePath, dispatcher] = useDrawTracker()
  useEffect(() => {

    if (completePath !== null) {
      opCommandDispatcher({
        type: 'add',
        op: {
          opcode: 'path',
          payload: completePath,

          parent_user_id: opCache.weave[0].user_id,
          parent_ts: opCache.weave[0].ts,
          user_id,
          ts: opCache.ts + 1,
        },
      })
      dispatcher({ type: 'done' })
    }
  }, [completePath])

  // this can be inefficient as opCache changes when incorporating incoming changes,
  // which doesn't require reposting
  useEffect(() => {
    async function postOperations() {
      await axios.post(`/api/rooms/${room_id}/operations`, opCache.weave)
    }

    postOperations()
  }, [opCache])

  useEffect(() => {
    function strokePath(ctx: CanvasRenderingContext2D, path: Position[]) {
      if (path.length > 0) {
        ctx.beginPath()
        ctx.moveTo(path[0].x * width, path[0].y * height)
        path.forEach((pos) => {
          ctx.lineTo(pos.x * width, pos.y * height)
        })
        ctx.stroke()
      }
    }

    if (canvas.current != null) {
      const ctx = canvas.current.getContext('2d')
      if (ctx != null) {
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)

        // draw determined? paths
        ctx.strokeStyle = 'black'
        opPaths.forEach((path) => strokePath(ctx, path))

        // draw current path
        ctx.strokeStyle = 'red'
        strokePath(ctx, currentPath)
      }
    }
  }, [canvas, opPaths, currentPath])

  return (
    <canvas
      ref={canvas}
      width={width.toString()}
      height={height.toString()}
      style={{
        border: '1px solid',
        touchAction: 'none',
      }}
      onPointerDown={(e) => {
        dispatcher({
          type: 'start',
          pos: computeMousePosition(e),
        })
        setDrawing(true)
      }}
      onPointerUp={(e) => {
        dispatcher({
          type: 'end',
          pos: computeMousePosition(e),
        })
        setDrawing(false)
      }}
      onPointerLeave={(e) => {
        dispatcher({
          type: 'end',
          pos: computeMousePosition(e),
        })
        setDrawing(false)
      }}
      onPointerMove={(e) => {
        if (drawing) {
          dispatcher({
            type: 'drawing',
            pos: computeMousePosition(e),
          })
        }
      }}
    ></canvas>
  )
}
