import React, { ReactElement, useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import OekakiCanvas from '../../components/canvas'

export default function Room(): ReactElement {
  const router = useRouter()
  const container = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(640)
  const [canvasHeight, setCanvasHeight] = useState(480)

  useEffect(() => {
    if (container.current != null) {
      const X = 3
      const Y = 2
      const x_ratio = container.current.clientWidth / X
      const y_ratio = container.current.clientHeight / Y
      const ratio = Math.min(x_ratio, y_ratio) - 10 // 10px margin

      setCanvasWidth(X * ratio)
      setCanvasHeight(Y * ratio)
    }
  })

  return (
    <div
      style={{
        margin: 0,
        height: '100vh',
        display: 'flex',
        flexFlow: 'column nowrap',
      }}
    >
      <div>{`room id is ${router.query.room_id}`}</div>
      <Link href="/">
        <a>back to home</a>
      </Link>
      <div
        ref={container}
        style={{
          flex: '1',
        }}
      >
        <OekakiCanvas
          room_id={parseInt(router.query.room_id as string)}
          width={canvasWidth}
          height={canvasHeight}
        />
      </div>
      <style global jsx>{`
        html, body {
          margin: 0;
        }
      `}</style>
    </div>
  )
}
