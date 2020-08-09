import React, { ReactElement, useRef, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import OekakiCanvas from '../../components/canvas'
import { v4 } from 'uuid'
import useOperation from '../../lib/useOperation'
import { Operation } from '../../lib/operation'
import axios from 'axios'
import useSWR from 'swr'
import { useDrawTracker } from '../../lib/drawTracker'
import { Collapse } from 'react-collapse'
import { RenderPath } from '../../lib/renderPath'
import { SketchPicker } from 'react-color'
import weaveTraversal from '../../lib/weaveTraversal'

type RenderPathComponentProps = {
  path: RenderPath
  onChangeColor: (color: string) => void
}

function RenderPathComponent({ path, onChangeColor }: RenderPathComponentProps): ReactElement {
  const key = `${path.ts}@${path.user_id}`
  const [isOpened, setIsOpened] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const [color, setColor] = useState('#000')

  return (
    <li key={key}>
      <input
        type="checkbox"
        checked={isOpened}
        onChange={(e) => setIsOpened(e.currentTarget.checked)}
      />
      {`${path.ts}@${path.user_id}`}
      <Collapse isOpened={isOpened} title={key}>
        <div>
          消す:
          <input
            type="checkbox"
            checked={isDeleted}
            onChange={(e) => setIsDeleted(e.currentTarget.checked)}
          />
        </div>
        {
          isOpened ? (
            <SketchPicker
              color={color}
              onChange={(color) => setColor(color.hex)}
              onChangeComplete={(color) => onChangeColor(color.hex)}
            />
          ) : null /* color picker is too heavy */
        }
      </Collapse>
    </li>
  )
}

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

  const renderPaths = useMemo(() => {
    return weaveTraversal(opCache.weave)
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
      <div
        style={{
          display: 'flex',
          flexFlow: 'row nowrap',
        }}
      >
        <Link href="/">
          <a>back to home</a>
        </Link>
      </div>
      <div
        ref={container}
        style={{
          flex: '1',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexFlow: 'row nowrap',
          }}
        >
          <OekakiCanvas
            width={canvasWidth}
            height={canvasHeight}
            renderPaths={renderPaths}
            currentPath={currentPath}
            dispatcher={dispatcher}
          />
          {
            <ul>
              {renderPaths.map((path) => (
                <RenderPathComponent
                  key={`${path.ts}@${path.user_id}`}
                  path={path}
                  onChangeColor={(color) => {
                    opCommandDispatcher({
                      type: 'add',
                      op: {
                        opcode: 'color',
                        payload: color,

                        user_id,
                        ts: opCache.ts + 1,
                        parent_user_id: path.user_id,
                        parent_ts: path.ts,
                      },
                    })
                  }}
                />
              ))}
            </ul>
          }
        </div>
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
