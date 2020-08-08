import React, { useRef, useEffect, ReactElement } from 'react'
import { RenderPath } from '../lib/usePaths'

type Position = {
  x: number
  y: number
}

type ThumbnailProps = {
  width: number
  height: number
  opPaths: RenderPath[]
  onClick: () => void | null
}

export default function Thumbnail({
  width,
  height,
  opPaths,
  onClick,
}: ThumbnailProps): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null)

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
        opPaths.forEach((path) => strokePath(ctx, path.path))
      }
    }
  })

  return (
    <div
      style={{
        border: 'solid',
        borderRadius: 10,
        margin: 20,
      }}
      onClick={onClick}
    >
      <canvas ref={canvas} width={width.toString()} height={height.toString()}></canvas>
    </div>
  )
}
