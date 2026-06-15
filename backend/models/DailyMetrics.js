// backend/models/DailyMetrics.js
const mongoose = require("mongoose");

const dailyMetricsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // Alignment Score Components
    goalProgress: {
      type: Number,
      min: 0,
      max: 70,
      default: 0,
    },
    habitCompletion: {
      type: Number,
      min: 0,
      max: 20,
      default: 0,
    },
    reflectionDone: {
      type: Boolean,
      default: false,
    },
    // Final Scores
    alignmentScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Risk Indicator
    riskIndicator: {
      type: Number,
      min: 0,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["Low Risk", "Medium Risk", "High Risk"],
      default: "Low Risk",
    },
    riskDetails: {
      missedGoals: { type: Number, default: 0 },
      missedReflections: { type: Number, default: 0 },
      missedHabits: { type: Number, default: 0 },
      consecutiveMisses: { type: Number, default: 0 },
    },
    // Counts
    goalsCompletedCount: { type: Number, default: 0 },
    activeGoalsCount: { type: Number, default: 0 },
    habitsCompletedCount: { type: Number, default: 0 },
    plannedHabitsCount: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Index for efficient queries
dailyMetricsSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("DailyMetrics", dailyMetricsSchema);
