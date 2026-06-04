const mongoose = require('mongoose');

const pointEventSchema = new mongoose.Schema({
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  type: {
    type: String,
    enum: ['habit_complete', 'daily_bonus', 'weekly_bonus', 'penalty'],
    required: true
  },
  points: { type: Number, required: true }, // positive or negative
  description: { type: String },
  routineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Routine' }
}, { _id: false, timestamps: false });

const routinePointsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  totalPoints:  { type: Number, default: 0 }, // current balance (gained - lost, floor 0)
  totalGained:  { type: Number, default: 0 }, // cumulative positive points ever earned
  totalLost:    { type: Number, default: 0 }, // cumulative penalty points ever lost (stored as positive)
  weeklyPoints: { type: Number, default: 0 }, // resets every Monday
  weekStart:    { type: String, default: null },
  events: [pointEventSchema]
}, { timestamps: true });

routinePointsSchema.index({ totalPoints: -1 }); // leaderboard sort

module.exports = mongoose.model('RoutinePoints', routinePointsSchema);