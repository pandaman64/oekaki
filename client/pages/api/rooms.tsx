import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const result = await axios.get('http://127.0.0.1:8000/rooms')
  res.json(result.data)
}
