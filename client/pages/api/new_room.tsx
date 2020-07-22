import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  switch (req.method) {
    case 'POST': {
      const result = await axios.post('http://127.0.0.1:8000/new_room')
      return res.json(result.data)
    }
    default: {
      return res.status(405).end()
    }
  }
}
