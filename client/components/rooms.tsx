import React, { ReactElement } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import useSWR from 'swr'
import css from 'styled-jsx/css'
import Link from 'next/link'
import Thumbnail from './thumbnail'

const room_css = css`
  .room {
    width: 200px;
    height: 200px;
    border: dashed;
  }
`

type RoomProps = {
  room_id: number
}

function Room({ room_id }: RoomProps): ReactElement {
  const ThumbnailInLink = React.forwardRef(function ThumbnailInLink(props) {
    const onClick: () => void = (props as any).onClick
    return <Thumbnail room_id={room_id} width={200} height={200} onClick={onClick} />
  })
  return (
    <>
      <Link href={`/rooms/${room_id}`}>
        <ThumbnailInLink />
      </Link>
      <style jsx>{room_css}</style>
    </>
  )
}

function NewRoom(): ReactElement {
  const router = useRouter()
  return (
    <>
      <div
        className="room"
        onClick={async () => {
          const result = await axios.post('/api/new_room')
          router.push(`/rooms/${result.data}`)
        }}
      >
        New Room
      </div>
      <style jsx>{room_css}</style>
    </>
  )
}

export default function Rooms(): ReactElement {
  const { data } = useSWR<number[]>('/api/rooms', (url: string) =>
    axios.get(url).then((res) => res.data)
  )

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
      }}
    >
      {data?.map((room_id) => (
        <Room room_id={room_id} key={room_id.toString()} />
      ))}
      <NewRoom />
    </div>
  )
}
