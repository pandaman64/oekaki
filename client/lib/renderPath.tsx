import { Position } from './position'
import { colorResult } from './result'

export type RenderPath = {
  path: Position[]
  user_id: string
  ts: number
  color?: colorResult
}
