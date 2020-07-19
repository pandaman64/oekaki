import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type Position = {
    x: number,
    y: number,
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case 'POST':
            const {
                query: {room_id}
            } = req
            
            console.log(req.body)
            const path: Position[] = req.body.path
            const xs = path.map((p) => p.x)
            const ys = path.map((p) => p.y)

            await axios.post(`http://localhost:8000/rooms/${room_id}/new_path`, {
                xs,
                ys,
            })

            res.status(200).json({})
            break
        default:
            res.status(405).end()
            break
    }
}