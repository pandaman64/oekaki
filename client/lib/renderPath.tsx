import { Position } from './position'
import { ColorResult, ShowResult } from './result'

export type RenderPath = {
  path: Position[]
  user_id: string
  ts: number
  color?: ColorResult
  show?: ShowResult
}
