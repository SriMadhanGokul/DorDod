const mongoose = require("mongoose");

const alignmentScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: false,
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },
    // Daily Aligned Score: combination of goals, habits, check-in
    dailyAlignedScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Components of DAS
    goalCompletionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    habitCompletionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    checkInScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Alignment Trend Score: 0.3 × DAS_today + 0.7 × ATS_yesterday
    alignmentTrendScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Consistency: (Days DAS ≥ 50 / 30) × 100
    consistency: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Final Alignment Index: (ATS × 0.7) + (Consistency × 0.3)
    finalAlignmentIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Metadata
    isAboveThreshold: {
      type: Boolean,
      default: false, // true if DAS ≥ 50
    },
  },
  { timestamps: true },
);

// Compound unique index: user + date
alignmentScoreSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("AlignmentScore", alignmentScoreSchema);
