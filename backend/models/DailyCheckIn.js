const mongoose = require("mongoose");

const DailyCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().toISOString().split("T")[0],
      index: true,
    },
    mood: {
      type: String,
      enum: ["great", "good", "neutral", "bad", "terrible"],
      default: "neutral",
    },
    energy: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    focus: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    notes: {
      type: String,
      trim: true,
    },
    // ✅ NEW: Realization/insight from the day
    realization: {
      type: String,
      trim: true,
    },
    // ✅ NEW: Guidance updates throughout the day
    guidanceUpdates: [
      {
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Ensure one check-in per user per day
DailyCheckInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyCheckIn", DailyCheckInSchema);
