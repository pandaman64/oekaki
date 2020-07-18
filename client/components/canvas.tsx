import React, { useRef, useEffect, useState, useReducer, ReactElement } from 'react'

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
  current_path: Position[]
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

type Command = StartDraw | Drawing | EndDraw

function updateOekakiState(state: OekakiState, command: Command): OekakiState {
  switch (command.type) {
    case 'start':
      return {
        ...state,
        current_path: [command.pos],
      }
    case 'drawing': {
      const current_path = state.current_path.slice()
      current_path.push(command.pos)
      return {
        ...state,
        current_path,
      }
    }
    case 'end': {
      const current_path = state.current_path.slice()
      current_path.push(command.pos)
      const paths = state.paths.slice()
      paths.push(current_path)
      return {
        paths,
        current_path: [],
      }
    }
  }
}

export default function OekakiCanvas(): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState<boolean>(false)
  const [oekakiState, dispatcher] = useReducer(updateOekakiState, {
    paths: [],
    current_path: [],
  })

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
        if (oekakiState.current_path.length > 0) {
          ctx.beginPath()
          ctx.moveTo(oekakiState.current_path[0].x, oekakiState.current_path[0].y)
          oekakiState.current_path.forEach((pos) => {
            ctx.lineTo(pos.x, pos.y)
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
