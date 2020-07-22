import React, { useRef, useEffect, ReactElement } from 'react'
import axios from 'axios'
import useSWR from 'swr'

type Position = {
  x: number
  y: number
}

type ThumbnailProps = {
  room_id: number
  width: number
  height: number
  onClick: () => void | null
}

export default function Thumbnail({
  room_id,
  width,
  height,
  onClick,
}: ThumbnailProps): ReactElement {
  const canvas = useRef<HTMLCanvasElement>(null)
  const { data: paths } = useSWR<Position[][]>(`/api/rooms/${room_id}/path`, (url: string) =>
    axios.get(url).then((res) => res.data)
  )

  // TODO: specify data dependency
  useEffect(() => {
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
      }
    }
  })

  return (
    <div
      style={{
        border: 'solid',
        borderRadius: '10px',
      }}
      onClick={onClick}
    >
      <canvas ref={canvas} width={width.toString()} height={height.toString()}></canvas>
    </div>
  )
}
