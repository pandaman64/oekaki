import React, { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import OekakiCanvas from '../../components/canvas'

export default function Room(): ReactElement {
  const router = useRouter()

  return (
    <>
      <div>{`room id is ${router.query.room_id}`}</div>
      <Link href='/'>
        <a>back to home</a>
      </Link>
      <OekakiCanvas room_id={parseInt(router.query.room_id as string)} width={640} height={480} />
    </>
  )
}
