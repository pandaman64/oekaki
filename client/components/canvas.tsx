import React, { useRef, useEffect, useState, useReducer, ReactElement } from 'react'
import axios from 'axios'

type MouseEvent = React.MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>

type Position = {
  x: number
  y: number
}

function computeMousePosition(e: MouseEvent): Position {
  const origin = e.currentTarget.getBoundingClientRect()
  return {
    x: e.clientX - origin.left,
    y: e.clientY - origin.top,
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
      case "start":
        return [command.pos]
      case "drawing": {
        const ret = state.slice()
        ret.push(command.pos)
        return ret
      }
      case "end": {
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
  room_id: number,
}

export default function OekakiCanvas({ room_id }: OekakiCanvasProps): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState<boolean>(false)
  const [oekakiState, setOekakiState] = useState<OekakiState>({
    paths: []
  })
  const [currentPath, dispatcher] = useDrawTracker((p) => {
    async function postNewPath() {
      await axios.post(`/api/rooms/${room_id}/new_path`, {
        path: p
      })
    }

    postNewPath()
  });

  // TODO: specify data dependency
  useEffect(() => {
    console.log(oekakiState)
    if (canvas.current != null) {
      const ctx = canvas.current.getContext('2d')
      if (ctx != null) {
        ctx.clearRect(0, 0, canvas.current.width, canvas.current.height)

        // draw determined? paths
        ctx.strokeStyle = 'black'
        oekakiState.paths.forEach((path) => {
          if (path.length > 0) {
            ctx.beginPath()
            ctx.moveTo(path[0].x, path[0].y)
            path.forEach((pos) => {
              ctx.lineTo(pos.x, pos.y)
            })
            ctx.stroke()
          }
        })

        // draw current path
        ctx.strokeStyle = 'red'
        if (currentPath.length > 0) {
          ctx.beginPath()
          ctx.moveTo(currentPath[0].x, currentPath[0].y)
          currentPath.forEach((pos) => {
            ctx.lineTo(pos.x, pos.y)
          })
          ctx.stroke()
        }
      }
    }
  })

  useEffect(() => {
    async function runApi() {
      const res = await axios.get(`/api/rooms/${room_id}/path`)
      const paths: Position[][] = res.data
      setOekakiState({
        paths,
      })
    }
    
    const id = setInterval(() => {
      runApi()
    }, 100)

    return () => {
      clearInterval(id)
    }
  })

  return (
    <div>
      <canvas
        ref={canvas}
        width="640"
        height="480"
        style={{
          border: 'solid',
        }}
        onMouseDown={(e) => {
          dispatcher({
            type: 'start',
            pos: computeMousePosition(e),
          })
          setDrawing(true)
        }}
        onMouseUp={(e) => {
          dispatcher({
            type: 'end',
            pos: computeMousePosition(e),
          })
          setDrawing(false)
        }}
        onMouseLeave={(e) => {
          dispatcher({
            type: 'end',
            pos: computeMousePosition(e),
          })
          setDrawing(false)
        }}
        onMouseMove={(e) => {
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
