import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type ApiResult = {
    xs: number[],
    ys: number[],
}[]

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const {
        query: { room_id }
    } = req

    const result = await axios.get(`http://127.0.0.1:8000/rooms/${room_id}/path`, { proxy: false })
    const data: ApiResult = result.data
    const ret = data.map((elem) => elem.xs.map((x, i) => (
        {
            x,
            y: elem.ys[i]
        }
    )))
    res.json(ret)
}