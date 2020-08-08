import React, { ReactElement } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import useSWR from 'swr'
import Link from 'next/link'
import Thumbnail from './thumbnail'

type RoomProps = {
  room_id: number
}

function Room({ room_id }: RoomProps): ReactElement {
  const ThumbnailInLink = React.forwardRef(function ThumbnailInLink(props, ref) {
    const onClick: () => void = (props as any).onClick
    return <Thumbnail room_id={room_id} width={300} height={200} onClick={onClick} />
  })
  return (
    <>
      <Link href={`/rooms/${room_id}`}>
        <ThumbnailInLink />
      </Link>
    </>
  )
}

function NewRoom(): ReactElement {
  const router = useRouter()
  return (
    <div
      style={{
        width: 300,
        height: 200,
        margin: 20,
        border: 'dashed',
        boxSizing: 'content-box',
      }}
      onClick={async () => {
        const result = await axios.post('/api/new_room')
        router.push(`/rooms/${result.data}`)
      }}
    >
      New Room
    </div>
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
        justifyContent: 'space-between',
      }}
    >
      {data?.map((room_id) => (
        <Room room_id={room_id} key={room_id.toString()} />
      ))}
      <NewRoom />
    </div>
  )
}
