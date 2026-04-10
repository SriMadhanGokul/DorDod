const mongoose = require("mongoose");

const habitSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    days: { type: [Boolean], default: Array(21).fill(false) },
    reminderTime: { type: String, default: null }, // "08:00"
    frequency: {
      type: String,
      enum: ["daily", "weekdays", "weekends"],
      default: "daily",
    },
    fromActivity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      default: null,
    },
    fromGoal: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Habit", habitSchema);
