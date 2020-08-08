import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const api = process.env['BACKEND_URL']
  const {
    query: { room_id },
  } = req
  const url = `${api}/rooms/${room_id}/operations`

  switch (req.method) {
    case 'GET':
      {
        const result = await axios.get(url)
        res.json(result.data)
      }
      break

    case 'POST':
      {
        await axios.post(url, req.body)
        res.status(200).json({})
      }
      break

    default:
      res.status(405).end()
  }
}
