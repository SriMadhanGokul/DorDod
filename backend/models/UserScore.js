const mongoose = require("mongoose");

const xpEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    levelName: { type: String, default: "🥉 Bronze" },
    streak: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: "" },
    comebackToday: { type: Boolean, default: false },
    history: { type: [xpEventSchema], default: [] },
    weeklyProgress: {
      goalsThisWeek: { type: Number, default: 0 },
      habitsThisWeek: { type: Number, default: 0 },
      weekStart: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

const LEVELS = [
  { level: 1, name: "🥉 Bronze", min: 0 },
  { level: 2, name: "🥈 Silver", min: 500 },
  { level: 3, name: "🥇 Gold", min: 1500 },
  { level: 4, name: "💎 Platinum", min: 3500 },
  { level: 5, name: "👑 Diamond", min: 7500 },
];

userScoreSchema.methods.recalcLevel = function () {
  const lvl =
    [...LEVELS].reverse().find((l) => this.totalXP >= l.min) || LEVELS[0];
  this.level = lvl.level;
  this.levelName = lvl.name;
};

userScoreSchema.statics.LEVELS = LEVELS;
module.exports = mongoose.model("UserScore", userScoreSchema);
