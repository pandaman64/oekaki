import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const api = process.env['BACKEND_URL']
  console.log(api)
  const result = await axios.get(`${api}/rooms`)
  res.json(result.data)
}
