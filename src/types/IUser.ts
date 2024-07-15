import { Types } from 'mongoose';

export interface IUser {
  _id: string,
  role: 'admin' | 'user',
  password: string,
  names: string,
  surnames: string,
  cellphone: string,
  score: number,
  selected_teams: {
    champion: string,
    runner_up: string,
    third_place: string
  },
  podium_score: number,
  is_active: boolean
}

export interface IMatchResult {
  _id: Types.ObjectId,
  user_id: string,
  match_id: string,
  local_score: number,
  visitor_score: number,
  points: number
}