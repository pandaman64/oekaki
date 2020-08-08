import React, { ReactElement, useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import OekakiCanvas from '../../components/canvas'
import { v4 } from 'uuid'

function useWindowResize(): [number, number] {
  const [dimensions, setDimensions] = useState<[number, number]>([0, 0])

  useEffect(() => {
    function listener() {
      setDimensions([window.innerWidth, window.innerHeight])
      console.log(window.innerWidth)
      console.log(window.innerHeight)
    }
    window.addEventListener('resize', listener)
    return () => {
      window.removeEventListener('resize', listener)
    }
  })

  return dimensions
}

export default function Room(): ReactElement {
  const router = useRouter()
  const container = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(640)
  const [canvasHeight, setCanvasHeight] = useState(480)
  const windowDimensions = useWindowResize()
  // hack, may change
  const user_id = useMemo(() => v4(), [])
  console.log('room user id', user_id)

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
  }, [container, windowDimensions])

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
          user_id={user_id}
        />
      </div>
      <style global jsx>{`
        html,
        body {
          margin: 0;
        }
      `}</style>
    </div>
  )
}
