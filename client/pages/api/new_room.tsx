import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const api = process.env["BACKEND_URL"]
  switch (req.method) {
    case 'POST': {
      const result = await axios.post(`${api}/new_room`)
      return res.json(result.data)
    }
    default: {
      return res.status(405).end()
    }
  }
}
