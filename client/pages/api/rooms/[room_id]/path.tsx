import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type ApiResult = {
  xs: number[]
  ys: number[]
}[]

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const api = process.env["BACKEND_URL"]
  const {
    query: { room_id },
  } = req

  const result = await axios.get(`${api}/rooms/${room_id}/path`)
  const data: ApiResult = result.data
  const ret = data.map((elem) =>
    elem.xs.map((x, i) => ({
      x,
      y: elem.ys[i],
    }))
  )
  res.json(ret)
}
