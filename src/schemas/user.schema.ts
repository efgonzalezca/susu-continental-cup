import { Schema } from 'mongoose';

const selected_teams = new Schema({
  champion: String,
  runner_up: String,
  third_place: String,
}, {_id: false})

export const userSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  password: {
    type: String,
    required: true,
  },
  names: {
    type: String,
    required: true,
  },
  surnames: {
    type: String,
    required: true,
  },
  cellphone: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  selected_teams: {
    type: selected_teams
  },
  podium_score: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'users',
  versionKey: false
})