import React, { ReactElement } from 'react'
import { useRouter } from 'next/router'
import OekakiCanvas from '../../components/canvas'

export default function Room(): ReactElement {
  const router = useRouter()

  return (
    <>
      <div>{`room id is ${router.query.room_id}`}</div>
      <OekakiCanvas room_id={parseInt(router.query.room_id as string)} width={640} height={480} />
    </>
  )
}
