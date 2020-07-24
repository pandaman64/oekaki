import React, { useRef, useEffect, useState, useReducer, ReactElement } from 'react'
import axios from 'axios'
import useSWR from 'swr'

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

type OekakiState = {
  paths: Position[][]
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

type CurrentPath = Position[]
type Command = StartDraw | Drawing | EndDraw

function useDrawTracker(cb: (path: Position[]) => void): [CurrentPath, React.Dispatch<Command>] {
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
        post_state.push(command.pos)
        cb(post_state)
        return []
      }
    }
  }

  return useReducer(update, [])
}

type OekakiCanvasProps = {
  room_id: number
  width: number
  height: number
}

export default function OekakiCanvas({ room_id, width, height }: OekakiCanvasProps): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState<boolean>(false)
  // TODO: I don't know why room_id can be a NaN
  const { data: paths } = useSWR<Position[][]>(
    Number.isNaN(room_id) ? null : `/api/rooms/${room_id}/path`,
    (url: string) => axios.get(url).then((res) => res.data),
    {
      refreshInterval: 200,
    }
  )
  const [currentPath, dispatcher] = useDrawTracker((p) => {
    async function postNewPath() {
      await axios.post(`/api/rooms/${room_id}/new_path`, {
        path: p,
      })
    }

    postNewPath()
  })

  // TODO: specify data dependency
  useEffect(() => {
    console.log(paths)
    if (canvas.current != null) {
      const ctx = canvas.current.getContext('2d')
      if (ctx != null) {
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)

        // draw determined? paths
        ctx.strokeStyle = 'black'
        paths?.forEach((path) => {
          if (path.length > 0) {
            ctx.beginPath()
            ctx.moveTo(path[0].x * width, path[0].y * height)
            path.forEach((pos) => {
              ctx.lineTo(pos.x * width, pos.y * height)
            })
            ctx.stroke()
          }
        })

        // draw current path
        ctx.strokeStyle = 'red'
        if (currentPath.length > 0) {
          ctx.beginPath()
          ctx.moveTo(currentPath[0].x * width, currentPath[0].y * height)
          currentPath.forEach((pos) => {
            ctx.lineTo(pos.x * width, pos.y * height)
          })
          ctx.stroke()
        }
      }
    }
  })

  return (
    <div>
      <canvas
        ref={canvas}
        width={width.toString()}
        height={height.toString()}
        style={{
          border: 'solid',
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
    </div>
  )
}
