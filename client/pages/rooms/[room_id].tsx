import React, { ReactElement, useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import OekakiCanvas from '../../components/canvas'
import { v4 } from 'uuid'
import useOperation from '../../lib/useOperation'
import { Operation, Path } from '../../lib/operation'
import axios from 'axios'
import useSWR from 'swr'
import { useDrawTracker } from '../../lib/drawTracker'

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
  const room_id = router.query.room_id
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
    room_id === undefined ? null : `/api/rooms/${room_id}/operations`,
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
      if (room_id !== undefined) {
        await axios.post(`/api/rooms/${room_id}/operations`, opCache.weave)
      }
    }

    postOperations()
  }, [opCache])

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
          width={canvasWidth}
          height={canvasHeight}
          user_id={user_id}
          opPaths={opPaths}
          currentPath={currentPath}
          dispatcher={dispatcher}
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
