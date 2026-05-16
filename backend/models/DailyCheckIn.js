const mongoose = require("mongoose");

const checkInSlotSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ["Morning", "Midday", "Evening"],
      required: true,
    },
    state: {
      type: String,
      enum: [
        "Calm",
        "Focused",
        "Stressed",
        "Distracted",
        "Energized",
        "Clear",
        "Confused",
        "Avoiding",
        "Anxious",
      ],
      required: true,
    },
    note: { type: String, default: "" },
    time: { type: String, default: "" }, // e.g. "09:10 AM"
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const dailyCheckInSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'

    // Up to 3 check-ins per day (Morning / Midday / Evening)
    slots: { type: [checkInSlotSchema], default: [] },

    // Latest state (last slot's state — used for insight engine)
    dailyState: {
      type: String,
      enum: [
        "Calm",
        "Focused",
        "Stressed",
        "Distracted",
        "Energized",
        "Clear",
        "Confused",
        "Avoiding",
        "Anxious",
      ],
      default: "Focused",
    },
    avoidingText: { type: String, default: "" },
    mattersTodayText: { type: String, default: "" },

    // Derived
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
    clarityScore: { type: Number, default: 0 },

    // Realization
    realization: { type: String, default: "" },
    realizationTags: { type: [String], default: [] },

    // Post-guidance
    guidanceSessionDone: { type: Boolean, default: false },
    guidanceGoalUpdate: { type: String, default: "" },
    guidanceBehaviorSugg: { type: String, default: "" },
    guidanceInsight: { type: String, default: "" },
  },
  { timestamps: true },
);

dailyCheckInSchema.index({ user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("DailyCheckIn", dailyCheckInSchema);
