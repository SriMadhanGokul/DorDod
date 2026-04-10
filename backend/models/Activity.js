const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "inprogress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    dueDate: { type: Date },

    // Links
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },
    subGoalId: { type: String, default: null }, // subgoal _id as string
    goalTitle: { type: String, default: "" }, // denormalized for display

    // Tracking
    addedToHabit: { type: Boolean, default: false },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Habit",
      default: null,
    },
    addedToAchievement: { type: Boolean, default: false },

    // Auto-suggested flag
    autoSuggested: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Activity", activitySchema);
