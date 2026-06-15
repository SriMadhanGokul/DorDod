const mongoose = require("mongoose");

const HabitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Habit title required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly"],
      default: "Daily",
    },
    // ✅ NEW: Time slot fields
    timeStart: {
      type: String, // HH:MM format
      default: "05:00",
    },
    timeEnd: {
      type: String, // HH:MM format
      default: "06:00",
    },
    linkedGoal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedOn: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Completed", "Missed"],
      default: "Active",
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ✅ NEW: Tracking history (last 7-30 days)
    tracking: [
      {
        date: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ["completed", "missed", "pending"],
          default: "pending",
        },
        completedAt: {
          type: Date, // When it was marked as completed
        },
        markedAt: {
          type: Date, // When user marked it
        },
      },
    ],
  },
  { timestamps: true },
);

// Index for fast queries
HabitSchema.index({ userId: 1, createdAt: -1 });
HabitSchema.index({ userId: 1, linkedGoal: 1 });

module.exports = mongoose.model("Habit", HabitSchema);
