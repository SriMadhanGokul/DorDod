const mongoose = require("mongoose");

const dailyCheckInSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'

    // State + follow-ups
    dailyState: {
      type: String,
      enum: ["Clear", "Confused", "Avoiding", "Focused", "Anxious"],
      required: true,
    },
    avoidingText: { type: String, default: "" },
    mattersTodayText: { type: String, default: "" },

    // Derived flags
    avoidanceFlag: { type: Boolean, default: false },
    loopType: {
      type: String,
      enum: ["Avoidance", "Overthinking", "Inconsistency", "None"],
      default: "None",
    },
    loopSeverity: {
      type: String,
      enum: ["Low", "Medium", "High", "None"],
      default: "None",
    },

    // Clarity score 0-100
    clarityScore: { type: Number, default: 0 },

    // Today's realization with tags
    realization: { type: String, default: "" },
    realizationTags: { type: [String], default: [] }, // e.g. ['Avoidance','Clarity','Fear']

    // Guidance session context (set after Guidance session)
    guidanceSessionDone: { type: Boolean, default: false },
    guidanceGoalUpdate: { type: String, default: "" },
    guidanceBehaviorSugg: { type: String, default: "" },
    guidanceInsight: { type: String, default: "" },
  },
  { timestamps: true },
);

dailyCheckInSchema.index({ user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("DailyCheckIn", dailyCheckInSchema);
