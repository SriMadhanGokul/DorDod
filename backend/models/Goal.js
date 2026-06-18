const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["Career", "Personal", "Health", "Learning", "Finance", "Other"],
      required: [true, "Please select a category"],
      default: "Personal",
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused", "archived"],
      default: "archived",
      lowercase: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      required: [true, "Please select a priority"],
      default: "Medium",
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    duration: {
      type: Number,
      min: [1, "Duration must be at least 1 day"],
      max: [365, "Duration cannot exceed 365 days"],
      required: [true, "Please specify a duration"],
      default: 21,
    },
    targetDate: {
      type: Date,
    },
    linkedHabits: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Habit",
      },
    ],

    // ✅ FIXED: Changed from Map with nested schema to Object type
    // Stores completion data like: {"2026-06-17": {date, dayNumber, completedAt, status}}
    dayCompletion: {
      type: Object,
      default: {},
    },

    completedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Indexes
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Goal", GoalSchema);
