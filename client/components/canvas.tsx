import React, { useRef, useState, ReactElement, useEffect } from 'react'
import { CurrentPath, Command } from '../lib/drawTracker'
import { Position } from '../lib/position'
import { RenderPath } from '../lib/renderPath'

type MouseEvent = React.MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>

function computeMousePosition(e: MouseEvent): Position {
  const origin = e.currentTarget.getBoundingClientRect()
  return {
    x: (e.clientX - origin.left) / origin.width,
    y: (e.clientY - origin.top) / origin.height,
  }
}

type OekakiCanvasProps = {
  width: number
  height: number
  renderPaths: RenderPath[]
  currentPath: CurrentPath
  dispatcher: React.Dispatch<Command>
}

export default function OekakiCanvas({
  width,
  height,
  renderPaths: opPaths,
  currentPath,
  dispatcher,
}: OekakiCanvasProps): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState<boolean>(false)

  useEffect(() => {
    function strokePath(ctx: CanvasRenderingContext2D, path: Position[], color: string) {
      ctx.strokeStyle = color
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
        opPaths.forEach((renderPath) =>
          strokePath(ctx, renderPath.path, renderPath.color?.latestColor ?? 'black')
        )

        // draw current path
        strokePath(ctx, currentPath, 'red')
      }
    }
  })

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
